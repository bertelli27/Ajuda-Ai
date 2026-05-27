/**
 * Analisador Semântico
 * Entende contexto completo da solicitação
 */

const sinonimos = require('./sinonimosDB');
const tokenizer = require('./tokenizer');

/**
 * Calcula similaridade entre dois conjuntos de palavras
 * Usa coeficiente de Jaccard
 * @param {array} conjunto1 - Primeiro conjunto de palavras
 * @param {array} conjunto2 - Segundo conjunto de palavras
 * @returns {number} - Score de 0 a 1
 */
function similaridadeJaccard(conjunto1, conjunto2) {
    const set1 = new Set(conjunto1);
    const set2 = new Set(conjunto2);
    
    const intersecao = new Set([...set1].filter(x => set2.has(x)));
    const uniao = new Set([...set1, ...set2]);
    
    if (uniao.size === 0) return 0;
    return intersecao.size / uniao.size;
}

/**
 * Busca correspondência de palavras considerando sinônimos
 * @param {string} palavra - Palavra para buscar
 * @param {array} textoPalavras - Array de palavras do texto
 * @returns {object} - { encontrada: bool, tipoPalavra: string, sinonimosEncontrados: [] }
 */
function buscarComSinonimos(palavra, textoPalavras) {
    const sinonimosExpandidos = sinonimos.expandirPalavra(palavra);
    const correspondencias = [];

    for (const textoPalavra of textoPalavras) {
        if (sinonimosExpandidos.has(textoPalavra)) {
            correspondencias.push(textoPalavra);
        }
    }

    return {
        encontrada: correspondencias.length > 0,
        correspondencias,
        totalCorrespondencias: correspondencias.length
    };
}

/**
 * Analisa contexto de urgência na solicitação
 * @param {array} tokens - Array de tokens
 * @returns {number} - Score de urgência (0-1)
 */
function analisarUrgencia(tokens) {
    let scoreUrgencia = 0;
    
    for (const token of tokens) {
        if (sinonimos.verificarContexto(token, 'urgencia')) {
            scoreUrgencia += 0.3;
        }
    }

    return Math.min(scoreUrgencia, 1);
}

/**
 * Analisa se o contexto indica um problema
 * @param {array} tokens - Array de tokens
 * @returns {number} - Score de problema (0-1)
 */
function analisarContextoProblema(tokens) {
    let scoreProblema = 0;

    for (const token of tokens) {
        if (sinonimos.verificarContexto(token, 'problemas')) {
            scoreProblema += 0.2;
        }
    }

    return Math.min(scoreProblema, 1);
}

/**
 * Análise semântica completa de uma solicitação
 * @param {string} descricao - Descrição do problema/serviço
 * @returns {object} - Análise semântica completa
 */
function analisarSemantica(descricao) {
    const analiseTokens = tokenizer.analisarTexto(descricao);
    
    const {
        tokens,
        bigramas,
        trigramas,
        palavrasChave,
        normalizado
    } = analiseTokens;

    // Análise contextual
    const urgencia = analisarUrgencia(tokens);
    const problema = analisarContextoProblema(tokens);
    
    // Análise de cobertura (quantas palavras-chave encontradas)
    const coberturaPalavrasChave = palavrasChave.length > 0 ? 1 : 0;

    return {
        entrada: descricao,
        tokens,
        bigramas,
        trigramas,
        palavrasChave,
        normalizado,
        contexto: {
            urgencia: urgencia,
            problema: problema,
            confiancaContexto: Math.max(urgencia, problema)
        },
        metadados: {
            totalTokens: tokens.length,
            totalPalavrasChave: palavrasChave.length,
            complexidade: tokens.length > 10 ? 'alta' : tokens.length > 5 ? 'média' : 'baixa'
        }
    };
}

/**
 * Busca termos relacionados considerando sinônimos
 * Útil para expandir busca
 * @param {string} termo - Termo para buscar termos relacionados
 * @returns {array} - Array com termo e sinônimos
 */
function buscarTermosRelacionados(termo) {
    return sinonimos.obterSinonimos(termo);
}

module.exports = {
    similaridadeJaccard,
    buscarComSinonimos,
    analisarUrgencia,
    analisarContextoProblema,
    analisarSemantica,
    buscarTermosRelacionados
};
