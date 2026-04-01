const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rota: POST /api/auth/cadastro
router.post('/cadastro', authController.register);

// Rota: POST /api/auth/login
router.post('/login', authController.login);

// Rota: POST /api/auth/esqueci-senha (Envia e-mail de recuperação)
router.post('/esqueci-senha', passwordController.solicitarRecuperacao);

// Rota: POST /api/auth/redefinir-senha (Valida token e troca a senha no DB)
router.post('/redefinir-senha', passwordController.redefinirSenha);

// Rota: GET /api/auth/usuarios (Pública - Vitrine)
router.get('/usuarios', authController.listarUsuarios);

// Rota: PUT /api/auth/perfil (Protegida - Editar o próprio perfil)
router.put('/perfil', verificarToken, authController.atualizarPerfil);

// Rota: GET /api/auth/notificacoes (Protegida - Retorna o número do badge)
router.get('/notificacoes', verificarToken, authController.getNotificacoes);

module.exports = router;
