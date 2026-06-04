/**
 * Sugestão de profissões pelo catálogo de referência (sem depender de prestadores no banco).
 */

const mapping = require('../data/profissionaisMapeamento');
const scoringEngine = require('./busca/scoringEngine');
const tokenizer = require('./nlp/tokenizer');

const LIMITE_SUGESTOES_PADRAO = 3;

function profissionaisParaServicosVirtuais() {
    return mapping.PROFISSIONAIS_POR_CATEGORIA.map((p) => ({
        id: `catalogo-${p.nome.toLowerCase().replace(/\s+/g, '-')}`,
        titulo: p.nome,
        descricao: p.descricao,
        categoria: p.categoria,
        palavras_chave: `${p.nome} ${p.categoria} ${p.palavras_chave}`,
        catalogo: true
    }));
}

/**
 * Identifica profissões do catálogo mais compatíveis com a frase do usuário.
 * @param {string} descricao
 * @param {number} limite
 * @returns {array}
 */
function sugerirProfissoesPorTexto(descricao, limite = LIMITE_SUGESTOES_PADRAO) {
    const virtuais = profissionaisParaServicosVirtuais();
    const compatibilidades = scoringEngine.calcularCompatibilidadeMultipla(descricao, virtuais);

    return compatibilidades
        .filter((c) => c.scoreTotal > 0)
        .slice(0, limite)
        .map((c) => formatarSugestaoCatalogo(c, descricao));
}

function formatarSugestaoCatalogo(compat, descricaoOriginal) {
    const prof = mapping.PROFISSIONAIS_POR_CATEGORIA.find(
        (p) => p.nome === compat.servico
    );

    const termosRelevantes = extrairTermosRelevantes(descricaoOriginal, prof?.palavras_chave || '');

    return {
        nome: compat.servico,
        descricao: compat.descricao,
        categoria: compat.categoria,
        confianca: Math.round(compat.scoreTotal * 100),
        score: Math.round(compat.scoreTotal * 100) / 100,
        tipo: 'catalogo',
        termosRelevantes,
        palavrasChave: prof?.palavras_chave || ''
    };
}

function extrairTermosRelevantes(descricao, palavrasChaveCsv) {
    const analise = tokenizer.analisarTexto(descricao);
    const chaves = palavrasChaveCsv.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    const textoNorm = analise.normalizado;

    const encontrados = chaves.filter((k) => {
        if (k.includes(' ')) return textoNorm.includes(k);
        return analise.palavrasChave.includes(k) || analise.tokens.includes(k);
    });

    return encontrados.slice(0, 5);
}

function listarCatalogoCompleto() {
    return mapping.PROFISSIONAIS_POR_CATEGORIA.map((p) => ({
        nome: p.nome,
        categoria: p.categoria,
        descricao: p.descricao,
        palavrasChave: p.palavras_chave
    }));
}

module.exports = {
    LIMITE_SUGESTOES_PADRAO,
    profissionaisParaServicosVirtuais,
    sugerirProfissoesPorTexto,
    listarCatalogoCompleto
};
