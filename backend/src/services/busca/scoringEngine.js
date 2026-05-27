/**
 * Motor de Cálculo de Scores
 * Calcula relevância de serviços contra solicitação do usuário
 */

const semanticAnalyzer = require('./semanticAnalyzer');
const tokenizer = require('./tokenizer');
const sinonimos = require('./sinonimosDB');

// Configuração de pesos para cada campo
const PESOS_CAMPOS = {
    titulo: 0.35,        // Muito importante
    descricao: 0.25,     // Importante
    categoria: 0.15,     // Moderadamente importante
    palavrasChave: 0.25  // Importante
};

// Multiplicadores de score por tipo de match
const MULTIPLICADORES = {
    matchExato: 3.0,           // Aumentado para valorizar palavras específicas
    matchBigrama: 5.5,         // Combinações como "limpeza piscina" agora são imbatíveis
    matchTrigrama: 8.0,        // Frases completas têm prioridade total
    matchSinonimo: 1.8,        // Match com sinônimo
    matchGenerico: 0.4,        // Reduzi drasticamente o peso de "limpeza", "manutenção", etc.
    matchParcial: 0.2,         // Match parcial baixo para evitar que "carro" bata com "carroceria" sem querer
    contextoProblem: 1.3,      // Boost se há contexto de problema
    contextoUrgencia: 1.1,     // Boost se há urgência
    penalidadeGenerica: 0.5    // Penaliza se o match for APENAS palavras genéricas
};

/**
 * Calcula score para um campo específico
 * @param {string} campo - Conteúdo do campo (titulo, descricao, etc)
 * @param {array} tokens - Tokens da busca
 * @param {array} bigramas - Bigramas da busca
 * @param {array} trigramas - Trigramas da busca
 * @returns {number} - Score normalizado (0-1)
 */
function calcularScoreCampo(campo, tokens, bigramas, trigramas) {
    const textoCampo = String(campo || '');
    if (!textoCampo) return 0;

    const campoNormalizado = tokenizer.normalizarTexto(textoCampo);
    const tokensCampo = tokenizer.tokenizar(campoNormalizado);
    const bigramasCampo = tokenizer.criarNGramas(tokensCampo, 2);
    const trigramasCampo = tokenizer.criarNGramas(tokensCampo, 3);

    let scoreTotal = 0;
    let matchesAncora = 0;
    let matchesGenericos = 0;

    // Busca trigramas (máxima prioridade)
    for (const trigrama of trigramas) {
        if (trigramasCampo.includes(trigrama)) {
            scoreTotal += MULTIPLICADORES.matchTrigrama;
            matchesAncora++;
        }
    }

    // Busca bigramas
    for (const bigrama of bigramas) {
        if (bigramasCampo.includes(bigrama)) {
            scoreTotal += MULTIPLICADORES.matchBigrama;
            matchesAncora++;
        }
    }

    // Busca tokens com sinônimos
    for (const token of tokens) {
        let multiplicador = MULTIPLICADORES.matchExato;
        
        // Se a palavra for genérica (limpar, consertar), reduzimos o peso dela
        if (sinonimos.verificarContexto(token, 'genericas')) {
            multiplicador = MULTIPLICADORES.matchGenerico;
        }

        if (tokensCampoSet.has(token)) {
            scoreTotal += multiplicador;
            continue;
        }

        const resultado = semanticAnalyzer.buscarComSinonimos(token, Array.from(tokensCampoSet));
        if (resultado.encontrada) {
            scoreTotal += MULTIPLICADORES.matchSinonimo;
        } else if (token.length > 3 && campoNormalizado.includes(token)) {
            // Match parcial (substring)
            scoreTotal += MULTIPLICADORES.matchParcial;
        }
    }

    const maxTeorico = 
        (trigramas.length * MULTIPLICADORES.matchTrigrama) + 
        (bigramas.length * MULTIPLICADORES.matchBigrama) + 
        (tokens.length * MULTIPLICADORES.matchExato);

    return maxTeorico > 0 ? Math.min(scoreTotal / maxTeorico, 1) : 0;
}

/**
 * Calcula score de compatibilidade entre solicitação e serviço
 * @param {object} analiseSemantica - Resultado de analisarSemantica()
 * @param {object} servico - Objeto do serviço {titulo, descricao, categoria, palavras_chave}
 * @returns {object} - { scoreTotal, scoresPorCampo, detalhes }
 */
function calcularCompatibilidade(analiseSemantica, servico) {
    const {
        tokens,
        bigramas,
        trigramas,
        contexto
    } = analiseSemantica;

    // Calcula scores para cada campo
    const scoresTitulo = calcularScoreCampo(servico.titulo, tokens, bigramas, trigramas);
    const scoresDescricao = calcularScoreCampo(servico.descricao, tokens, bigramas, trigramas);
    const scoresCategoria = calcularScoreCampo(servico.categoria, tokens, bigramas, trigramas);
    const scoresPalavrasChave = calcularScoreCampo(servico.palavras_chave, tokens, bigramas, trigramas);

    // Aplicar pesos
    const scoreBase = 
        (scoresTitulo * PESOS_CAMPOS.titulo) +
        (scoresDescricao * PESOS_CAMPOS.descricao) +
        (scoresCategoria * PESOS_CAMPOS.categoria) +
        (scoresPalavrasChave * PESOS_CAMPOS.palavrasChave);

    // Aplicar multiplicadores de contexto
    let scoreComContexto = scoreBase;
    let multiplicadorContexto = 1;

    if (contexto.problema > 0.5 && 
        (servico.categoria.toLowerCase().includes('manutenção') ||
         servico.categoria.toLowerCase().includes('manutencao') ||
         servico.categoria.toLowerCase().includes('reparo'))) {
        multiplicadorContexto *= MULTIPLICADORES.contextoProblem;
    }

    if (contexto.urgencia > 0.5) {
        multiplicadorContexto *= MULTIPLICADORES.contextoUrgencia;
    }

    scoreComContexto = Math.min(scoreBase * multiplicadorContexto, 1);

    return {
        servico: servico.titulo,
        descricao: servico.descricao,
        categoria: servico.categoria,
        scoreTotal: scoreComContexto,
        scoreBase,
        scoresPorCampo: {
            titulo: scoresTitulo,
            descricao: scoresDescricao,
            categoria: scoresCategoria,
            palavrasChave: scoresPalavrasChave
        },
        compatibilidade: Math.round(scoreComContexto * 100),
        contextoAplicado: {
            problema: contexto.problema,
            urgencia: contexto.urgencia,
            multiplicador: multiplicadorContexto
        }
    };
}

/**
 * Calcula scores para múltiplos serviços
 * @param {string} descricao - Descrição da solicitação
 * @param {array} servicos - Array de serviços
 * @returns {array} - Array de compatibilidades ordenado por score descendent
 */
function calcularCompatibilidadeMultipla(descricao, servicos) {
    const analiseSemantica = semanticAnalyzer.analisarSemantica(descricao);

    const compatibilidades = servicos.map(servico => 
        calcularCompatibilidade(analiseSemantica, servico)
    );

    // Ordena por score descendente
    return compatibilidades.sort((a, b) => b.scoreTotal - a.scoreTotal);
}

module.exports = {
    PESOS_CAMPOS,
    MULTIPLICADORES,
    calcularScoreCampo,
    calcularCompatibilidade,
    calcularCompatibilidadeMultipla
};
