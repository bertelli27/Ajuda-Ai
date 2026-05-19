require('dotenv').config(); // Carrega as variáveis do arquivo .env
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Importa a conexão com o banco
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const solicitationRoutes = require('./routes/solicitationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const providerReportRoutes = require('./routes/providerReportRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();

// Middlewares globais
app.use(cors()); // Permite que o front-end comunique com esta API
app.use(express.json({ limit: '10mb' })); // Aumentado para 10MB para suportar envio de Imagens no Chat

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/servicos', serviceRoutes);
app.use('/api/solicitacoes', solicitationRoutes);
app.use('/api/mensagens', messageRoutes);
app.use('/api/transacoes', transactionRoutes);
app.use('/api/avaliacoes', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/relatorios', providerReportRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Rota de teste (Health Check)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'API do AjudaAí está rodando perfeitamente!',
        timestamp: new Date()
    });
});

// Rota de fallback (Erro 404 para rotas inexistentes)
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado na API.' });
});

const PORT = process.env.PORT || 3000;

// Testa a conexão com o banco antes de subir o servidor
db.getConnection()
    .then(connection => {
        console.log('✅ Conexão com o banco de dados MySQL estabelecida com sucesso!');
        connection.release(); // Libera a conexão de teste para não travar o banco
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}/api/status`);
        });
    })
    .catch(err => {
        console.error('❌ Erro Fatal: Não foi possível conectar ao MySQL.', err.message);
        console.error('Verifique se o XAMPP/WAMP está ligado e se o banco "ajuda_ai_db" existe.');
    });
