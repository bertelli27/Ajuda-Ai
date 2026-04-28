const db = require('../config/db'); 

const adminController = {
    // 1. Listar todos os usuários da plataforma
    listarUsuarios: async (req, res) => {
        try {
            const [usuarios] = await db.execute(`
                SELECT u.id, u.nome, u.email, u.telefone, u.tipo, u.ativo, u.criado_em,
                (SELECT COUNT(*) FROM logs_usuario WHERE usuario_id = u.id AND acao = 'EXCLUSAO_LOGICA') AS exclusao_logica
                FROM usuarios u 
                ORDER BY u.criado_em DESC
            `);
            
            // 🚀 NOVO: Busca estatísticas globais (KPIs)
            const [statsServicos] = await db.execute(
                'SELECT COUNT(*) as total_andamento FROM solicitacoes WHERE status = "ACEITO"'
            );
            
            const [statsFinanceiro] = await db.execute(
                'SELECT SUM(valor_total) as gmv, SUM(taxa_plataforma) as receita FROM transacoes WHERE status = "CONCLUIDO"'
            );

            // Empacota tudo e envia para o front-end
            res.json({
                usuarios: usuarios,
                kpis: {
                    totalUsuarios: usuarios.filter(u => u.ativo).length,
                    servicosAndamento: statsServicos[0].total_andamento || 0,
                    gmv: statsFinanceiro[0].gmv || 0,
                    receita: statsFinanceiro[0].receita || 0
                }
            });
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            res.status(500).json({ error: "Erro interno ao buscar usuários." });
        }
    },

    // 2. Banir (Soft Delete) um usuário que quebrou as regras
    banirUsuario: async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body; // O admin digita por que está banindo
        const adminId = req.user.id; // Quem está fazendo a ação

        try {
            // Desativa o usuário (Soft Delete)
            await db.execute('UPDATE usuarios SET ativo = false WHERE id = ?', [id]);

            // 🚀 Grava a ação no nosso "Livro Preto" (logs_administrador)
            await db.execute(
                `INSERT INTO logs_administrador (admin_id, acao, alvo_tipo, alvo_id, valor_antigo, valor_novo, justificativa) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [adminId, 'BANIMENTO_USUARIO', 'usuario', id, 'ativo=true', 'ativo=false', motivo || 'Violação dos Termos de Uso']
            );

            res.json({ message: "Usuário banido com sucesso e ação registrada no log." });
        } catch (error) {
            console.error("Erro ao banir usuário:", error);
            res.status(500).json({ error: "Erro ao tentar banir o usuário." });
        }
    },

    // 3. Extrair as Trilhas de Auditoria (Logs) para mostrar na tela
    listarLogs: async (req, res) => {
        try {
            const [logsAdmin] = await db.execute(`
                SELECT l.*, u.nome as admin_nome, u.email as admin_email 
                FROM logs_administrador l 
                LEFT JOIN usuarios u ON l.admin_id = u.id 
                ORDER BY l.criado_em DESC LIMIT 100
            `);

            const [logsServico] = await db.execute(`
                SELECT l.*, u.nome as usuario_nome, u.email as usuario_email, u.tipo as usuario_tipo
                FROM logs_servico l 
                LEFT JOIN usuarios u ON l.usuario_id = u.id 
                ORDER BY l.criado_em DESC LIMIT 100
            `);

            const [logsUsuario] = await db.execute(`
                SELECT l.*, u.nome as usuario_nome, u.email as usuario_email, u.tipo as usuario_tipo
                FROM logs_usuario l 
                LEFT JOIN usuarios u ON l.usuario_id = u.id 
                ORDER BY l.criado_em DESC LIMIT 100
            `);

            // Retornamos os logs de governança para o Front-end desenhar a tabela
            res.json({
                logsAdministradores: logsAdmin,
                logsServicos: logsServico,
                logsUsuarios: logsUsuario
            });
        } catch (error) {
            console.error("Erro ao listar logs:", error);
            res.status(500).json({ error: "Erro ao buscar a trilha de auditoria." });
        }
    }
};

module.exports = adminController;