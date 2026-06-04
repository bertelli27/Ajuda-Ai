/**
 * Domínios especializados para desambiguar serviços parecidos.
 * Ex.: "limpar piscina" não deve priorizar diarista/faxina residencial.
 */
const DOMINIOS_ESPECIALIZADOS = [
    {
        id: 'piscina',
        termosDetectores: ['piscina', 'piscineiro', 'cloro', 'algas', 'ph'],
        frasesDetectoras: [
            'agua verde',
            'limpeza piscina',
            'limpar piscina',
            'limpeza de piscina',
            'tratamento piscina',
            'manutencao piscina',
            'manutencao de piscina',
            'tratamento de piscina'
        ],
        termosServico: ['piscina', 'piscineiro', 'cloro', 'filtro', 'algas', 'ph', 'tratamento'],
        profissoesRelacionadas: ['Piscineiro']
    },
    {
        id: 'limpeza_residencial',
        termosDetectores: ['diarista', 'faxina', 'faxineira', 'domestica', 'doméstica'],
        frasesDetectoras: [
            'limpeza residencial',
            'limpeza domestica',
            'limpeza da casa',
            'faxina na casa',
            'limpeza do apartamento'
        ],
        termosServico: ['diarista', 'faxina', 'residencial', 'domestica', 'apartamento', 'lar'],
        profissoesRelacionadas: ['Diarista'],
        cedePara: ['piscina']
    },
    {
        id: 'estofados',
        termosDetectores: ['estofado', 'sofa', 'colchao', 'carpete', 'tapete'],
        frasesDetectoras: ['limpeza de sofa', 'higienizacao de estofado'],
        termosServico: ['estofado', 'sofa', 'colchao', 'carpete', 'tapete', 'higienizacao'],
        profissoesRelacionadas: ['Limpeza de Estofados']
    },
    {
        id: 'dedetizacao',
        termosDetectores: ['dedetizar', 'dedetizacao', 'dedetização', 'pragas', 'barata', 'cupim', 'rato'],
        frasesDetectoras: ['dedetizar casa', 'controle de pragas'],
        termosServico: ['dedetizador', 'dedetizacao', 'pragas', 'desinsetizacao'],
        profissoesRelacionadas: ['Dedetizador']
    },
    {
        id: 'mudanca',
        termosDetectores: ['mudanca', 'mudança', 'frete', 'carreto'],
        frasesDetectoras: ['mudança de apartamento', 'mudanca de casa', 'transporte de moveis'],
        termosServico: ['mudanca', 'frete', 'carreto', 'transporte'],
        profissoesRelacionadas: ['Frete e Mudanças']
    }
];

module.exports = { DOMINIOS_ESPECIALIZADOS };
