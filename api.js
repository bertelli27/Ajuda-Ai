/**
 * AJUDA AÍ - CAMADA DE DADOS E API (MOCK)
 * Este arquivo centraliza todas as chamadas de dados do sistema.
 * Atualmente ele interage com o LocalStorage (Simulando o Banco de Dados).
 * 
 * 🚀 PREPARAÇÃO PARA O BACK-END:
 * Quando a API da equipe estiver pronta, basta substituir o conteúdo destas 
 * funções por chamadas reais (ex: fetch('http://localhost:3000/api/usuarios')).
 * NENHUM arquivo visual (dashboard.js, pedidos.js, etc) precisará ser alterado!
 */

const API = {
    // ================= USUÁRIOS =================
    async getUsuarios() {
        // Futuro: const res = await fetch('/api/usuarios'); return await res.json();
        return JSON.parse(localStorage.getItem("usuarios")) || [];
    },
    async salvarUsuarios(usuarios) {
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    },

    // ================= SOLICITAÇÕES / PEDIDOS =================
    async getSolicitacoes() {
        return JSON.parse(localStorage.getItem("solicitacoes")) || [];
    },
    async salvarSolicitacoes(solicitacoes) {
        localStorage.setItem("solicitacoes", JSON.stringify(solicitacoes));
    },

    // ================= TRANSAÇÕES / FINANCEIRO =================
    async getTransacoes() {
        return JSON.parse(localStorage.getItem("transacoes")) || [];
    },
    async salvarTransacoes(transacoes) {
        localStorage.setItem("transacoes", JSON.stringify(transacoes));
    },

    // ================= MENSAGENS / CHAT =================
    async getMensagens() {
        return JSON.parse(localStorage.getItem("mensagens")) || [];
    },
    async salvarMensagens(mensagens) {
        localStorage.setItem("mensagens", JSON.stringify(mensagens));
    },

    // ================= AVALIAÇÕES =================
    async getAvaliacoes() {
        return JSON.parse(localStorage.getItem("avaliacoes")) || [];
    },
    async salvarAvaliacoes(avaliacoes) {
        localStorage.setItem("avaliacoes", JSON.stringify(avaliacoes));
    },

    // ================= SESSÃO E AUTENTICAÇÃO =================
    getSessaoAtual() {
        // Síncrono, pois apenas verifica o token/email salvo localmente
        return localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    },
    fazerLogout() {
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
    }
};