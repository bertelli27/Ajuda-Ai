const db = require('../config/db');

const enviarMensagem = async (req, res) => {
    try {
        const remetenteId = req.user.id;
        const { solicitacaoId, mensagem, imagemBase64 } = req.body;

        if (!solicitacaoId) {
            return res.status(400).json({ error: 'O ID da solicitação é obrigatório.' });
        }
        if (!mensagem && !imagemBase64) {
            return res.status(400).json({ error: 'A mensagem não pode ser vazia.' });
        }

        const [result] = await db.execute(
            'INSERT INTO mensagens (solicitacao_id, remetente_id, texto, imagem_base64) VALUES (?, ?, ?, ?)',
            [solicitacaoId, remetenteId, mensagem || null, imagemBase64 || null]
        );

        res.status(201).json({ message: 'Mensagem enviada com sucesso!', id_mensagem: result.insertId });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro interno ao enviar mensagem.' });
    }
};

const enviarMensagemSistema = async (req, res) => {
    try {
        const { solicitacaoId, mensagem } = req.body;

        if (!solicitacaoId || !mensagem) {
            return res.status(400).json({ error: 'Solicitação e mensagem são obrigatórios.' });
        }

        // Remetente NULL no banco significa que é o "SISTEMA" enviando
        const [result] = await db.execute(
            'INSERT INTO mensagens (solicitacao_id, remetente_id, texto, imagem_base64) VALUES (?, NULL, ?, NULL)',
            [solicitacaoId, mensagem]
        );

        res.status(201).json({ message: 'Mensagem de sistema registrada!', id_mensagem: result.insertId });
    } catch (error) {
        console.error('Erro ao enviar mensagem de sistema:', error);
        res.status(500).json({ error: 'Erro interno ao registrar mensagem de sistema.' });
    }
};

const listarMensagens = async (req, res) => {
    try {
        const { solicitacaoId } = req.params;

        // O IFNULL garante que se não houver um remetente, a tela lerá como "SISTEMA"
        const query = `
            SELECT 
                m.id AS id_mensagem,
                m.solicitacao_id,
                m.texto AS mensagem,
                m.imagem_base64 AS imagemBase64,
                m.lida,
                m.criado_em AS data_envio,
                IFNULL(u.email, 'SISTEMA') AS remetenteEmail
            FROM mensagens m
            LEFT JOIN usuarios u ON m.remetente_id = u.id
            WHERE m.solicitacao_id = ?
            ORDER BY m.criado_em ASC
        `;

        const [mensagens] = await db.execute(query, [solicitacaoId]);
        res.status(200).json(mensagens);
    } catch (error) {
        console.error('Erro ao listar mensagens:', error);
        res.status(500).json({ error: 'Erro interno ao buscar mensagens.' });
    }
};

const marcarComoLidas = async (req, res) => {
    try {
        const { solicitacaoId } = req.params;
        const usuarioId = req.user.id;

        // Marca como lida as mensagens DESTA solicitação que NÃO foram enviadas por mim.
        await db.execute(
            'UPDATE mensagens SET lida = TRUE WHERE solicitacao_id = ? AND (remetente_id != ? OR remetente_id IS NULL) AND lida = FALSE',
            [solicitacaoId, usuarioId]
        );

        res.status(200).json({ message: 'Mensagens marcadas como lidas.' });
    } catch (error) { res.status(500).json({ error: 'Erro interno ao marcar mensagens como lidas.' }); }
};

module.exports = { enviarMensagem, enviarMensagemSistema, listarMensagens, marcarComoLidas };