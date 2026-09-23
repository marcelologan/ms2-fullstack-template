import { Router } from 'express';
import { MovimentacaoController } from '../controllers/movimentacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Aplica a proteção JWT para TODAS as rotas deste arquivo automaticamente
router.use(authMiddleware as any);

// Endpoints (CRUD)
router.post('/', MovimentacaoController.criar as any);
router.get('/', MovimentacaoController.listar as any);
router.get('/:id', MovimentacaoController.buscarPorId as any);
router.patch('/:id', MovimentacaoController.atualizar as any); // Usamos PATCH pois a atualização é parcial
router.delete('/:id', MovimentacaoController.deletar as any);

export default router;