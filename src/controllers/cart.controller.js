import prisma from '../lib/prisma.js';

// GET /api/cart
export const getCart = async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(200).json({ success: true, items: [] });
        }

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        return res.status(200).json({
            success: true,
            items: cart?.items || []
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/cart/sync (Merges localStorage cart on login or updates current basket)
export const syncCart = async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { items } = req.body;
        console.log(`[CART_SYNC] User: ${userId} | Received items:`, items);

        // 1. Ensure user cart exists
        const cart = await prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId }
        });

        // 2. Persist items if an array is passed
        if (Array.isArray(items) && items.length > 0) {
            const operations = items
                .map(item => {
                    const devId = item.deviceId || item.id;
                    if (!devId) return null;

                    const qty = parseInt(item.qty ?? item.quantity ?? 1, 10) || 1;
                    const price = parseInt(item.price ?? 0, 10) || 0;
                    const name = item.name || 'Hardware Device';

                    return prisma.cartItem.upsert({
                        where: {
                            cartId_deviceId: {
                                cartId: cart.id,
                                deviceId: String(devId)
                            }
                        },
                        update: {
                            quantity: qty,
                            price: price,
                            name: name
                        },
                        create: {
                            cartId: cart.id,
                            deviceId: String(devId),
                            name: name,
                            price: price,
                            quantity: qty
                        }
                    });
                })
                .filter(Boolean);

            if (operations.length > 0) {
                await prisma.$transaction(operations);
            }
        }

        const updated = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: true }
        });

        console.log(`[CART_SYNC] Successfully stored ${updated?.items?.length || 0} items for cart: ${cart.id}`);

        return res.status(200).json({ success: true, items: updated?.items || [] });
    } catch (error) {
        console.error('Error syncing cart:', error);
        return res.status(500).json({ success: false, message: 'Sync failed' });
    }
};

// DELETE /api/cart/item/:deviceId
export const removeCartItem = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const { deviceId } = req.params;

        if (!userId) return res.status(401).json({ success: false });

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id, deviceId: String(deviceId) }
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error removing cart item:', error);
        return res.status(500).json({ success: false });
    }
};

// DELETE /api/cart/clear
export const clearCart = async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) return res.status(401).json({ success: false });

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error clearing cart:', error);
        return res.status(500).json({ success: false });
    }
};