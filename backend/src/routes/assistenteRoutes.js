const express = require('express');
const router = express.Router();
const assistenteController = require('../controllers/assistenteController');

router.post('/analisar', assistenteController.analisarProblema);
router.get('/profissionais', assistenteController.listarMapeamento);
router.post('/sugerir-profissao', assistenteController.sugerirProfissaoPorTexto);

module.exports = router;
