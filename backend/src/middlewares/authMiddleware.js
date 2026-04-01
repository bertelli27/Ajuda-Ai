const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
    // O token geralmente vem no cabeçalho assim: "Bearer eyJhbGciOi..."
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    try {
        // Tenta descriptografar o token usando a nossa senha secreta do .env
        const usuarioDecodificado = jwt.verify(token, process.env.JWT_SECRET);
        // Se deu certo, guardamos os dados do usuário dentro da requisição para o Controller usar
        req.user = usuarioDecodificado; 
        next(); // Deixa passar! Vai para o Controller.
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = { verificarToken };