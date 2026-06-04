/**
 * Analisa prestadores_ficticios.csv e avaliacoes_ficticias.csv
 * e gera mapeamento para o schema do banco.
 */
const fs = require('fs');
const path = require('path');
const catalogoProfissao = require('../src/services/catalogoProfissaoService');
const mapping = require('../src/data/profissionaisMapeamento');

const BACKEND_ROOT = path.join(__dirname, '..');

function parseCsvLine(line) {
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (c === ',' && !inQuotes) {
            cols.push(cur);
            cur = '';
            continue;
        }
        cur += c;
    }
    cols.push(cur);
    return cols;
}

function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split(/\r?\n/);
    const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = parseCsvLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = (cols[idx] ?? '').replace(/^"|"$/g, '');
        });
        rows.push(row);
    }
    return { headers, rows };
}

function classificarPrestador(descricao) {
    const sugestoes = catalogoProfissao.sugerirProfissoesPorTexto(descricao, 1);
    if (sugestoes.length > 0) {
        return {
            profissao: sugestoes[0].nome,
            categoria: sugestoes[0].categoria,
            confianca: sugestoes[0].confianca
        };
    }
    return { profissao: 'Prestador Geral', categoria: 'Outros', confianca: 0 };
}

function main() {
    const prestPath = path.join(BACKEND_ROOT, 'prestadores_ficticios.csv');
    const avalPath = path.join(BACKEND_ROOT, 'avaliacoes_ficticias.csv');
    const outDir = path.join(BACKEND_ROOT, 'src', 'data', 'seed');

    const prest = parseCsv(prestPath);
    const aval = parseCsv(avalPath);

    const prestadoresMapeados = prest.rows.map((row) => {
        const classificacao = classificarPrestador(row.descricao_perfil);
        return {
            prestador_id: row.id,
            usuario_id: row.usuario_id,
            descricao_perfil: row.descricao_perfil,
            profissao_sugerida: classificacao.profissao,
            categoria_schema: classificacao.categoria,
            confianca_classificacao: classificacao.confianca,
            tabelas_db: {
                prestadores: { id: Number(row.id), usuario_id: Number(row.usuario_id) },
                usuarios: { id: Number(row.usuario_id), tipo: 'prestador' },
                servicos: {
                    prestador_id: Number(row.id),
                    categoria_id: `categorias.nome = '${classificacao.categoria}'`,
                    titulo_sugerido: classificacao.profissao,
                    descricao: row.descricao_perfil,
                    status: 'ATIVO'
                }
            }
        };
    });

    const prestIds = new Set(prest.rows.map((r) => r.id));
    const avaliacoesMapeadas = aval.rows.map((row) => ({
        avaliacao_id: row.id,
        solicitacao_id: row.solicitacao_id,
        cliente_id: row.cliente_id,
        prestador_id: row.prestador_id,
        nota: Number(row.nota),
        comentario: row.comentario || null,
        criado_em: row.criado_em,
        prestador_existe_no_csv: prestIds.has(row.prestador_id),
        tabelas_db: {
            avaliacoes: {
                id: Number(row.id),
                solicitacao_id: Number(row.solicitacao_id),
                servico_id: 'derivar de solicitacoes.servico_id',
                cliente_id: Number(row.cliente_id),
                prestador_id: Number(row.prestador_id),
                nota: Number(row.nota),
                comentario: row.comentario || null
            },
            solicitacoes: {
                id: Number(row.solicitacao_id),
                status: 'CONCLUIDO',
                cliente_id: Number(row.cliente_id)
            },
            usuarios_cliente: { id: Number(row.cliente_id), tipo: 'cliente' }
        }
    }));

    const prestadoresSemAvaliacao = [...prestIds].filter(
        (id) => !avaliacoesMapeadas.some((a) => a.prestador_id === id)
    );
    const avaliacoesPrestadorInexistente = avaliacoesMapeadas.filter((a) => !a.prestador_existe_no_csv);

    const porCategoria = {};
    const porProfissao = {};
    for (const p of prestadoresMapeados) {
        porCategoria[p.categoria_schema] = (porCategoria[p.categoria_schema] || 0) + 1;
        porProfissao[p.profissao_sugerida] = (porProfissao[p.profissao_sugerida] || 0) + 1;
    }

    const notasDistribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const a of avaliacoesMapeadas) {
        notasDistribuicao[a.nota] = (notasDistribuicao[a.nota] || 0) + 1;
    }

    const resumo = {
        gerado_em: new Date().toISOString(),
        arquivos: {
            prestadores_ficticios: prest.rows.length,
            avaliacoes_ficticias: aval.rows.length
        },
        faixas_ids_ficticios: {
            prestadores: { min: 200001, max: 201000, usuario_id_min: 500001, usuario_id_max: 501000 },
            avaliacoes: { min: 200001, max: 201000 },
            solicitacoes: { min: 400001, max: 401000 },
            clientes: { min: 600001, max: 601500 }
        },
        integridade: {
            prestadores_sem_avaliacao: prestadoresSemAvaliacao.length,
            avaliacoes_com_prestador_invalido: avaliacoesPrestadorInexistente.length,
            solicitacoes_unicas: new Set(avaliacoesMapeadas.map((a) => a.solicitacao_id)).size,
            clientes_unicos: new Set(avaliacoesMapeadas.map((a) => a.cliente_id)).size
        },
        distribuicao_prestadores_por_categoria: porCategoria,
        distribuicao_prestadores_por_profissao: porProfissao,
        distribuicao_notas: notasDistribuicao,
        schema_relacionamentos: [
            'usuarios (500001-501000) -> prestadores (200001-201000)',
            'usuarios (600001-601500) -> solicitacoes.cliente_id',
            'servicos.prestador_id -> prestadores.id',
            'solicitacoes.servico_id -> servicos.id',
            'avaliacoes -> solicitacao_id, servico_id, cliente_id, prestador_id'
        ]
    };

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
        path.join(outDir, 'mapeamento-prestadores-ficticios.json'),
        JSON.stringify({ resumo: { total: prestadoresMapeados.length, distribuicao: resumo.distribuicao_prestadores_por_categoria }, prestadores: prestadoresMapeados }, null, 2)
    );
    fs.writeFileSync(
        path.join(outDir, 'mapeamento-avaliacoes-ficticias.json'),
        JSON.stringify({ resumo: { total: avaliacoesMapeadas.length, distribuicao_notas: notasDistribuicao }, avaliacoes: avaliacoesMapeadas }, null, 2)
    );
    fs.writeFileSync(
        path.join(outDir, 'resumo-mapeamento-ficticios.json'),
        JSON.stringify(resumo, null, 2)
    );

    console.log(JSON.stringify(resumo, null, 2));
    console.log('\nArquivos gerados em backend/src/data/seed/');
}

main();
