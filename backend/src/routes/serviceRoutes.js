const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rota: GET /api/servicos (PÚBLICA - Qualquer um pode ver a vitrine de serviços)
router.get('/', serviceController.listarServicos);

// Rota: GET /api/servicos/:id (PÚBLICA - Pega um serviço específico)
router.get('/:id', serviceController.getServicoById);

// Rota: POST /api/servicos (PROTEGIDA - Exige Token JWT válido para criar)
// Repare que o "verificarToken" fica no meio, como um segurança.
router.post('/', verificarToken, serviceController.criarServico);

// Rota: PUT /api/servicos/:id (PROTEGIDA - Editar serviço)
router.put('/:id', verificarToken, serviceController.atualizarServico);

// Rota: DELETE /api/servicos/:id (PROTEGIDA - Excluir serviço)
router.delete('/:id', verificarToken, serviceController.deletarServico);

module.exports = router;