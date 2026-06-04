/**
 * Assistente Inteligente - Refatorado
 * Integração completa de NLP e busca semântica
 */

const db = require('../config/db');
const scoringEngine = require('./busca/scoringEngine');
const semanticAnalyzer = require('./nlp/semanticAnalyzer');
const tokenizer = require('./nlp/tokenizer');
const mapping = require('../data/profissionaisMapeamento');
const catalogoProfissao = require('./catalogoProfissaoService');

/** Compatibilidade mínima (%) para considerar match com prestador do banco */
const LIMIAR_BOA_CORRESPONDENCIA = 35;
/** Score bruto mínimo (0–1) para confiar no melhor prestador */
const LIMIAR_SCORE_PRESTADOR = 0.1;

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
            let melhorProfissao = null;
            let melhorPontuacao = 0;

            // Enriquecimento: escolhe a profissão mais específica (evita misturar diarista + piscineiro)
            for (const p of mapping.PROFISSIONAIS_POR_CATEGORIA) {
                const nomeProfissao = p.nome.toLowerCase();

                const keywordsGatilho = p.palavras_chave.split(',')
                    .map(k => k.trim().toLowerCase())
                    .filter(k => k.length > 0)
                    .filter(k => !semanticAnalyzer.buscarTermosRelacionados('genericas').includes(k));

                const gatilhosNoTitulo = keywordsGatilho.filter(k => tituloLower.includes(k));
                const matchNome = tituloLower.includes(nomeProfissao);
                const matchAncora = matchNome || gatilhosNoTitulo.length > 0;

                if (!matchAncora) continue;

                const pontuacao = (matchNome ? 100 : 0) +
                    gatilhosNoTitulo.reduce((acc, k) => acc + k.length, 0);

                if (pontuacao > melhorPontuacao) {
                    melhorPontuacao = pontuacao;
                    melhorProfissao = p;
                }
            }

            if (melhorProfissao) {
                tagsMapeadas = melhorProfissao.palavras_chave.replace(/limpeza|manutenção|conserto/gi, '');
                descricaoAuxiliar = melhorProfissao.descricao;
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

    const sugestoesCatalogo = catalogoProfissao.sugerirProfissoesPorTexto(descricao);

    if (servicos.length === 0) {
        const respostaSemPrestadores = montarResposta({
            descricao,
            analiseSemantica,
            servicos,
            profissionaisDb: [],
            sugestoesCatalogo,
            detalhado
        });
        return respostaSemPrestadores;
    }

    const compatibilidades = scoringEngine.calcularCompatibilidadeMultipla(descricao, servicos);
    const top3 = compatibilidades.filter((c) => c.scoreTotal > 0).slice(0, 3);
    const profissionaisSugeridos = top3.length > 0 ? top3 : compatibilidades.slice(0, 1);

    const melhorPrestador = profissionaisSugeridos[0];
    const temBoaCorrespondenciaPrestador = melhorPrestador &&
        melhorPrestador.compatibilidade >= LIMIAR_BOA_CORRESPONDENCIA &&
        melhorPrestador.scoreTotal >= LIMIAR_SCORE_PRESTADOR;

    const resposta = montarResposta({
        descricao,
        analiseSemantica,
        servicos,
        profissionaisDb: profissionaisSugeridos,
        sugestoesCatalogo,
        temBoaCorrespondenciaPrestador,
        detalhado
    });

    if (detalhado && compatibilidades) {
        resposta.analiseCompleta.scoresDetalhados = compatibilidades.slice(0, 5);
        resposta.analiseCompleta.sugestoesCatalogoDetalhadas = sugestoesCatalogo;
    }

    return resposta;
}

function montarResposta({
    descricao,
    analiseSemantica,
    servicos,
    profissionaisDb,
    sugestoesCatalogo,
    temBoaCorrespondenciaPrestador = false,
    detalhado = false
}) {
    const melhorCatalogo = sugestoesCatalogo[0] || null;
    const semPrestadores = servicos.length === 0;
    const catalogoRelevante = melhorCatalogo && melhorCatalogo.confianca > 0;

    let tipoCorrespondencia = 'prestador';
    if (semPrestadores && catalogoRelevante) {
        tipoCorrespondencia = 'catalogo';
    } else if (!semPrestadores && !temBoaCorrespondenciaPrestador && catalogoRelevante) {
        tipoCorrespondencia = 'misto';
    } else if (!semPrestadores && profissionaisDb.length === 0 && catalogoRelevante) {
        tipoCorrespondencia = 'catalogo';
    }

    const categoriaSugerida = temBoaCorrespondenciaPrestador && profissionaisDb[0]
        ? profissionaisDb[0].categoria
        : (melhorCatalogo?.categoria || 'Outros');

    const profissionais = profissionaisDb.map((p) => ({
        nome: p.servico,
        descricao: p.descricao,
        categoria: p.categoria,
        confianca: p.compatibilidade,
        score: Math.round(p.scoreTotal * 100) / 100,
        tipo: 'prestador',
        baixaCorrespondencia: !temBoaCorrespondenciaPrestador,
        detalhesScore: p.scoresPorCampo
    }));

    const resposta = {
        descricaoAnalisada: descricao,
        contexto: analiseSemantica.contexto,
        categoriaPrincipal: categoriaSugerida,
        tipoCorrespondencia,
        semPrestadoresDisponiveis: semPrestadores,
        profissionais,
        sugestoesCatalogo,
        explicacao: gerarMensagemCompleta({
            tipoCorrespondencia,
            profissionaisDb,
            sugestoesCatalogo,
            temBoaCorrespondenciaPrestador,
            semPrestadores,
            descricao
        }),
        mensagemOrientacao: gerarMensagemOrientacao(tipoCorrespondencia, melhorCatalogo, semPrestadores),
        totalServiçosAvaliados: servicos.length,
        totalProfissoesCatalogo: mapping.PROFISSIONAIS_POR_CATEGORIA.length
    };

    if (detalhado) {
        resposta.analiseCompleta = {
            entrada: descricao,
            tokenizacao: analiseSemantica.tokens,
            bigramas: analiseSemantica.bigramas,
            trigramas: analiseSemantica.trigramas,
            palavrasChave: analiseSemantica.palavrasChave,
            contextoDetectado: analiseSemantica.contexto,
            temBoaCorrespondenciaPrestador,
            tipoCorrespondencia
        };
    }

    return resposta;
}

