const express = require('express');
const router = express.Router();
const { adicionarPortfolio, deletarPortfolio } = require('../controllers/portfolioController');

// Ajuste o caminho do authMiddleware caso a pasta de destino seja diferente
const verificarToken = require('../middlewares/authMiddleware'); 

router.post('/', verificarToken, adicionarPortfolio);
router.delete('/:id', verificarToken, deletarPortfolio);

module.exports = router;