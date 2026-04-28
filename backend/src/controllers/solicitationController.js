const db = require('../config/db');

const criarSolicitacao = async (req, res) => {
    try {
        // 1. Pega o ID do cliente que está logado (vem do token JWT)
        const clienteId = req.user.id;

        // 2. Pega os dados enviados pelo front-end
        const { servicoId, descricaoProblema, dataDesejada, enderecoRealizacao } = req.body;

        if (!servicoId || !descricaoProblema || !dataDesejada || !enderecoRealizacao) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        // 3. Trava de Segurança: Impede que o prestador solicite o próprio serviço
        const [servicoInfo] = await db.execute(
            'SELECT p.usuario_id FROM servicos s JOIN prestadores p ON s.prestador_id = p.id WHERE s.id = ?',
            [servicoId]
        );
        
        if (servicoInfo.length > 0 && servicoInfo[0].usuario_id === clienteId) {
            return res.status(403).json({ error: 'Você não pode solicitar o seu próprio serviço.' });
        }

        // 4. Insere a nova solicitação no banco de dados
        const [result] = await db.execute(
            'INSERT INTO solicitacoes (servico_id, cliente_id, descricao_problema, data_desejada, endereco_realizacao, status) VALUES (?, ?, ?, ?, ?, ?)',
            [servicoId, clienteId, descricaoProblema, dataDesejada, enderecoRealizacao, 'PENDENTE']
        );

        res.status(201).json({ message: 'Solicitação criada com sucesso!', id: result.insertId });

    } catch (error) {
        console.error('Erro ao criar solicitação:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar a solicitação.' });
    }
};

const listarSolicitacoes = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Query que busca solicitações onde o usuário logado é o cliente OU o prestador do serviço solicitado.
        const query = `
            SELECT 
                sol.id, sol.servico_id, sol.cliente_id, sol.descricao_problema, 
                sol.data_desejada, sol.endereco_realizacao, sol.status, 
                sol.status_pagamento, sol.valor_combinado, sol.valor_status, 
                sol.descricao_proposta, sol.data_proposta, sol.hora_proposta, 
                sol.criado_em,
                s.titulo AS servico,
                IF(av.id IS NOT NULL, true, false) AS avaliado,
                cliente.nome AS cliente_nome,
                cliente.email AS clienteEmail,
                prestador_usuario.nome AS prestador_nome,
                prestador_usuario.email AS prestadorEmail,
                (SELECT COUNT(*) FROM mensagens m WHERE m.solicitacao_id = sol.id AND (m.remetente_id != ? OR m.remetente_id IS NULL) AND m.lida = FALSE) AS mensagens_nao_lidas
            FROM solicitacoes sol
            JOIN servicos s ON sol.servico_id = s.id
            JOIN usuarios cliente ON sol.cliente_id = cliente.id
            JOIN prestadores p ON s.prestador_id = p.id
            JOIN usuarios prestador_usuario ON p.usuario_id = prestador_usuario.id
            LEFT JOIN avaliacoes av ON sol.id = av.solicitacao_id
            WHERE sol.cliente_id = ? OR p.usuario_id = ?
            ORDER BY sol.criado_em DESC
        `;

        const [solicitacoes] = await db.execute(query, [usuarioId, usuarioId, usuarioId]);
        res.status(200).json(solicitacoes);
    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao listar solicitações.' });
    }
};

