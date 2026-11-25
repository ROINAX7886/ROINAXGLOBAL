import express from 'express';
import {
    getCart,
    addCartItem,
    updateCartItemQty,
    removeCartItem,
    clearCart
} from '../controllers/cart.controller.js';

const router = express.Router();

// Publicly reachable (Server-session tracks guest vs user automatically)
router.get('/', getCart);
router.post('/add', addCartItem);
router.post('/update-qty', updateCartItemQty);
router.delete('/item/:deviceId', removeCartItem);
router.delete('/clear', clearCart);

export default router;