/**
 * Motor de Cálculo de Scores
 * Calcula relevância de serviços contra solicitação do usuário
 */

const semanticAnalyzer = require('../nlp/semanticAnalyzer');
const tokenizer = require('../nlp/tokenizer');
const sinonimos = require('../nlp/sinonimosDB');
const { DOMINIOS_ESPECIALIZADOS } = require('../../data/dominiosEspecializados');

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
    penalidadeGenerica: 0.5,   // Penaliza se o match for APENAS palavras genéricas
    boostDominioEspecializado: 1.4,
    penalidadeForaDominio: 0.3
};

/**
 * Detecta domínios especializados presentes na solicitação (ex.: piscina, faxina residencial)
 */
function detectarDominiosAtivos(analiseSemantica) {
    const { normalizado, tokens, bigramas } = analiseSemantica;
    const tokensSet = new Set(tokens);
    const bigramasSet = new Set(bigramas);
    const ativos = [];

    for (const dominio of DOMINIOS_ESPECIALIZADOS) {
        const temToken = dominio.termosDetectores.some(t => tokensSet.has(t));
        const temFrase = dominio.frasesDetectoras.some(
            f => normalizado.includes(f) || bigramasSet.has(f)
        );

        if (temToken || temFrase) {
            ativos.push(dominio);
        }
    }

    // Domínios mais específicos têm prioridade (ex.: piscina sobre limpeza genérica)
    const idsAtivos = new Set(ativos.map(d => d.id));
    return ativos.filter(d => !d.cedePara?.some(id => idsAtivos.has(id)));
}

function servicoPertenceAoDominio(servico, dominio) {
    const textoServico = tokenizer.normalizarTexto(
        `${servico.titulo} ${servico.descricao} ${servico.palavras_chave}`
    );

    return dominio.termosServico.some(t => textoServico.includes(t)) ||
        dominio.profissoesRelacionadas.some(p => textoServico.includes(p.toLowerCase()));
}

function ajustarScorePorDominio(score, servico, dominiosAtivos) {
    if (!dominiosAtivos.length) return score;

    let scoreAjustado = score;

    for (const dominio of dominiosAtivos) {
        if (servicoPertenceAoDominio(servico, dominio)) {
            scoreAjustado = Math.min(scoreAjustado * MULTIPLICADORES.boostDominioEspecializado, 1);
        } else {
            scoreAjustado *= MULTIPLICADORES.penalidadeForaDominio;
        }
    }

    return scoreAjustado;
}

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
    const tokensCampoSet = new Set(tokensCampo);

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

    const dominiosAtivos = detectarDominiosAtivos(analiseSemantica);
    const scoreFinal = ajustarScorePorDominio(scoreComContexto, servico, dominiosAtivos);

    return {
        servico: servico.titulo,
        descricao: servico.descricao,
        categoria: servico.categoria,
        scoreTotal: scoreFinal,
        scoreBase,
        dominiosAtivos: dominiosAtivos.map(d => d.id),
        scoresPorCampo: {
            titulo: scoresTitulo,
            descricao: scoresDescricao,
            categoria: scoresCategoria,
            palavrasChave: scoresPalavrasChave
        },
        compatibilidade: Math.round(scoreFinal * 100),
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
    calcularCompatibilidadeMultipla,
    detectarDominiosAtivos,
    ajustarScorePorDominio
};
