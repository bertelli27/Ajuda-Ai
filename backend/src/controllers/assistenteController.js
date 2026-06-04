const assistenteService = require('../services/assistenteService');
const catalogoProfissao = require('../services/catalogoProfissaoService');

const analisarProblema = async (req, res) => {
    try {
        const { descricao } = req.body;
        const resultado = await assistenteService.analisarProblema(descricao);
        res.status(200).json(resultado);
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Erro ao analisar o problema.' });
    }
};

const listarMapeamento = async (_req, res) => {
    try {
        const resultado = await assistenteService.listarProfissionaisMapeados();
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar mapeamento de profissionais.' });
    }
};

const sugerirProfissaoPorTexto = async (req, res) => {
    try {
        const { descricao, limite } = req.body;
        if (!descricao || String(descricao).trim().length < 5) {
            return res.status(400).json({ error: 'Descreva o problema com pelo menos 5 caracteres.' });
        }
        const sugestoes = catalogoProfissao.sugerirProfissoesPorTexto(
            String(descricao).trim(),
            limite ? Math.min(Number(limite), 5) : 3
        );
        res.status(200).json({
            descricaoAnalisada: descricao,
            sugestoes,
            explicacao: sugestoes.length > 0
                ? `Com base na sua descrição, as profissões mais indicadas são: ${sugestoes.map((s) => s.nome).join(', ')}.`
                : 'Não foi possível identificar uma profissão. Tente incluir o que precisa, onde e com qual urgência.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao sugerir profissão.' });
    }
};

module.exports = {
    analisarProblema,
    listarMapeamento,
    sugerirProfissaoPorTexto
};
