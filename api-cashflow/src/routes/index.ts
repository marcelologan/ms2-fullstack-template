import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import movimentacaoRoutes from './movimentacaoRoutes'; // Importa a nova rota

const router = Router();

router.use('/usuarios', usuarioRoutes); // Tiramos o /api daqui
router.use('/movimentacoes', movimentacaoRoutes); // Registra no prefixo /movimentacoes

export default router;