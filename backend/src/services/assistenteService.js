const { CATEGORIAS_SCHEMA, PROFISSIONAIS_POR_CATEGORIA } = require('../data/profissionaisMapeamento');

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, ' ');
}

function calcularPontuacao(textoNormalizado, palavrasChave) {
    const chaves = palavrasChave
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => normalizarTexto(p));

    let pontuacao = 0;
    const termosEncontrados = [];

    // Quebra o texto em palavras para busca por palavra inteira, não substring
    const palavrasTexto = textoNormalizado.split(/\s+/).filter(Boolean);

    for (const chave of chaves) {
        // Se a chave tem múltiplas palavras (ex: "dog walker"), busca como frase
        if (chave.includes(' ')) {
            if (textoNormalizado.includes(chave)) {
                pontuacao += 3;
                termosEncontrados.push(chave);
            }
        } else {
            // Se é uma palavra única, busca por palavra inteira, não substring
            if (palavrasTexto.includes(chave)) {
                pontuacao += 1;
                termosEncontrados.push(chave);
            }
        }
    }

    return { pontuacao, termosEncontrados };
}

function montarExplicacao(profissionais, categoriaPrincipal) {
    if (profissionais.length === 0) {
        return `Não identificamos um profissional específico. Explore a categoria "${categoriaPrincipal}" ou descreva o problema com mais detalhes.`;
    }

    const nomes = profissionais.map((p) => p.nome).join(', ');
    return `Com base na sua descrição, recomendamos: ${nomes}. Categoria: ${categoriaPrincipal}.`;
}

function analisarProblema(descricaoProblema) {
    const descricao = descricaoProblema?.trim();

    if (!descricao || descricao.length < 5) {
        const erro = new Error('Descreva o problema com pelo menos 5 caracteres.');
        erro.statusCode = 400;
        throw erro;
    }

    const textoNormalizado = normalizarTexto(descricao);

    const resultados = PROFISSIONAIS_POR_CATEGORIA
        .map((tipo) => {
            const { pontuacao, termosEncontrados } = calcularPontuacao(textoNormalizado, tipo.palavras_chave);
            return {
                nome: tipo.nome,
                categoria: tipo.categoria,
                descricao: tipo.descricao,
                pontuacao,
                termosEncontrados,
                confianca: 0
            };
        })
        .filter((item) => item.pontuacao > 0)
        .sort((a, b) => b.pontuacao - a.pontuacao);

    let profissionaisSugeridos = resultados.slice(0, 3);

    if (profissionaisSugeridos.length === 0) {
        const fallback = PROFISSIONAIS_POR_CATEGORIA.find((t) => t.nome === 'Prestador Geral');
        profissionaisSugeridos = [{
            nome: fallback.nome,
            categoria: fallback.categoria,
            descricao: fallback.descricao,
            pontuacao: 0,
            termosEncontrados: [],
            confianca: 20
        }];
    } else {
        const maxPontuacao = profissionaisSugeridos[0].pontuacao;
        profissionaisSugeridos = profissionaisSugeridos.map((item) => ({
            ...item,
            confianca: Math.min(100, Math.round((item.pontuacao / maxPontuacao) * 100))
        }));
    }

    const categoriaPrincipal = profissionaisSugeridos[0].categoria;

    return {
        descricaoAnalisada: descricao,
        categoriaPrincipal,
        categoriasDisponiveis: CATEGORIAS_SCHEMA,
        profissionais: profissionaisSugeridos.map(({ nome, categoria, descricao: desc, confianca, termosEncontrados }) => ({
            nome,
            categoria,
            descricao: desc,
            confianca,
            termosEncontrados
        })),
        explicacao: montarExplicacao(profissionaisSugeridos, categoriaPrincipal)
    };
}

function listarProfissionaisMapeados() {
    return {
        fonte: 'schema.sql (categorias)',
        categorias: CATEGORIAS_SCHEMA,
        total: PROFISSIONAIS_POR_CATEGORIA.length,
        profissionais: PROFISSIONAIS_POR_CATEGORIA.map(({ nome, categoria, descricao }) => ({
            nome,
            categoria,
            descricao
        }))
    };
}

module.exports = {
    analisarProblema,
    listarProfissionaisMapeados
};
