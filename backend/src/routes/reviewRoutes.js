const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rota: POST /api/avaliacoes (Protegida, apenas clientes logados podem avaliar)
router.post('/', verificarToken, reviewController.criarAvaliacao);

// Rota: GET /api/avaliacoes (Pública, qualquer um pode ver avaliações na vitrine)
router.get('/', reviewController.listarAvaliacoes);

module.exports = router;