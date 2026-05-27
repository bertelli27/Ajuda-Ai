/**
 * Base de dados centralizada de sinônimos e termos relacionados
 * Escalável: adicione novos sinônimos e contextos conforme necessário
 */

const SINONIMOS = {
    // ===== ÁGUA E PISCINA =====
    agua: ['agua', 'h2o', 'liquido', 'cano', 'encanamento', 'vazamento'],
    piscina: ['piscina', 'piscineiro', 'tratamento piscina', 'cloro', 'filtro', 'limpeza piscina', 'agua verde', 'algas', 'ph', 'limpeza de piscina', 'manutenção de piscina'],
    
    // ===== LIMPEZA =====
    limpeza: ['limpeza', 'limpar', 'limpo', 'sujo', 'sujeira', 'poeira', 'faxina', 'faxineira', 'higiene', 'higienizar', 'lavar', 'passar'],
    casa: ['casa', 'residencia', 'lar', 'apartamento', 'imovel', 'domestica', 'domicilio'],
    diarista: ['diarista', 'faxineira', 'limpeza residencial', 'arrumação', 'arrumacao', 'organização', 'organizacao'],
    
    // ===== ELETRICIDADE =====
    eletricidade: ['eletricidade', 'luz', 'energia', 'eletrico', 'eletricista', 'fiacao', 'fio', 'corrente', 'curto', 'disjuntor'],
    chuveiro: ['chuveiro', 'queimado', 'queimada', 'nao funciona', 'defeito', 'quebrado', 'chuveiro eletrico', 'resistencia'],
    luz: ['luz', 'iluminacao', 'lampada', 'apagou', 'sem luz', 'escuro', 'tomada', 'interruptor'],
    
    // ===== ENCANAMENTO =====
    agua_servico: ['agua', 'cano', 'encanamento', 'tubulacao', 'vazamento', 'vazando', 'entupido', 'entupimento', 'pingando'],
    encanador: ['encanador', 'vazamento', 'cano entupido', 'pia entupida', 'ralo entupido', 'vaso entupido', 'hidraulica', 'torneira'],
    
    // ===== TRANSPORTE =====
    motorista: ['motorista', 'dirigir', 'direcao', 'carro', 'transporte', 'condutor', 'motorista particular', 'levar', 'buscar', 'passageiro'],
    dirigir: ['dirigir', 'direcao', 'levar', 'transportar', 'motorista', 'carro', 'viagem'],
    
    // ===== REFORMAS =====
    pintura: ['pintura', 'pintar', 'tinta', 'pintor', 'parede', 'teto', 'fachada', 'descascando', 'rachadura', 'mancha', 'massa corrida'],
    obra: ['obra', 'reforma', 'construcao', 'entulho', 'pos-obra', 'reparos estruturais', 'pedreiro'],
    
    // ===== JARDINAGEM =====
    jardim: ['jardim', 'jardineiro', 'grama', 'planta', 'poda', 'capina', 'mato', 'paisagismo', 'arvore', 'cortar grama'],
    
    // ===== LIMPEZA ESPECIALIZADA =====
    estofado: ['estofado', 'sofá', 'sofa', 'colchão', 'colchao', 'carpete', 'tapete', 'mancha', 'higienização'],
    vidro: ['vidro', 'janela', 'vitrine', 'fachada', 'espelho', 'cristal', 'vidraçaria'],
};

const CONTEXTOS_PALAVRAS = {
    // Palavras que reforçam contexto
    problemas: ['quebrado', 'queimado', 'defeito', 'problema', 'vazio', 'entupido', 'vazando', 'furado', 'rachado'],
    solucoes: ['conserto', 'reparo', 'instalação', 'instalacao', 'correção', 'correcao', 'limpeza', 'manutenção'],
    urgencia: ['urgente', 'rápido', 'rapido', 'hoje', 'agora', 'já', 'ja', 'emergência', 'emergencia'],
    genericas: ['limpeza', 'limpar', 'manutencao', 'manutenção', 'conserto', 'consertar', 'reparo', 'reparar', 'ajuda', 'preciso', 'alguem', 'alguém', 'serviço', 'servico', 'profissional']
};

/**
 * Obtém sinônimos para uma palavra
 * @param {string} palavra - Palavra para buscar sinônimos
 * @returns {array} - Array com a palavra e seus sinônimos
 */
function obterSinonimos(palavra) {
    const palavraNormalizada = palavra.toLowerCase().trim();
    
    for (const [chave, sinonimos] of Object.entries(SINONIMOS)) {
        if (sinonimos.includes(palavraNormalizada)) {
            return sinonimos;
        }
    }
    
    return [palavraNormalizada];
}

/**
 * Verifica se uma palavra está associada a um contexto específico
 * @param {string} palavra - Palavra a verificar
 * @param {string} tipoContexto - Tipo de contexto (problemas, solucoes, urgencia)
 * @returns {boolean}
 */
function verificarContexto(palavra, tipoContexto) {
    const palavraNormalizada = palavra.toLowerCase().trim();
    return CONTEXTOS_PALAVRAS[tipoContexto]?.includes(palavraNormalizada) || false;
}

/**
 * Expande uma palavra para todos os seus sinônimos
 * @param {string} palavra - Palavra para expandir
 * @returns {set} - Set com a palavra e todos seus sinônimos
 */
function expandirPalavra(palavra) {
    const sinonimos = obterSinonimos(palavra);
    return new Set(sinonimos);
}

module.exports = {
    SINONIMOS,
    CONTEXTOS_PALAVRAS,
    obterSinonimos,
    verificarContexto,
    expandirPalavra
};
