const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rota para listar as transações do usuário logado
router.get('/', verificarToken, transactionController.listarTransacoes);

module.exports = router;