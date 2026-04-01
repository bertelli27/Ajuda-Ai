const db = require('../config/db');

const listarTransacoes = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Esta query busca transações onde o usuário logado é o cliente
        // OU ele é o prestador associado à transação.
        const query = `
            SELECT 
                t.id,
                t.solicitacao_id,
                s.titulo AS servico_titulo,
                t.valor_total,
                t.taxa_plataforma,
                t.valor_prestador,
                t.tipo,
                t.status,
                t.criado_em,
                cliente.email AS clienteEmail,
                prestador_usuario.email AS prestadorEmail
            FROM transacoes t
            JOIN solicitacoes sol ON t.solicitacao_id = sol.id
            JOIN servicos s ON sol.servico_id = s.id
            JOIN usuarios cliente ON t.cliente_id = cliente.id
            JOIN prestadores p ON t.prestador_id = p.id
            JOIN usuarios prestador_usuario ON p.usuario_id = prestador_usuario.id
            WHERE t.cliente_id = ? OR p.usuario_id = ?
            ORDER BY t.criado_em DESC
        `;

        const [transacoes] = await db.execute(query, [usuarioId, usuarioId]);
        res.status(200).json(transacoes);
    } catch (error) {
        console.error('Erro ao listar transações:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao listar transações.' });
    }
};

module.exports = { listarTransacoes };