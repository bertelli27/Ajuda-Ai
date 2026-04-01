const db = require('../config/db');

const registrarLog = async (usuarioId, acao, detalhes, ip) => {
    try {
        await db.execute(
            'INSERT INTO logs_usuario (usuario_id, acao, detalhes, ip_endereco) VALUES (?, ?, ?, ?)',
            [usuarioId || null, acao, detalhes || 'Ação registrada no sistema.', ip || '0.0.0.0']
        );
    } catch (error) {
        console.error('Erro ao salvar log no banco (não afetará o usuário):', error);
        // Falha silenciosamente para não interromper o fluxo principal
    }
};

module.exports = registrarLog;
