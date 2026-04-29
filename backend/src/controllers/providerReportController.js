const db = require('../config/db');

const getRelatorios = async (req, res) => {
    try {
        const prestadorUsuarioId = req.user.id;
        const { periodo } = req.query; 

        // Determina o filtro de data no SQL
        let dateFilter = '';
        if (periodo === 'mes_atual') {
            dateFilter = 'AND sol.criado_em >= DATE_FORMAT(NOW() ,"%Y-%m-01")';
        } else if (periodo === 'ultimos_3_meses') {
            dateFilter = 'AND sol.criado_em >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
        } else if (periodo === 'ano_atual') {
            dateFilter = 'AND sol.criado_em >= DATE_FORMAT(NOW() ,"%Y-01-01")';
        }

        // Descobre o ID do Prestador na tabela prestadores
        const [prestadores] = await db.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [prestadorUsuarioId]);
        if (prestadores.length === 0) return res.status(404).json({ error: 'Prestador não encontrado.' });
        const prestadorId = prestadores[0].id;

        // 1. KPI: Funil de Conversão
        const queryFunil = `
            SELECT 
                COUNT(*) as recebidos,
                SUM(CASE WHEN sol.valor_status = 'PROPOSTO' OR sol.valor_status = 'ACEITO' THEN 1 ELSE 0 END) as orcamentos_enviados,
                SUM(CASE WHEN sol.status IN ('ACEITO', 'AGUARDANDO_CONFIRMACAO', 'CONCLUIDO') THEN 1 ELSE 0 END) as servicos_fechados,
                SUM(CASE WHEN sol.status = 'CONCLUIDO' THEN 1 ELSE 0 END) as servicos_concluidos
            FROM solicitacoes sol
            JOIN servicos s ON sol.servico_id = s.id
            WHERE s.prestador_id = ? ${dateFilter}
        `;
        const [funil] = await db.execute(queryFunil, [prestadorId]);

        // 2 e 3. KPIs: Receita por Categoria e Ticket Médio
        const queryReceita = `
            SELECT 
                c.nome as categoria,
                COUNT(t.id) as qtd_servicos,
                SUM(t.valor_prestador) as receita_total
            FROM transacoes t
            JOIN solicitacoes sol ON t.solicitacao_id = sol.id
            JOIN servicos s ON sol.servico_id = s.id
            JOIN categorias c ON s.categoria_id = c.id
            WHERE t.prestador_id = ? AND t.status = 'CONCLUIDO' ${dateFilter}
            GROUP BY c.id
        `;
        const [receitas] = await db.execute(queryReceita, [prestadorId]);

        let ticketMedio = 0;
        let totalReceita = 0;
        let totalServicos = 0;
        receitas.forEach(r => { totalReceita += parseFloat(r.receita_total); totalServicos += parseInt(r.qtd_servicos); });
        if (totalServicos > 0) ticketMedio = totalReceita / totalServicos;

        // 4. KPI: Clientes Recorrentes (Fidelização)
        const queryRecorrentes = `
            SELECT u.nome, u.email, COUNT(sol.id) as qtd_servicos, SUM(t.valor_prestador) as valor_gasto
            FROM solicitacoes sol
            JOIN transacoes t ON t.solicitacao_id = sol.id AND t.status = 'CONCLUIDO'
            JOIN usuarios u ON sol.cliente_id = u.id
            JOIN servicos s ON sol.servico_id = s.id
            WHERE s.prestador_id = ? ${dateFilter}
            GROUP BY sol.cliente_id, u.nome, u.email
            HAVING COUNT(sol.id) > 1
            ORDER BY qtd_servicos DESC
        `;
        const [recorrentes] = await db.execute(queryRecorrentes, [prestadorId]);

        res.json({ funil: funil[0], ticketMedio, receitasPorCategoria: receitas, clientesRecorrentes: recorrentes });
    } catch (error) {
        console.error("Erro ao gerar relatórios:", error);
        res.status(500).json({ error: "Erro interno ao gerar relatórios." });
    }
};
module.exports = { getRelatorios };