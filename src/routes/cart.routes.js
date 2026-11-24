import { Router } from 'express';
import { getCart, syncCart, removeCartItem, clearCart } from '../controllers/cart.controller.js';

const router = Router();

router.get('/', getCart);
router.post('/sync', syncCart);
router.delete('/item/:deviceId', removeCartItem);
router.delete('/clear', clearCart);

export default router;