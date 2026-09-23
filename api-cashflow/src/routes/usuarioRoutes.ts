import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rotas Públicas
router.post('/', UsuarioController.criar);
router.post('/login', UsuarioController.login);

// Rotas Protegidas (Exigem Token JWT)
router.post('/logout', authMiddleware, UsuarioController.logout as any);
router.get('/', authMiddleware, UsuarioController.buscarTodos as any);
router.get('/:id', authMiddleware, UsuarioController.buscarPorId as any);

export default router;