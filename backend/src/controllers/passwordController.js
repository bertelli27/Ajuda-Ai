const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const solicitarRecuperacao = async (req, res) => {
    try {
        const { email, baseUrl } = req.body;
        if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

        // Verifica se o usuário existe
        const [usuarios] = await db.execute('SELECT id, nome FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Este e-mail não está cadastrado no sistema.' });
        }
        const usuario = usuarios[0];

        // Gera um token seguro de 64 caracteres
        const token = crypto.randomBytes(32).toString('hex');
        
        // Expira em 15 minutos
        const expiraEm = new Date(Date.now() + 15 * 60 * 1000); 

        // Salva no banco de dados MySQL
        await db.execute(
            'INSERT INTO recuperacao_senha (usuario_id, token, expira_em) VALUES (?, ?, ?)',
            [usuario.id, token, expiraEm]
        );

        // ================= CONFIGURAÇÃO DO E-MAIL REAL (GMAIL) =================
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true para a porta 465
            auth: { 
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS 
            },
        });

        const linkRecuperacao = `${baseUrl}?token=${token}`;

        try {
            await transporter.sendMail({
                from: `"Equipe AjudaAí" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Redefinição de Senha - AjudaAí",
                html: `<h3>Olá, ${usuario.nome}!</h3><p>Recebemos um pedido para redefinir a sua senha.</p><br><a href="${linkRecuperacao}" style="padding: 10px 20px; background: #00ADB5; color: white; text-decoration: none; border-radius: 5px;">Criar Nova Senha</a><br><br><p>Se você não pediu isso, ignore este e-mail. Este link expira em 15 minutos.</p>`
            });
            console.log("\n==============================================");
            console.log(`📧 E-MAIL REAL ENVIADO COM SUCESSO PARA: ${email}`);
            console.log("==============================================\n");
        } catch (emailError) {
            console.log("\n==============================================");
            console.log(`⚠️ ALERTA DO RENDER (PLANO GRATUITO)`);
            console.log(`O Render bloqueia envios de e-mail no plano gratuito.`);
            console.log(`Para testar a recuperação, copie o link abaixo e cole no navegador:`);
            console.log(`➡️  ${linkRecuperacao}`);
            console.log("==============================================\n");
        }

        res.status(200).json({ message: 'Processo concluído! Verifique seu e-mail (ou o console do Render).' });
    } catch (error) {
        console.error('Erro na recuperação:', error);
        res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
    }
};

const redefinirSenha = async (req, res) => {
    try {
        const { token, novaSenha } = req.body;
        if (!token || !novaSenha) return res.status(400).json({ error: 'Dados inválidos.' });

        const [tokens] = await db.execute('SELECT * FROM recuperacao_senha WHERE token = ? AND usado = FALSE AND expira_em > NOW()', [token]);
        if (tokens.length === 0) return res.status(400).json({ error: 'O link de recuperação é inválido ou expirou.' });

        const senhaHash = await bcrypt.hash(novaSenha, 10);
        await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, tokens[0].usuario_id]);
        await db.execute('UPDATE recuperacao_senha SET usado = TRUE WHERE id = ?', [tokens[0].id]);

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) { res.status(500).json({ error: 'Erro ao redefinir senha.' }); }
};

module.exports = { solicitarRecuperacao, redefinirSenha };