const atualizarSolicitacao = async (req, res) => {
    let connection; // Declarado FORA do try para garantir que sempre seja fechado no catch
    try {
        const { id } = req.params;
        // Agora espera snake_case diretamente do corpo da requisição, graças ao tradutor no api.js
        const { status, valor_status, valor_combinado, descricao_proposta, data_proposta, hora_proposta, status_pagamento } = req.body;

        // Monta a query dinamicamente apenas com os dados que o front-end enviou
        let query = 'UPDATE solicitacoes SET ';
        const values = [];
        const updates = [];

        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (valor_status !== undefined) { updates.push('valor_status = ?'); values.push(valor_status); }
        if (valor_combinado !== undefined) { updates.push('valor_combinado = ?'); values.push(valor_combinado); }
        if (descricao_proposta !== undefined) { updates.push('descricao_proposta = ?'); values.push(descricao_proposta); }
        if (data_proposta !== undefined) { 
            // Corta a string ISO ('2026-04-02T03:00:00.000Z') para pegar apenas a data ('2026-04-02') exigida pelo MySQL
            const dataFormatada = (typeof data_proposta === 'string' && data_proposta.includes('T')) ? data_proposta.split('T')[0] : data_proposta;
            updates.push('data_proposta = ?'); 
            values.push(dataFormatada); 
        }
        if (hora_proposta !== undefined) { updates.push('hora_proposta = ?'); values.push(hora_proposta); }
        if (status_pagamento !== undefined) { updates.push('status_pagamento = ?'); values.push(status_pagamento); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
        }

        query += updates.join(', ') + ' WHERE id = ?';
        values.push(id);

        // Inicia a transação com o banco de dados
        connection = await db.getConnection(); 
        await connection.beginTransaction(); // Inicia a transação

        // 1. Atualiza a solicitação
        await connection.execute(query, values);

        // 2. Lógica Financeira Real e Definitiva
        if (status_pagamento === 'RETIDO') {
            // Verifica se a transação já existe para não duplicar no banco
            const [existingTx] = await connection.execute(
                'SELECT id FROM transacoes WHERE solicitacao_id = ? AND tipo = "PAGAMENTO"',
                [id]
            );
            
            if (existingTx.length === 0) {
                const [solicitacaoRows] = await connection.execute(
                    `SELECT servico_id, cliente_id, valor_combinado FROM solicitacoes WHERE id = ?`, [id]
                );
                
                if (solicitacaoRows.length > 0) {
                    const [servicoRows] = await connection.execute(
                        `SELECT prestador_id FROM servicos WHERE id = ?`, [solicitacaoRows[0].servico_id]
                    );
                    
                    const valorOriginal = solicitacaoRows[0].valor_combinado;
                    const valorTotal = valorOriginal ? parseFloat(valorOriginal) : 0;
                    const taxaPlataforma = valorTotal * 0.10; // 10% de taxa
                    const valorPrestador = valorTotal - taxaPlataforma;

                    await connection.execute(
                        'INSERT INTO transacoes (solicitacao_id, cliente_id, prestador_id, valor_total, taxa_plataforma, valor_prestador, tipo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [id, solicitacaoRows[0].cliente_id, servicoRows[0].prestador_id, valorTotal, taxaPlataforma, valorPrestador, 'PAGAMENTO', 'RETIDO']
                    );
                }
            }
        } else if (status_pagamento === 'LIBERADO') {
            // O Cliente clicou em "Confirmar Conclusão". O dinheiro é liberado (Status CONCLUIDO)
            await connection.execute(
                'UPDATE transacoes SET status = "CONCLUIDO" WHERE solicitacao_id = ? AND tipo = "PAGAMENTO"', [id]
            );
        } else if (status_pagamento === 'ESTORNADO') {
            await connection.execute(
                'UPDATE transacoes SET status = "CANCELADO" WHERE solicitacao_id = ? AND tipo = "PAGAMENTO"', [id]
            );
        }

            // 🚀 NOVIDADE V2.0: Gravar a Trilha de Auditoria (Log de Serviço)
            let acaoLog = 'ATUALIZACAO_SERVICO';
            let detalhesLog = 'Atualização de dados da solicitação.';
            
            if (status === 'CANCELADO') { acaoLog = 'SERVICO_CANCELADO'; detalhesLog = 'O serviço foi cancelado ou estornado.'; }
            else if (status === 'ACEITO') { acaoLog = 'SERVICO_ACEITO'; detalhesLog = 'O cliente aceitou o serviço e pagou.'; }
            else if (status === 'AGUARDANDO_CONFIRMACAO') { acaoLog = 'SERVICO_FINALIZADO_PRESTADOR'; detalhesLog = 'O prestador indicou que concluiu o trabalho.'; }
            else if (status === 'CONCLUIDO') { acaoLog = 'SERVICO_CONCLUIDO'; detalhesLog = 'O cliente confirmou a conclusão.'; }
            else if (valor_status === 'PROPOSTO') { acaoLog = 'ORCAMENTO_ENVIADO'; detalhesLog = `Orçamento de R$ ${valor_combinado || 'N/A'} enviado.`; }

            await connection.execute(
                `INSERT INTO logs_servico (solicitacao_id, usuario_id, acao, detalhes) VALUES (?, ?, ?, ?)`,
                [id, req.user.id, acaoLog, detalhesLog]
            );

        await connection.commit(); // Confirma as alterações
        connection.release(); // Libera a conexão

        res.status(200).json({ message: 'Solicitação atualizada com sucesso!' });
    } catch (error) {
        // Se der qualquer erro, desfaz tudo e LIBERA A CONEXÃO (impede o travamento do "Aguarde...")
        if (connection) {
            await connection.rollback(); 
            connection.release();
        }
        console.error('Erro ao atualizar solicitação:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar solicitação.' });
    }
};

module.exports = { criarSolicitacao, listarSolicitacoes, atualizarSolicitacao };
