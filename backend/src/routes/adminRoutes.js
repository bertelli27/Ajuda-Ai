const express = require('express');
const router = express.Router();

// Importe os seus Middlewares (Ajuste o caminho se necessário)
const { verificarToken } = require('../middlewares/authMiddleware'); // O seu middleware original que valida o JWT
const { verificarAdmin } = require('../middlewares/adminMiddleware'); // O novo que acabamos de criar

const adminController = require('../controllers/adminController');

// 🛡️ BARREIRA DUPLA: Todas as rotas abaixo exigem Token Válido + Ser Administrador
router.use(verificarToken, verificarAdmin);

// Rotas da Administração
router.get('/usuarios', adminController.listarUsuarios);
router.put('/usuarios/:id/banir', adminController.banirUsuario);
router.get('/logs', adminController.listarLogs);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.delete('/avaliacoes/:id', adminController.excluirAvaliacao);

module.exports = router;