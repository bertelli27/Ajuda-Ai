/**
 * Assistente Inteligente - Refatorado
 * Integração completa de NLP e busca semântica
 */

const db = require('../config/db');
const scoringEngine = require('./busca/scoringEngine');
const semanticAnalyzer = require('./nlp/semanticAnalyzer');
const tokenizer = require('./nlp/tokenizer');
const mapping = require('../data/profissionaisMapeamento');

/**
 * Busca serviços ativos no banco de dados
 * @returns {array} - Array de serviços com todos os campos
 */
async function buscarServicosAtivos() {
    try {
        const query = `
            SELECT
                s.id,
                s.titulo,
                s.descricao,
                c.nome AS categoria,
                u.nome AS prestador_nome,
                u.email AS prestador_email
            FROM servicos s
            JOIN categorias c ON s.categoria_id = c.id
            JOIN prestadores p ON s.prestador_id = p.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE s.status = 'ATIVO'
            LIMIT 100
        `;

        const [servicos] = await db.execute(query);
        
        // Transforma em formato esperado pelo scoring engine
        return servicos.map(s => { // 🚀 ENRIQUECIMENTO DINÂMICO
            const tituloLower = tokenizer.normalizarTexto(s.titulo);
            const descLower = (s.descricao || '').toLowerCase();
            
            let tagsMapeadas = '';
            let descricaoAuxiliar = '';

            // 🚀 ENRIQUECIMENTO CIRÚRGICO: Apenas se encontrar âncoras técnicas
            for (const p of mapping.PROFISSIONAIS_POR_CATEGORIA) {
                const nomeProfissao = p.nome.toLowerCase();
                
                // Filtra apenas as palavras-chave que NÃO são genéricas para usar como gatilho
                const keywordsGatilho = p.palavras_chave.split(',')
                    .map(k => k.trim())
                    .filter(k => !semanticAnalyzer.buscarTermosRelacionados('genericas').includes(k));

                const matchAncora = tituloLower.includes(nomeProfissao) || 
                                   keywordsGatilho.some(k => tituloLower.includes(k));

                if (matchAncora) {
                    tagsMapeadas += ` ${p.palavras_chave.replace(/limpeza|manutenção|conserto/gi, '')}`; // Evita duplicar genéricos
                    descricaoAuxiliar = p.descricao;
                }
            }

            return {
                id: s.id,
                titulo: s.titulo,
                descricao: s.descricao || descricaoAuxiliar || 'Prestador de serviços especializado.',
                categoria: s.categoria,
                palavras_chave: `${s.titulo} ${s.categoria} ${tagsMapeadas}`.trim(),
                prestador: s.prestador_nome,
                email: s.prestador_email
            };
        });
    } catch (erro) {
        console.error('Erro ao buscar serviços:', erro);
        return [];
    }
}

/**
 * Análise profunda de uma solicitação
 * Retorna análise completa para debug e otimização
 * @param {string} descricao - Descrição da solicitação
 * @returns {object} - Análise detalhada
 */
function analisarSolicitacaoDetalhado(descricao) {
    const analiseSemantica = semanticAnalyzer.analisarSemantica(descricao);

    return {
        entrada: descricao,
        analiseTokens: {
            tokens: analiseSemantica.tokens,
            bigramas: analiseSemantica.bigramas,
            trigramas: analiseSemantica.trigramas,
            palavrasChave: analiseSemantica.palavrasChave
        },
        contexto: {
            urgencia: analiseSemantica.contexto.urgencia,
            problema: analiseSemantica.contexto.problema,
            confianca: analiseSemantica.contexto.confiancaContexto
        },
        metadados: analiseSemantica.metadados,
        complexidade: analiseSemantica.metadados.complexidade
    };
}

/**
 * Análise inteligente de problema - Função principal
 * @param {string} descricaoProblema - Descrição do problema
 * @param {boolean} detalhado - Se true, retorna análise completa
 * @returns {object} - Resultado com serviços recomendados
 */
