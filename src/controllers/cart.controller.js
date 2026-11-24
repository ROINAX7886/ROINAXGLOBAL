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

        const { items } = req.body; // Array of { id, name, price, qty }

        // Ensure cart container exists for user
        const cart = await prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId }
        });

        if (Array.isArray(items)) {
            for (const item of items) {
                await prisma.cartItem.upsert({
                    where: {
                        cartId_deviceId: {
                            cartId: cart.id,
                            deviceId: item.id
                        }
                    },
                    update: {
                        quantity: item.qty
                    },
                    create: {
                        cartId: cart.id,
                        deviceId: item.id,
                        name: item.name,
                        price: Number(item.price),
                        quantity: Number(item.qty)
                    }
                });
            }
        }

        const updated = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: true }
        });

        return res.status(200).json({ success: true, items: updated.items });
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
                where: { cartId: cart.id, deviceId }
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
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
        return res.status(500).json({ success: false });
    }
};