require('dotenv').config(); // Carrega as variáveis do arquivo .env
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globais
app.use(cors()); // Permite que o front-end comunique com esta API
app.use(express.json({ limit: '10mb' })); // Aumentado para 10MB para suportar envio de Imagens no Chat

// Rota de teste (Health Check)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'API do AjudaAí está rodando perfeitamente!',
        timestamp: new Date()
    });
});

// Rotas do Sistema
const messageRoutes = require('./backend/src/routes/messageRoutes');
app.use('/api/mensagens', messageRoutes);

// Rotas Administrativas (Protegidas)
const adminRoutes = require('./backend/src/routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Rotas de Relatórios do Prestador (BI)
const providerReportRoutes = require('./backend/src/routes/providerReportRoutes');
app.use('/api/relatorios', providerReportRoutes);

// Rota de fallback (Erro 404 para rotas inexistentes)
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado na API.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/api/status`);
});