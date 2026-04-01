const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rota para listar mensagens de uma solicitação (Chat Aberto)
router.get('/:solicitacaoId', verificarToken, messageController.listarMensagens);

// Rota para enviar uma nova mensagem comum
router.post('/', verificarToken, messageController.enviarMensagem);

// Rota para registrar uma ação do sistema (Aprovado, Orçamento, etc)
router.post('/sistema', verificarToken, messageController.enviarMensagemSistema);

// Rota para marcar as mensagens de um chat como lidas
router.put('/:solicitacaoId/lidas', verificarToken, messageController.marcarComoLidas);

module.exports = router;