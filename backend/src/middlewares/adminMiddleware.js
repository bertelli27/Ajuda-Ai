/**
 * Middleware para proteger as rotas exclusivas do Painel Administrativo.
 * Deve ser usado APÓS o middleware padrão de verificação de Token (JWT).
 */
const verificarAdmin = (req, res, next) => {
    // Assumimos que o seu authMiddleware já decodificou o Token e colocou os dados em req.usuario
    if (!req.usuario || req.usuario.tipo !== 'admin') {
        return res.status(403).json({ 
            error: 'Acesso negado. Esta rota requer privilégios de administrador.' 
        });
    }
    next(); // Se for admin, deixa a requisição passar para o Controller!
};

module.exports = { verificarAdmin };