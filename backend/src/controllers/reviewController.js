const db = require('../config/db');

const criarAvaliacao = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const { id_solicitacao, prestadorEmail, nota, comentario } = req.body;

        if (!id_solicitacao || !prestadorEmail || !nota) {
            return res.status(400).json({ error: 'Dados insuficientes para registrar a avaliação.' });
        }

        // Busca o ID do prestador baseado no e-mail
        const [prestadorUser] = await db.execute(
            'SELECT p.id FROM prestadores p JOIN usuarios u ON p.usuario_id = u.id WHERE u.email = ?', 
            [prestadorEmail]
        );
        
        if (prestadorUser.length === 0) return res.status(404).json({ error: 'Prestador não encontrado.' });
        const prestadorId = prestadorUser[0].id;

        // 🚀 HERANÇA DE DADOS: Busca automaticamente o serviço vinculado a esta solicitação
        const [solicitacao] = await db.execute('SELECT servico_id FROM solicitacoes WHERE id = ?', [id_solicitacao]);
        if (solicitacao.length === 0) return res.status(404).json({ error: 'Solicitação não encontrada.' });
        const servicoId = solicitacao[0].servico_id;

        // Grava a avaliação no banco de dados amarrada ao serviço
        await db.execute(
            'INSERT INTO avaliacoes (solicitacao_id, servico_id, cliente_id, prestador_id, nota, comentario) VALUES (?, ?, ?, ?, ?, ?)',
            [id_solicitacao, servicoId, clienteId, prestadorId, nota, comentario || null]
        );

        res.status(201).json({ message: 'Avaliação salva com sucesso!' });
    } catch (error) {
        // A tabela tem uma trava "UNIQUE" para solicitacao_id, impedindo avaliação dupla no banco!
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Este serviço já foi avaliado anteriormente.' });
        }
        console.error('Erro ao criar avaliação:', error);
        res.status(500).json({ error: 'Erro interno ao salvar avaliação.' });
    }
};

const listarAvaliacoes = async (req, res) => {
    try {
        const [avaliacoes] = await db.execute('SELECT a.*, c.email AS clienteEmail, p_u.email AS prestadorEmail FROM avaliacoes a JOIN usuarios c ON a.cliente_id = c.id JOIN prestadores p ON a.prestador_id = p.id JOIN usuarios p_u ON p.usuario_id = p_u.id ORDER BY a.criado_em DESC');
        res.status(200).json(avaliacoes);
    } catch (error) {
        console.error('Erro ao listar avaliações:', error);
        res.status(500).json({ error: 'Erro interno ao buscar avaliações.' });
    }
};

module.exports = { criarAvaliacao, listarAvaliacoes };