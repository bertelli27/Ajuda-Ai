const assistenteService = require('../services/assistenteService');

const analisarProblema = (req, res) => {
    try {
        const { descricao } = req.body;
        const resultado = assistenteService.analisarProblema(descricao);
        res.status(200).json(resultado);
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Erro ao analisar o problema.' });
    }
};

const listarMapeamento = (_req, res) => {
    try {
        res.status(200).json(assistenteService.listarProfissionaisMapeados());
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar mapeamento de profissionais.' });
    }
};

module.exports = {
    analisarProblema,
    listarMapeamento
};
