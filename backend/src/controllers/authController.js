const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const registrarLog = require('../utils/logger');

const register = async (req, res) => {
    try {
        const { nome, email, senha, telefone, tipo, descricao_perfil, categoria, titulo_servico, preco_base, cpf, cep, rua, numero, complemento, bairro, cidade, estado } = req.body;

        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }
        if (tipo !== 'cliente' && tipo !== 'prestador') {
            return res.status(400).json({ error: 'Tipo de usuário inválido.' });
        }

        const [existingUsers] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [userResult] = await connection.execute(
                'INSERT INTO usuarios (nome, cpf, email, senha_hash, telefone, cep, rua, numero, complemento, bairro, cidade, estado, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nome, cpf || null, email, senhaHash, telefone || null, cep || null, rua || null, numero || null, complemento || null, bairro || null, cidade || null, estado || null, tipo]
            );
            const usuarioId = userResult.insertId;

            if (tipo === 'prestador') {
                const [prestResult] = await connection.execute(
                    'INSERT INTO prestadores (usuario_id, descricao_perfil) VALUES (?, ?)', 
                    [usuarioId, descricao_perfil || null]
                );
                const prestadorId = prestResult.insertId;

                // Se o formulário enviou os dados do serviço inicial, já cadastra na vitrine
                if (titulo_servico && categoria) {
                    const [categorias] = await connection.execute('SELECT id FROM categorias WHERE nome = ?', [categoria]);
                    let categoriaId = 1; // Fallback para 1 (Limpeza) se der erro
                    if (categorias.length > 0) categoriaId = categorias[0].id;

                    await connection.execute(
                        'INSERT INTO servicos (prestador_id, categoria_id, titulo, descricao, preco_base) VALUES (?, ?, ?, ?, ?)',
                        [prestadorId, categoriaId, titulo_servico, descricao_perfil || '', preco_base || null]
                    );
                }
            }

            await connection.commit();
            connection.release();

            // 🚀 Registra a ação no banco
            await registrarLog(usuarioId, 'CADASTRO', `Nova conta de ${tipo} criada.`, req.ip);

            res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id: usuarioId });
        } catch (transactionError) {
            await connection.rollback();
            connection.release();
            throw transactionError;
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao tentar cadastrar o usuário.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }

        const [users] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const user = users[0];

        // Trava: Impede login de contas excluídas logicamente
        if (user.ativo === 0) {
            return res.status(403).json({ error: 'Sua conta foi desativada. Entre em contato com o suporte.' });
        }

        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, tipo: user.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { senha_hash, ...usuarioSemSenha } = user;

        // 🚀 Registra o login no banco
        await registrarLog(user.id, 'LOGIN', 'Acesso ao sistema com sucesso.', req.ip);

        res.status(200).json({ message: 'Login realizado com sucesso!', token, usuario: usuarioSemSenha });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao tentar fazer login.' });
    }
};

