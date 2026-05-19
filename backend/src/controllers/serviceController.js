const db = require('../config/db');
const registrarLog = require('../utils/logger');

const criarServico = async (req, res) => {
    try {
        if (req.user.tipo !== 'prestador') {
            return res.status(403).json({ error: 'Acesso negado. Apenas prestadores podem criar serviços.' });
        }

        const { titulo, categoria, descricao } = req.body;

        if (!titulo || !categoria) {
            return res.status(400).json({ error: 'Título e Categoria são obrigatórios.' });
        }

        const [prestadores] = await db.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [req.user.id]);
        if (prestadores.length === 0) {
            return res.status(404).json({ error: 'Perfil de prestador não encontrado no banco de dados.' });
        }
        const prestadorId = prestadores[0].id;

        const [categorias] = await db.execute('SELECT id FROM categorias WHERE nome = ?', [categoria]);
        let categoriaId = 1; 
        if (categorias.length > 0) {
            categoriaId = categorias[0].id;
        }

        const [result] = await db.execute(
            'INSERT INTO servicos (prestador_id, categoria_id, titulo, descricao) VALUES (?, ?, ?, ?)',
            [prestadorId, categoriaId, titulo, descricao || '']
        );

        // 🚀 Grava na auditoria que um novo serviço foi publicado
        await registrarLog(req.user.id, 'SERVICO_CRIADO', `Publicou o serviço: "${titulo}".`, req.ip);

        res.status(201).json({ message: 'Serviço salvo com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar serviço.' });
    }
};

