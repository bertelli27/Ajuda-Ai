/**
 * AJUDA AÍ - CAMADA DE INTEGRAÇÃO (API CLIENT)
 * Este arquivo atua como o coração da comunicação entre o Front-end e o Back-end (Node.js).
 * Ele centraliza todas as requisições HTTP (Fetch API), gerencia a injeção de Tokens JWT nas rotas protegidas
 * e atua como uma camada DTO (Data Transfer Object), normalizando os dados do banco de dados para a tela.
 */

// const BASE_URL = 'http://localhost:3000/api'; // Ambiente Local
const BASE_URL = 'https://ajuda-ai-gz4a.onrender.com/api'; // Ambiente de Produção

const API = {
    // ================= AUTENTICAÇÃO REAL (NODE.JS) =================
    async login(email, senha) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao fazer login');
        return data; // Retorna { message, token, usuario }
    },

    async cadastrar(usuarioData) {
        const response = await fetch(`${BASE_URL}/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao cadastrar');
        return data;
    },

    async verificarCpf(cpf) {
        const response = await fetch(`${BASE_URL}/auth/verificar-cpf/${cpf.replace(/\D/g, '')}`);
        const data = await response.json();
        return data.existe;
    },
    async verificarEmail(email) {
        const response = await fetch(`${BASE_URL}/auth/verificar-email/${encodeURIComponent(email)}`);
        const data = await response.json();
        return data.existe;
    },

    // ================= USUÁRIOS =================
    async getUsuarios() {
        try {
            // 🚀 CACHE BUSTER: Impede que o navegador guarde dados antigos de perfil!
            const response = await fetch(`${BASE_URL}/auth/usuarios?t=${new Date().getTime()}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
            return [];
        }
    },
    async atualizarPerfilApi(dadosPerfil) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/auth/perfil`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(dadosPerfil)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao atualizar perfil');
        
        // 🚀 ATUALIZA O TOKEN SILENCIOSAMENTE PARA AS PERMISSÕES ENTRAREM EM VIGOR NA HORA
        if (data.token) {
            if (localStorage.getItem("token")) localStorage.setItem("token", data.token);
            else if (sessionStorage.getItem("token")) sessionStorage.setItem("token", data.token);
        }
        
        return data;
    },

    // ================= SOLICITAÇÕES / PEDIDOS =================
    async getSolicitacoes() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return [];
        try {
            // 🚀 CACHE BUSTER: Força a buscar as atualizações em tempo real (ex: mensagens não lidas)
            const response = await fetch(`${BASE_URL}/solicitacoes?t=${new Date().getTime()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            const data = await response.json();
            
            // TRADUTOR (DTO): Normaliza os dados do MySQL (snake_case) para a Tela (camelCase)
            return data.map(pedido => ({
                ...pedido,
                dataSolicitacao: pedido.criado_em,
                valorStatus: pedido.valor_status,
                statusPagamento: pedido.status_pagamento,
                valorCombinado: pedido.valor_combinado,
                descricaoProposta: pedido.descricao_proposta,
                dataProposta: pedido.data_proposta,
                horaProposta: pedido.hora_proposta,
                mensagensNaoLidas: pedido.mensagens_nao_lidas
            }));
        } catch (error) {
            console.error("Erro ao buscar solicitações:", error);
            return [];
        }
    },
    async criarSolicitacao(solicitacaoData) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/solicitacoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(solicitacaoData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao criar solicitação');
        return data;
    },
    async atualizarSolicitacao(id, dadosAtualizados) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");

        // TRADUTOR (DTO reverso): Converte de camelCase (front) para snake_case (back)
        const dadosParaAPI = {
            status: dadosAtualizados.status,
            valor_status: dadosAtualizados.valorStatus,
            valor_combinado: dadosAtualizados.valorCombinado,
            descricao_proposta: dadosAtualizados.descricaoProposta,
            data_proposta: dadosAtualizados.dataProposta,
            hora_proposta: dadosAtualizados.horaProposta,
            status_pagamento: dadosAtualizados.statusPagamento
        };

        // Remove chaves undefined para não enviar dados nulos para o back-end
        Object.keys(dadosParaAPI).forEach(key => dadosParaAPI[key] === undefined && delete dadosParaAPI[key]);

        const response = await fetch(`${BASE_URL}/solicitacoes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosParaAPI) // Envia o objeto traduzido
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao atualizar solicitação');
        return data;
    },

    // ================= ASSISTENTE INTELIGENTE =================
    async analisarProblema(descricao) {
        const response = await fetch(`${BASE_URL}/assistente/analisar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao analisar o problema');
        return data;
    },

    // ================= SERVIÇOS =================
    async getServicos() {
        try {
            // Busca a lista real do Banco de Dados! (Com bloqueador de cache do navegador)
            const response = await fetch(`${BASE_URL}/servicos?t=${new Date().getTime()}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (erro) {
            console.error("Erro ao buscar serviços:", erro);
            return [];
        }
    },
    async getServicoById(id) {
        try {
            const response = await fetch(`${BASE_URL}/servicos/${id}`);
            if (!response.ok) throw new Error('Serviço não encontrado na API.');
            return await response.json();
        } catch (erro) {
            console.error(`Erro ao buscar serviço ${id}:`, erro);
            throw erro; // Re-throw the error to be caught by the caller
        }
    },
    async criarServico(servicoData) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/servicos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // O Segurança (Middleware) exige isso!
            },
            body: JSON.stringify(servicoData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao criar serviço');
        return data;
    },
    async editarServico(id, servicoData) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/servicos/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(servicoData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao editar serviço');
        return data;
    },
    async excluirServico(id) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/servicos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao excluir serviço');
        return data;
    },
    
    // ================= PORTFÓLIO =================
    async adicionarPortfolio(dadosPortfolio) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/portfolio`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosPortfolio)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao adicionar ao portfólio');
        return data;
    },
    async excluirPortfolio(id) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/portfolio/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao excluir do portfólio');
        return data;
    },

    // ================= RELATÓRIOS (BI) =================
    async getRelatoriosPrestador(periodo = 'todos') {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) throw new Error("Não autorizado");
        const response = await fetch(`${BASE_URL}/relatorios?periodo=${periodo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao buscar relatórios');
        return data;
    },

    // ================= TRANSAÇÕES / FINANCEIRO =================
    async getTransacoes() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return [];
        try {
            const response = await fetch(`${BASE_URL}/transacoes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            const data = await response.json();
            // TRADUTOR (DTO): Converte snake_case do back para camelCase do front
            return data.map(tx => ({
                ...tx,
                servicoId: tx.solicitacao_id,
                valorServico: tx.valor_total,
                taxaPlataforma: tx.taxa_plataforma,
                valorPrestador: tx.valor_prestador,
                data: tx.criado_em,
            }));
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
            return [];
        }
    },

    // ================= MENSAGENS / CHAT =================
    async getMensagensPorPedido(solicitacaoId) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        try {
            const response = await fetch(`${BASE_URL}/mensagens/${solicitacaoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
            return [];
        }
    },
    async enviarMensagemApi(solicitacaoId, mensagem, imagemBase64) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/mensagens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ solicitacaoId, mensagem, imagemBase64 })
        });
        if (!response.ok) {
            let errMsg = 'Erro ao conectar com o servidor.';
            try {
                const errData = await response.json();
                if (errData.error) errMsg = errData.error;
            } catch(e) {}
            throw new Error(errMsg);
        }
        return await response.json();
    },
    async marcarMensagensComoLidas(solicitacaoId) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/mensagens/${solicitacaoId}/lidas`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao marcar mensagens como lidas');
        return await response.json();
    },
    async enviarMensagemSistemaApi(solicitacaoId, mensagem) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/mensagens/sistema`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ solicitacaoId, mensagem })
        });
        if (!response.ok) throw new Error('Erro ao enviar mensagem de sistema');
        return await response.json();
    },

    // ================= AVALIAÇÕES =================
    async getAvaliacoes() {
        try {
            const response = await fetch(`${BASE_URL}/avaliacoes`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar avaliações:", error);
            return [];
        }
    },
    async criarAvaliacao(dadosAvaliacao) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/avaliacoes`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosAvaliacao)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao salvar avaliação');
        return data;
    },

    // ================= RECUPERAÇÃO DE SENHA =================
    async solicitarRecuperacaoSenha(email, baseUrl) {
        const response = await fetch(`${BASE_URL}/auth/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, baseUrl })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao processar solicitação');
        return data;
    },
    async redefinirSenhaApi(token, novaSenha) {
        const response = await fetch(`${BASE_URL}/auth/redefinir-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, novaSenha })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao redefinir senha');
        return data;
    },

    // ================= NOTIFICAÇÕES =================
    async getNotificacoes() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return 0;
        try {
            // 🚀 CACHE BUSTER: Impede o navegador de congelar o número antigo e força o tempo real!
            const response = await fetch(`${BASE_URL}/auth/notificacoes?t=${new Date().getTime()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return 0;
            const data = await response.json();
            return data.count;
        } catch (err) { return 0; }
    },

    // ================= CONFIGURAÇÕES =================
    async desativarContaApi() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/auth/conta`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao desativar conta');
        return data;
    },

    // ================= ADMINISTRAÇÃO (BACKOFFICE) =================
    async getTodosUsuariosAdmin() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) throw new Error("Não autorizado");
        const response = await fetch(`${BASE_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao buscar usuários');
        return data;
    },

    async getLogsAdmin() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) throw new Error("Não autorizado");
        const response = await fetch(`${BASE_URL}/admin/logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao buscar logs');
        return data;
    },

    async banirUsuarioAdmin(id, motivo) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) throw new Error("Não autorizado");
        const response = await fetch(`${BASE_URL}/admin/usuarios/${id}/banir`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ motivo })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao banir usuário');
        return data;
    },

    async excluirAvaliacaoAdmin(id, motivo) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) throw new Error("Não autorizado");
        const response = await fetch(`${BASE_URL}/admin/avaliacoes/${id}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ motivo })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao excluir avaliação');
        return data;
    },

    // ================= SESSÃO E AUTENTICAÇÃO =================
    getSessaoAtual() {
        // Síncrono, pois apenas verifica o token/email salvo localmente
        return localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    },
    fazerLogout() {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
    }
};