/**
 * Mensagem principal exibida no assistente
 */
function gerarMensagemCompleta({
    tipoCorrespondencia,
    profissionaisDb,
    sugestoesCatalogo,
    temBoaCorrespondenciaPrestador,
    semPrestadores,
    descricao
}) {
    const catalogo = sugestoesCatalogo[0];

    if (semPrestadores && catalogo) {
        return `Ainda não há prestadores cadastrados para atender "${resumirDescricao(descricao)}". Pela sua descrição, o profissional mais indicado seria um ${catalogo.nome} (${catalogo.categoria}). Confira a sugestão abaixo e use o filtro para buscar quando houver cadastros.`;
    }

    if (tipoCorrespondencia === 'misto' && catalogo) {
        const prestador = profissionaisDb[0];
        const nomePrestador = prestador?.servico || 'os prestadores listados';
        const pct = prestador?.compatibilidade ?? 0;
        return `Os prestadores disponíveis têm compatibilidade baixa com seu pedido (melhor match: ${nomePrestador}, ${pct}%). Com base no que você escreveu, o perfil mais adequado seria ${catalogo.nome}. Veja a sugestão por profissão e os prestadores mais próximos abaixo.`;
    }

    if (tipoCorrespondencia === 'catalogo' && catalogo) {
        return `Não encontramos prestadores com boa correspondência, mas identificamos que você precisa de um ${catalogo.nome} (${catalogo.categoria}).`;
    }

    return gerarExplicacaoPrestadores(profissionaisDb, temBoaCorrespondenciaPrestador);
}

function gerarMensagemOrientacao(tipoCorrespondencia, melhorCatalogo, semPrestadores) {
    if (semPrestadores) {
        return 'Quer oferecer esse serviço? Cadastre-se em "Trabalhe Conosco". Clientes: volte em breve ou refine a busca manualmente.';
    }
    if (tipoCorrespondencia === 'misto' || tipoCorrespondencia === 'catalogo') {
        return `Dica: filtre pela categoria "${melhorCatalogo?.categoria || 'sugerida'}" ou busque por "${melhorCatalogo?.nome || 'profissional'}" na barra de pesquisa.`;
    }
    return null;
}

function resumirDescricao(descricao, max = 60) {
    const t = descricao.trim();
    return t.length <= max ? t : `${t.slice(0, max)}...`;
}

function gerarExplicacaoPrestadores(sugeridos, temBoaCorrespondencia) {
    if (sugeridos.length === 0) {
        return 'Não identificamos prestadores compatíveis. Veja as sugestões de profissão abaixo ou descreva com mais detalhes (local, urgência, o que está acontecendo).';
    }

    const principal = sugeridos[0];
    const pct = principal.compatibilidade;

    if (!temBoaCorrespondencia) {
        return `Encontramos prestadores parciais (melhor: ${principal.servico}, ${pct}% de compatibilidade). Recomendamos também verificar a sugestão de profissão abaixo.`;
    }
    if (pct >= 80) {
        return `Excelente correspondência! Recomendamos ${principal.servico} (${pct}% de compatibilidade).`;
    }
    if (pct >= 60) {
        return `Recomendamos ${principal.servico} (${pct}% de compatibilidade) para sua solicitação.`;
    }
    if (pct >= 40) {
        return `Sugerimos ${principal.servico} com compatibilidade moderada (${pct}%). Veja outras opções se necessário.`;
    }
    return `Melhor opção entre os cadastrados: ${principal.servico} (${pct}%). Veja também a sugestão de profissão.`;
}

/**
 * Lista todos os profissionais mapeados (compatibilidade com API anterior)
 * @returns {object} - Lista de profissionais
 */
async function listarProfissionaisMapeados() {
    const servicos = await buscarServicosAtivos();
    const categoriasDb = [...new Set(servicos.map((s) => s.categoria))];

    return {
        fonte: 'banco de dados (servicos ativos) + catalogo de referencia',
        categorias: mapping.CATEGORIAS_SCHEMA,
        categoriasComPrestadores: categoriasDb,
        totalPrestadoresAtivos: servicos.length,
        totalCatalogoReferencia: mapping.PROFISSIONAIS_POR_CATEGORIA.length,
        prestadoresAtivos: servicos.map((s) => ({
            nome: s.titulo,
            categoria: s.categoria,
            descricao: s.descricao,
            prestador: s.prestador
        })),
        catalogoReferencia: catalogoProfissao.listarCatalogoCompleto()
    };
}

module.exports = {
    analisarProblema,
    listarProfissionaisMapeados,
    buscarServicosAtivos,
    analisarSolicitacaoDetalhado
};