const listarServicos = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id, 
                u.email AS prestadorEmail,
                s.titulo, 
                c.nome AS categoria,
                s.descricao, 
                s.preco_base,
                s.status,
                s.criado_em AS dataCriacao,
                COALESCE(AVG(a.nota), 0) AS mediaAvaliacao,
                COUNT(a.id) AS totalAvaliacoes
            FROM servicos s
            JOIN categorias c ON s.categoria_id = c.id
            JOIN prestadores p ON s.prestador_id = p.id
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN avaliacoes a ON a.servico_id = s.id
            WHERE s.status = 'ATIVO'
            GROUP BY s.id, u.email, s.titulo, c.nome, s.descricao, s.preco_base, s.status, s.criado_em
            ORDER BY s.criado_em DESC
        `;

        const [servicos] = await db.execute(query);
        res.status(200).json(servicos);
    } catch (error) {
        console.error('Erro ao listar serviços:', error);
        res.status(500).json({ error: 'Erro interno ao buscar serviços.' });
    }
};

const getServicoById = async (req, res) => {
    try {
        const servicoId = parseInt(req.params.id, 10);
        if (isNaN(servicoId)) {
            return res.status(400).json({ error: 'ID de serviço inválido.' });
        }

        const query = `
            SELECT 
                s.id, 
                s.titulo, 
                s.descricao,
                s.preco_base,
                s.status,
                c.nome AS categoria,
                p.usuario_id,
                u.nome AS prestador_nome,
                u.email AS prestador_email,
                COALESCE(AVG(a.nota), 0) AS mediaAvaliacao,
                COUNT(a.id) AS totalAvaliacoes
            FROM servicos s
            JOIN categorias c ON s.categoria_id = c.id
            JOIN prestadores p ON s.prestador_id = p.id
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN avaliacoes a ON a.servico_id = s.id
            WHERE s.id = ?
            GROUP BY s.id, s.titulo, s.descricao, s.preco_base, s.status, c.nome, p.usuario_id, u.nome, u.email
        `;

        const [servicos] = await db.execute(query, [servicoId]);

        if (servicos.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        }

        res.status(200).json(servicos[0]);
    } catch (error) {
        console.error('Erro ao buscar serviço por ID:', error);
        res.status(500).json({ error: 'Erro interno ao buscar serviço.' });
    }
};

const atualizarServico = async (req, res) => {
    try {
        if (req.user.tipo !== 'prestador') return res.status(403).json({ error: 'Acesso negado.' });
        
        const servicoId = parseInt(req.params.id, 10);
        const { titulo, categoria, descricao } = req.body;

        const [prestadores] = await db.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [req.user.id]);
        if (prestadores.length === 0) return res.status(404).json({ error: 'Prestador não encontrado.' });
        const prestadorId = prestadores[0].id;

        // 1. Busca o serviço APENAS pelo ID para investigarmos
        const [servico] = await db.execute('SELECT * FROM servicos WHERE id = ?', [servicoId]);
        
        if (servico.length === 0) {
            console.log(`[ERRO FATAL] O serviço ID ${servicoId} literalmente não existe na tabela 'servicos'!`);
            return res.status(404).json({ error: 'Serviço não encontrado no banco de dados.' });
        }

        // 2. Verifica se o prestador logado é o dono (Convertendo ambos para Number para evitar bugs de tipo)
        if (Number(servico[0].prestador_id) !== Number(prestadorId)) {
            console.log(`[ALERTA DE SEGURANÇA] O serviço ${servicoId} pertence ao prestador_id ${servico[0].prestador_id}, mas você é o prestador_id ${prestadorId}!`);
            return res.status(403).json({ error: 'Você não tem permissão para editar este serviço, pois ele pertence a outro prestador.' });
        }

        // 3. Atualiza se estiver tudo OK
        let categoriaId = 1;
        if (categoria) {
            const [categorias] = await db.execute('SELECT id FROM categorias WHERE nome = ?', [categoria]);
            if (categorias.length > 0) categoriaId = categorias[0].id;
        }

        await db.execute(
            'UPDATE servicos SET titulo = ?, categoria_id = ?, descricao = ? WHERE id = ?',
            [titulo, categoriaId, descricao || '', servicoId]
        );

        console.log(`[SUCESSO] Serviço ${servicoId} atualizado no banco! Novo Título: "${titulo}"`);
        
        // 🚀 Grava na auditoria que o serviço foi editado
        await registrarLog(req.user.id, 'SERVICO_EDITADO', `Alterou os dados da publicação: "${titulo}".`, req.ip);
        
        res.status(200).json({ message: 'Serviço atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({ error: 'Erro ao atualizar serviço.' });
    }
};

const deletarServico = async (req, res) => {
    try {
        if (req.user.tipo !== 'prestador' && req.user.tipo !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
        const servicoId = parseInt(req.params.id, 10);

        let prestadorId = null;
        if (req.user.tipo === 'prestador') {
            const [prestadores] = await db.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [req.user.id]);
            if (prestadores.length === 0) return res.status(404).json({ error: 'Prestador não encontrado.' });
            prestadorId = prestadores[0].id;
        }

        const [servico] = await db.execute('SELECT * FROM servicos WHERE id = ?', [servicoId]);
        if (servico.length === 0) return res.status(404).json({ error: 'Serviço não encontrado.' });

        if (req.user.tipo !== 'admin' && Number(servico[0].prestador_id) !== Number(prestadorId)) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir este serviço.' });
        }

        // 🛡️ ARQUIVAMENTO INTELIGENTE (SOFT DELETE)
        // Verifica se o serviço já possui histórico financeiro/pedidos. Se sim, apenas arquiva.
        const [historico] = await db.execute('SELECT id FROM solicitacoes WHERE servico_id = ? LIMIT 1', [servicoId]);
        
        if (historico.length > 0) {
            await db.execute('UPDATE servicos SET status = "ARQUIVADO" WHERE id = ?', [servicoId]);
            console.log(`[SUCESSO] Serviço ${servicoId} ARQUIVADO pois possui histórico!`);
            
            await registrarLog(req.user.id, 'SERVICO_ARQUIVADO', `Arquivou o serviço ID #${servicoId} para preservar histórico financeiro e avaliações.`, req.ip);
            res.status(200).json({ message: 'Serviço arquivado com sucesso (o histórico foi preservado)!' });
        } else {
            // Se não tem histórico nenhum, faz o Hard Delete limpo
            await db.execute('DELETE FROM servicos WHERE id = ?', [servicoId]);
            console.log(`[SUCESSO] Serviço ${servicoId} excluído perfeitamente (Hard Delete)!`);
            
            await registrarLog(req.user.id, 'SERVICO_EXCLUIDO', `Removeu definitivamente o serviço ID #${servicoId} da vitrine.`, req.ip);
            res.status(200).json({ message: 'Serviço excluído permanentemente!' });
        }
    } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        res.status(500).json({ error: 'Erro ao excluir serviço.' });
    }
};

module.exports = { criarServico, listarServicos, getServicoById, atualizarServico, deletarServico };