async function analisarProblema(descricaoProblema, detalhado = false) {
    const descricao = descricaoProblema?.trim();

    // Validação
    if (!descricao || descricao.length < 5) {
        const erro = new Error('Descreva o problema com pelo menos 5 caracteres.');
        erro.statusCode = 400;
        throw erro;
    }

    // Análise semântica
    const analiseSemantica = semanticAnalyzer.analisarSemantica(descricao);

    // Busca serviços
    const servicos = await buscarServicosAtivos();

    if (servicos.length === 0) {
        return {
            descricaoAnalisada: descricao,
            profissionais: [],
            explicacao: 'Desculpe, nenhum serviço disponível no momento.',
            analise: detalhado ? analisarSolicitacaoDetalhado(descricao) : undefined
        };
    }

    // Calcula compatibilidade para todos os serviços
    const compatibilidades = scoringEngine.calcularCompatibilidadeMultipla(descricao, servicos);

    // Filtra top 3 com score > 0
    const top3 = compatibilidades
        .filter(c => c.scoreTotal > 0)
        .slice(0, 3);

    // Se nenhum com score positivo, retorna top 1 mesmo assim
    const profissionaisSugeridos = top3.length > 0 ? top3 : compatibilidades.slice(0, 1);

    // Pega a categoria do melhor resultado real do banco
    const categoriaSugerida = profissionaisSugeridos.length > 0 ? profissionaisSugeridos[0].categoria : 'Outros';

    // Formata resposta
    const resposta = {
        descricaoAnalisada: descricao,
        contexto: analiseSemantica.contexto,
        categoriaPrincipal: categoriaSugerida, // Vincula a categoria ao prestador real encontrado
        profissionais: profissionaisSugeridos.map(p => ({
            nome: p.servico,
            descricao: p.descricao,
            categoria: p.categoria,
            confianca: p.compatibilidade, // Alinha com o campo esperado pelo front-end
            score: Math.round(p.scoreTotal * 100) / 100,
            detalhesScore: p.scoresPorCampo
        })),
        explicacao: gerarExplicacao(profissionaisSugeridos, descricao),
        totalServiçosAvaliados: servicos.length
    };

    // Adiciona análise detalhada se solicitado
    if (detalhado) {
        resposta.analiseCompleta = {
            entrada: descricao,
            tokenizacao: analiseSemantica.tokens,
            bigramas: analiseSemantica.bigramas,
            trigramas: analiseSemantica.trigramas,
            palavrasChave: analiseSemantica.palavrasChave,
            contextoDetectado: analiseSemantica.contexto,
            scoresDetalhados: compatibilidades.slice(0, 5)
        };
    }

    return resposta;
}

/**
 * Gera explicação humanizada da recomendação
 * @param {array} sugeridos - Array de profissionais sugeridos
 * @param {string} descricao - Descrição original
 * @returns {string} - Explicação formatada
 */
function gerarExplicacao(sugeridos, descricao) {
    if (sugeridos.length === 0) {
        return 'Desculpe, não conseguimos identificar um serviço adequado. Tente descrever com mais detalhes.';
    }

    const principal = sugeridos[0];
    const compatibilidadePercent = principal.compatibilidade;
    
    if (compatibilidadePercent >= 80) {
        return `Encontramos uma correspondência excelente! Recomendamos ${principal.servico} (${compatibilidadePercent}% de compatibilidade).`;
    } else if (compatibilidadePercent >= 60) {
        return `Recomendamos ${principal.servico} (${compatibilidadePercent}% de compatibilidade) para sua solicitação.`;
    } else if (compatibilidadePercent >= 40) {
        return `Sugerimos ${principal.servico}, porém a compatibilidade é moderada (${compatibilidadePercent}%). Se não for exatamente o que procura, veja outras opções.`;
    } else {
        return `Embora ${principal.servico} seja nossa melhor sugestão (${compatibilidadePercent}%), a compatibilidade é baixa. Descreva melhor o que precisa.`;
    }
}

/**
 * Lista todos os profissionais mapeados (compatibilidade com API anterior)
 * @returns {object} - Lista de profissionais
 */
async function listarProfissionaisMapeados() {
    const servicos = await buscarServicosAtivos();
    
    const categorias = [...new Set(servicos.map(s => s.categoria))];

    return {
        fonte: 'banco de dados (servicos ativos)',
        categorias,
        total: servicos.length,
        profissionais: servicos.map(s => ({
            nome: s.titulo,
            categoria: s.categoria,
            descricao: s.descricao,
            prestador: s.prestador
        }))
    };
}

module.exports = {
    analisarProblema,
    listarProfissionaisMapeados,
    buscarServicosAtivos,
    analisarSolicitacaoDetalhado
};
