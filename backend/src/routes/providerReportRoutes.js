const express = require('express');
const router = express.Router();
const providerReportController = require('../controllers/providerReportController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, providerReportController.getRelatorios);

module.exports = router;