const atualizarPerfil = async (req, res) => {
    let connection;
    try {
        const isSelf = (!req.body.id || Number(req.body.id) === Number(req.user.id));
        const isAdmin = req.user.tipo === 'admin';
        
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: 'Acesso negado. Você não pode modificar outro usuário.' });
        }

        const targetUsuarioId = isSelf ? req.user.id : Number(req.body.id);
        const { nome, telefone, fotoPerfil, endereco, tipo, prestador } = req.body;
        
        if (tipo && tipo !== 'cliente' && tipo !== 'prestador' && tipo !== 'admin') {
            return res.status(400).json({ error: 'Tipo de usuário inválido.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 📸 FOTOGRAFIA DO "ANTES" (Para gerar o log inteligente de auditoria)
        const [oldUserRows] = await connection.execute('SELECT nome, telefone, foto_perfil, cep, tipo FROM usuarios WHERE id = ?', [targetUsuarioId]);
        const oldUser = oldUserRows[0];

        // 🛡️ BLINDAGEM ABSOLUTA DE CARGO (GARANTIA DE SEGURANÇA)
        // 1. O Admin JAMAIS perderá seu cargo, mesmo que o front-end envie um tipo diferente por engano.
        // 2. Clientes e Prestadores NUNCA poderão se promover a Admin (Fecha a nossa brecha anterior).
        let tipoFinal = oldUser.tipo;
        if (oldUser.tipo === 'admin') {
            tipoFinal = 'admin'; // Fica blindado como admin
        } else if (tipo === 'cliente' || tipo === 'prestador') {
            tipoFinal = tipo; // Permite alternar apenas entre cliente e prestador
        }

        let mudancas = [];
        if (oldUser.nome !== nome) mudancas.push("Alterou o nome");
        if ((oldUser.telefone || '') !== (telefone || '')) mudancas.push("Alterou o telefone");
        if ((oldUser.cep || '') !== (endereco?.cep || '')) mudancas.push("Atualizou o endereço");
        if ((oldUser.foto_perfil || '') !== (fotoPerfil || '')) mudancas.push("Atualizou a foto de perfil");
        if (oldUser.tipo !== tipoFinal) mudancas.push(`Mudou a finalidade da conta para ${tipoFinal}`);
        
        let detalhesLog = mudancas.length > 0 ? `Atualizações feitas: ${mudancas.join(', ')}.` : `Perfil salvo sem alterações nos dados principais.`;

        // 1. Atualiza dados na tabela usuarios
        await connection.execute(
            'UPDATE usuarios SET nome = ?, telefone = ?, foto_perfil = ?, cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, tipo = ? WHERE id = ?',
            [nome, telefone || null, fotoPerfil || null, endereco?.cep || null, endereco?.rua || null, endereco?.numero || null, endereco?.complemento || null, endereco?.bairro || null, endereco?.cidade || null, endereco?.estado || null, tipoFinal, targetUsuarioId]
        );

        // 2. Se for prestador, atualiza tabela prestadores e portfólio
        if (tipoFinal === 'prestador') {
            const [prestRows] = await connection.execute('SELECT id FROM prestadores WHERE usuario_id = ?', [targetUsuarioId]);
            let prestadorId;
            
            if (prestRows.length === 0) {
                const [insertPrest] = await connection.execute('INSERT INTO prestadores (usuario_id, descricao_perfil) VALUES (?, ?)', [targetUsuarioId, prestador?.descricao || null]);
                prestadorId = insertPrest.insertId;
            } else {
                prestadorId = prestRows[0].id;
            }

            if (prestador && prestador.descricao !== undefined) {
                await connection.execute('UPDATE prestadores SET descricao_perfil = ? WHERE id = ?', [prestador.descricao, prestadorId]);
            }
            // 🚀 NOTA: O portfólio não é mais destruído e recriado junto com a foto de perfil. Ele agora é independente!
        }

        await connection.commit();
        
        // 🚀 GERA UM NOVO TOKEN: Atualiza as permissões caso o cliente tenha virado prestador
        let novoToken;
        if (isSelf) {
            novoToken = jwt.sign(
                { id: targetUsuarioId, email: req.user.email, tipo: tipoFinal },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
        }

        // 🚀 Registra a atualização no banco
        await registrarLog(req.user.id, isSelf ? 'ATUALIZAR_PERFIL' : 'MODERACAO_ADMIN', isSelf ? detalhesLog : `Moderação no perfil #${targetUsuarioId}: ${detalhesLog}`, req.ip);

        res.status(200).json({ message: 'Perfil atualizado com sucesso!', token: novoToken });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    } finally {
        if (connection) connection.release();
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.execute(`
            SELECT u.*, p.id AS prestador_id, p.descricao_perfil,
            (SELECT COALESCE(AVG(nota), 0) FROM avaliacoes WHERE prestador_id = p.id) AS media_global,
            (SELECT COUNT(id) FROM avaliacoes WHERE prestador_id = p.id) AS total_avaliacoes
            FROM usuarios u 
            LEFT JOIN prestadores p ON u.id = p.usuario_id
            WHERE u.ativo = TRUE
        `);
        const [portfolio] = await db.execute('SELECT id, prestador_id, servico_id, solicitacao_id, avaliacao_id, imagem_url, descricao, tipo_portfolio, verificado, criado_em FROM portfolio');
        
        // Tradutor: Transforma o MySQL em um objeto que o Front-end entende sem quebrar a tela
        const formatados = usuarios.map(u => {
            const imgs = portfolio.filter(img => img.prestador_id === u.prestador_id); // Devolve o objeto inteiro e não só a string
            return {
                id: u.id, nome: u.nome, cpf: u.cpf, email: u.email, telefone: u.telefone, fotoPerfil: u.foto_perfil, tipo: u.tipo,
                endereco: { cep: u.cep, rua: u.rua, numero: u.numero, complemento: u.complemento, bairro: u.bairro, cidade: u.cidade, estado: u.estado },
                prestador: u.tipo === 'prestador' ? { 
                    descricao: u.descricao_perfil, 
                    portfolio: imgs,
                    mediaGlobal: parseFloat(u.media_global || 0),
                    totalAvaliacoes: parseInt(u.total_avaliacoes || 0)
                } : null
            };
        });
        res.status(200).json(formatados);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar usuários.' }); }
};

const getNotificacoes = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const tipo = req.user.tipo;
        let numNotificacoes = 0;

        // 1. Conta pedidos pendentes (apenas para quem é prestador)
        if (tipo === 'prestador') {
            const [pendentes] = await db.execute(`
                SELECT COUNT(s.id) AS total 
                FROM solicitacoes s 
                JOIN servicos srv ON s.servico_id = srv.id 
                JOIN prestadores p ON srv.prestador_id = p.id 
                WHERE p.usuario_id = ? AND s.status = 'PENDENTE'
            `, [usuarioId]);
            numNotificacoes += pendentes[0].total;
        }

        // 2. Conta as mensagens que você recebeu e ainda não leu
        const [mensagens] = await db.execute(`
            SELECT COUNT(m.id) AS total
            FROM mensagens m
            JOIN solicitacoes s ON m.solicitacao_id = s.id
            JOIN servicos srv ON s.servico_id = srv.id
            JOIN prestadores p ON srv.prestador_id = p.id
            WHERE (s.cliente_id = ? OR p.usuario_id = ?) 
              AND (m.remetente_id != ? OR m.remetente_id IS NULL) 
              AND m.lida = FALSE
        `, [usuarioId, usuarioId, usuarioId]);
        
        numNotificacoes += mensagens[0].total;

        res.status(200).json({ count: numNotificacoes });
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar notificações.' }); }
};

const desativarConta = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        await db.execute('UPDATE usuarios SET ativo = FALSE WHERE id = ?', [usuarioId]);
        await registrarLog(usuarioId, 'EXCLUSAO_LOGICA', 'Usuário excluiu a própria conta pelo painel.', req.ip);
        
        res.status(200).json({ message: 'Conta desativada com sucesso.' });
    } catch (error) {
        console.error('Erro ao desativar conta:', error);
        res.status(500).json({ error: 'Erro ao desativar conta.' });
    }
};

module.exports = { register, login, atualizarPerfil, listarUsuarios, getNotificacoes, desativarConta };
