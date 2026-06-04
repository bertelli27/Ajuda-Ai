/**
 * Tokenizador inteligente
 * Quebra texto em tokens significativos e normaliza
 */

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s-]/g, ' ') // Remove caracteres especiais
        .replace(/\s+/g, ' ') // Remove espaços múltiplos
        .trim();
}

/**
 * Tokeniza texto em palavras individuais
 * @param {string} texto - Texto para tokenizar
 * @returns {array} - Array de tokens (palavras)
 */
function tokenizar(texto) {
    const textoNormalizado = normalizarTexto(texto);
    return textoNormalizado.split(/\s+/).filter(token => token.length > 0);
}

/**
 * Cria n-gramas a partir dos tokens (2-gramas, 3-gramas, etc)
 * Útil para detectar frases específicas
 * @param {array} tokens - Array de tokens
 * @param {number} n - Tamanho do n-grama (padrão 2)
 * @returns {array} - Array de n-gramas
 */
function criarNGramas(tokens, n = 2) {
    const ngramas = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        ngramas.push(tokens.slice(i, i + n).join(' '));
    }
    return ngramas;
}

/**
 * Filtra tokens com comprimento mínimo
 * @param {array} tokens - Array de tokens
 * @param {number} minLength - Comprimento mínimo (padrão 2)
 * @returns {array} - Array filtrado
 */
function filtrarTokensCurtos(tokens, minLength = 2) {
    return tokens.filter(token => token.length >= minLength);
}

/**
 * Extrai palavras-chave principais (sem stopwords)
 * @param {string} texto - Texto para análise
 * @returns {array} - Array de palavras-chave
 */
function extrairPalavrasChave(texto) {
    const stopwords = new Set([
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
        'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
        'para', 'por', 'e', 'ou', 'com', 'sem', 'é', 'sou', 'está',
        'estou', 'são', 'está', 'estão', 'foi', 'foram', 'ser', 'estar',
        'ter', 'não', 'nao', 'sim', 'mais', 'menos', 'muito', 'pouco'
    ]);

    const tokens = tokenizar(texto);
    return filtrarTokensCurtos(tokens).filter(token => !stopwords.has(token));
}

/**
 * Análise completa de um texto
 * Retorna estrutura com tokens, n-gramas e palavras-chave
 * @param {string} texto - Texto para análise
 * @returns {object} - Objeto com análise completa
 */
function analisarTexto(texto) {
    const tokens = tokenizar(texto);
    const palavrasChave = extrairPalavrasChave(texto);
    // N-gramas sem stopwords: "limpeza de piscina" → bigrama "limpeza piscina"
    const bigramas = criarNGramas(palavrasChave, 2);
    const trigramas = criarNGramas(palavrasChave, 3);

    return {
        original: texto,
        normalizado: normalizarTexto(texto),
        tokens,
        bigramas,
        trigramas,
        palavrasChave,
        totalTokens: tokens.length
    };
}

module.exports = {
    normalizarTexto,
    tokenizar,
    criarNGramas,
    filtrarTokensCurtos,
    extrairPalavrasChave,
    analisarTexto
};
