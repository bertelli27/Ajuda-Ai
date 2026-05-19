const db = require('../config/db');
const registrarLog = require('../utils/logger');

const adicionarPortfolio = async (req, res) => {
    try {
        if (req.user.tipo !== 'prestador') {
            return res.status(403).json({ error: 'Apenas prestadores podem adicionar ao portfólio.' });
        }

        const { imagemBase64, tipo_portfolio, servico_id, solicitacao_id, descricao } = req.body;

        if (!imagemBase64) {
            return res.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        const [prestadores] = await db.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [req.user.id]);
        if (prestadores.length === 0) return res.status(404).json({ error: 'Prestador não encontrado.' });
        const prestadorId = prestadores[0].id;

        let avaliacaoId = null;
        let verificado = false;

        // 🛡️ LÓGICA DO PORTFÓLIO VERIFICADO (HERANÇA E SEGURANÇA)
        if (tipo_portfolio === 'verificado') {
            if (!solicitacao_id) {
                return res.status(400).json({ error: 'Projetos verificados exigem o ID da solicitação.' });
            }

            // Checa se a solicitação existe, se pertence a esse prestador e se está CONCLUIDO
            const [solicitacao] = await db.execute(`
                SELECT sol.id, sol.servico_id, sol.status 
                FROM solicitacoes sol
                JOIN servicos s ON sol.servico_id = s.id
                WHERE sol.id = ? AND s.prestador_id = ?
            `, [solicitacao_id, prestadorId]);

            if (solicitacao.length === 0) {
                return res.status(403).json({ error: 'Solicitação não encontrada ou não pertence a você.' });
            }

            if (solicitacao[0].status !== 'CONCLUIDO') {
                return res.status(400).json({ error: 'Apenas serviços concluídos podem gerar portfólio verificado.' });
            }

            // Tenta herdar a avaliação automaticamente (se existir)
            const [avaliacao] = await db.execute('SELECT id FROM avaliacoes WHERE solicitacao_id = ?', [solicitacao_id]);
            if (avaliacao.length > 0) {
                avaliacaoId = avaliacao[0].id;
            }

            verificado = true;
        }

        // Insere no banco de dados
        const [result] = await db.execute(
            `INSERT INTO portfolio (prestador_id, servico_id, solicitacao_id, avaliacao_id, imagem_url, descricao, tipo_portfolio, verificado) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [prestadorId, servico_id || null, solicitacao_id || null, avaliacaoId, imagemBase64, descricao || null, tipo_portfolio || 'livre', verificado]
        );

        await registrarLog(req.user.id, 'PORTFOLIO_ADICIONADO', `Adicionou uma nova imagem ao portfólio (${tipo_portfolio || 'livre'}).`, req.ip);

        res.status(201).json({ message: 'Imagem adicionada ao portfólio com sucesso!', id: result.insertId });

    } catch (error) {
        console.error('Erro ao adicionar portfólio:', error);
        res.status(500).json({ error: 'Erro interno ao adicionar imagem ao portfólio.' });
    }
};

const deletarPortfolio = async (req, res) => {
    try {
        const portfolioId = req.params.id;
        const isAdmin = req.user.tipo === 'admin';

        const [portfolio] = await db.execute('SELECT prestador_id FROM portfolio WHERE id = ?', [portfolioId]);
        if (portfolio.length === 0) return res.status(404).json({ error: 'Imagem não encontrada.' });

        if (!isAdmin) {
            const [prestadores] = await db.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [req.user.id]);
            if (prestadores.length === 0 || prestadores[0].id !== portfolio[0].prestador_id) {
                return res.status(403).json({ error: 'Acesso negado. Você não é o dono desta imagem.' });
            }
        }

        await db.execute('DELETE FROM portfolio WHERE id = ?', [portfolioId]);
        await registrarLog(req.user.id, isAdmin ? 'MODERACAO_ADMIN' : 'PORTFOLIO_EXCLUIDO', `Excluiu a imagem #${portfolioId} do portfólio.`, req.ip);

        res.status(200).json({ message: 'Imagem removida com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir imagem do portfólio.' });
    }
};

module.exports = { adicionarPortfolio, deletarPortfolio };