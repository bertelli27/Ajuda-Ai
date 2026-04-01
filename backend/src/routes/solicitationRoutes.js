const express = require('express');
const router = express.Router();
const solicitationController = require('../controllers/solicitationController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rota: POST /api/solicitacoes (PROTEGIDA - Cliente cria um pedido)
router.post('/', verificarToken, solicitationController.criarSolicitacao);

// Rota: GET /api/solicitacoes (PROTEGIDA - Lista os pedidos do usuário logado)
router.get('/', verificarToken, solicitationController.listarSolicitacoes);

// Rota: PUT /api/solicitacoes/:id (PROTEGIDA - Atualiza um pedido existente)
router.put('/:id', verificarToken, solicitationController.atualizarSolicitacao);

module.exports = router;
