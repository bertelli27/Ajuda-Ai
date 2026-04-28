/**
 * Middleware para proteger as rotas exclusivas do Painel Administrativo.
 * Deve ser usado APÓS o middleware padrão de verificação de Token (JWT).
 */
const verificarAdmin = (req, res, next) => {
    // O authMiddleware decodifica o Token e coloca os dados em req.user
    if (!req.user || req.user.tipo !== 'admin') {
        return res.status(403).json({ 
            error: 'Acesso negado. Esta rota requer privilégios de administrador.' 
        });
    }
    next(); // Se for admin, deixa a requisição passar para o Controller!
};

module.exports = { verificarAdmin };