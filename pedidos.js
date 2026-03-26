document.addEventListener("DOMContentLoaded", function() {
    // ================= VALIDAÇÃO E CARREGAMENTO DE DADOS =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para ver seus pedidos!", "error");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500); // Aguarda um pouco para o usuário ler o toast
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);

    if (!usuarioAtual) {
        mostrarToast("Usuário não encontrado. Faça login novamente.", "error");
        logout();
        return;
    }

    // Containers para pedidos enviados e recebidos
    const recebidosSection = document.getElementById("recebidos-section");
    const recebidosContainer = document.getElementById("pedidos-recebidos-container");
    const enviadosSection = document.getElementById("enviados-section");
    const enviadosContainer = document.getElementById("pedidos-enviados-container");
    const tituloEnviados = document.getElementById("titulo-pedidos-enviados");
    const mainContainer = document.querySelector('.services-section');

    // Elementos dos filtros
    const filtroStatusRecebidos = document.getElementById("filtro-status-recebidos");
    const ordenarDataRecebidos = document.getElementById("ordenar-data-recebidos");
    const filtroStatusEnviados = document.getElementById("filtro-status-enviados");
    const ordenarDataEnviados = document.getElementById("ordenar-data-enviados");

    // Elementos do Modal de Chat
    const modal = document.getElementById("chatModal");
    const closeModalBtn = document.querySelector(".close-button");
    const chatSendBtn = document.getElementById("chat-send-btn");
    const chatInput = document.getElementById("chat-input");
    const chatMessagesContainer = document.getElementById("chat-messages");
    const chatHeader = document.getElementById("chat-header");
    let currentPedidoId = null; // Para saber qual chat está aberto

    // ================= LÓGICA DE EXIBIÇÃO (CLIENTE vs PRESTADOR) =================
    function carregarPedidos() {
        // Adiciona listeners de eventos aos controles de filtro e ordenação
        if (usuarioAtual.tipo === 'prestador') {
            filtroStatusRecebidos.addEventListener('change', atualizarExibicaoPedidos);
            ordenarDataRecebidos.addEventListener('change', atualizarExibicaoPedidos);
        }
        filtroStatusEnviados.addEventListener('change', atualizarExibicaoPedidos);
        ordenarDataEnviados.addEventListener('change', atualizarExibicaoPedidos);

        // Carga inicial dos pedidos
        atualizarExibicaoPedidos();
    }

    function atualizarExibicaoPedidos() {
        // Processa e renderiza as solicitações enviadas por todos os usuários
        let meusPedidosEnviados = solicitacoes.filter(s => s.clienteEmail === usuarioAtual.email);
        meusPedidosEnviados = aplicarFiltros(meusPedidosEnviados, filtroStatusEnviados.value, ordenarDataEnviados.value);
        renderPedidosCliente(meusPedidosEnviados, enviadosContainer);

        // Se o usuário for um prestador, processa e renderiza as solicitações recebidas
        if (usuarioAtual.tipo === 'prestador') {
            recebidosSection.style.display = "block";
            tituloEnviados.innerText = "Minhas Solicitações Enviadas";

            let pedidosRecebidos = solicitacoes.filter(s => s.prestadorEmail === usuarioAtual.email);
            pedidosRecebidos = aplicarFiltros(pedidosRecebidos, filtroStatusRecebidos.value, ordenarDataRecebidos.value);
            renderPedidosPrestador(pedidosRecebidos, recebidosContainer);
        }
    }

    function aplicarFiltros(listaPedidos, status, ordenacao) {
        let pedidosFiltrados = [...listaPedidos];

        // 1. Filtrar por status
        if (status !== 'todos') {
            pedidosFiltrados = pedidosFiltrados.filter(p => p.status === status);
        }

        // 2. Ordenar por data
        pedidosFiltrados.sort((a, b) => {
            // Usando dataSolicitacao para uma ordenação consistente
            const dataA = new Date(a.dataSolicitacao);
            const dataB = new Date(b.dataSolicitacao);
            if (ordenacao === 'recentes') {
                return dataB - dataA; // Mais recente primeiro
            } else {
                return dataA - dataB; // Mais antigo primeiro
            }
        });

        return pedidosFiltrados;
    }

    function renderPedidosCliente(pedidos, container) {
        if (pedidos.length === 0) {
            container.innerHTML = '<p class="aviso-sem-pedidos">Você ainda não fez nenhuma solicitação.</p>';
            return;
        }
        const mensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        container.innerHTML = pedidos.map(pedido => {
            const prestador = usuarios.find(u => u.email === pedido.prestadorEmail);
            const naoLidas = mensagens.filter(m => m.id_solicitacao === pedido.id && m.remetenteEmail !== emailLogado && !m.lida).length;
            const badgeHTML = naoLidas > 0 ? `<span class="notificacao-badge" style="top: -8px; right: -8px;">${naoLidas}</span>` : '';
            
            return `
                <div class="pedido-card">
                    <h3>${pedido.servico}</h3>
                    <p><strong>Prestador:</strong> ${prestador ? prestador.nome : 'Não encontrado'}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p><strong>Status:</strong> <span class="status status-${pedido.status.toLowerCase()}">${pedido.status}</span></p>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">Ver Conversa${badgeHTML}</button>
                        ${(pedido.status === 'CONCLUIDO' && !pedido.avaliado) ? `<button class="btn-acao btn-avaliar" data-pedido-id="${pedido.id}">Avaliar Serviço</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderPedidosPrestador(pedidos, container) {
        if (pedidos.length === 0) {
            container.innerHTML = '<p class="aviso-sem-pedidos">Você ainda não recebeu nenhuma solicitação.</p>';
            return;
        }
        const mensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        container.innerHTML = pedidos.map(pedido => {
            const cliente = usuarios.find(u => u.email === pedido.clienteEmail);
            const naoLidas = mensagens.filter(m => m.id_solicitacao === pedido.id && m.remetenteEmail !== emailLogado && !m.lida).length;
            const badgeHTML = naoLidas > 0 ? `<span class="notificacao-badge" style="top: -8px; right: -8px;">${naoLidas}</span>` : '';
            
            return `
                <div class="pedido-card">
                    <h3>Solicitação de ${cliente ? cliente.nome.split(' ')[0] : 'Cliente'}</h3>
                    <p><strong>Serviço:</strong> ${pedido.servico}</p>
                    <p><strong>Descrição:</strong> ${pedido.descricao}</p>
                    <p><strong>Endereço:</strong> ${pedido.enderecoRealizacao}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p><strong>Status:</strong> <span class="status status-${pedido.status.toLowerCase()}">${pedido.status}</span></p>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">Ver Conversa${badgeHTML}</button>
                        ${pedido.status === 'PENDENTE' ? `
                            <button class="btn-acao aceitar" data-pedido-id="${pedido.id}">Aceitar</button>
                            <button class="btn-acao recusar" data-pedido-id="${pedido.id}">Recusar</button>
                        ` : ''}
                        ${pedido.status === 'ACEITO' ? `
                            <button class="btn-acao concluir" data-pedido-id="${pedido.id}">Marcar como Concluído</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ================= LÓGICA DAS AÇÕES =================
    mainContainer.addEventListener('click', function(e) {
        const target = e.target;
        const pedidoId = target.getAttribute('data-pedido-id');
        if (!pedidoId) return;

        let novoStatus = '';
        if (target.classList.contains('aceitar')) novoStatus = 'ACEITO';
        else if (target.classList.contains('recusar')) novoStatus = 'CANCELADO';
        else if (target.classList.contains('concluir')) novoStatus = 'CONCLUIDO';
        
        if (novoStatus) {
            const index = solicitacoes.findIndex(s => s.id === pedidoId);
            if (index !== -1) {
                solicitacoes[index].status = novoStatus;
                localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
                atualizarExibicaoPedidos(); // Recarrega a lista para refletir a mudança
                if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
            }
        } else if (target.classList.contains('btn-avaliar')) {
            window.location.href = `avaliar.html?pedido=${pedidoId}`;
        } else if (target.classList.contains('btn-chat')) {
            abrirChat(pedidoId);
        }
    });

    // ================= LÓGICA DO CHAT =================

    function abrirChat(pedidoId) {
        currentPedidoId = pedidoId;
        const pedido = solicitacoes.find(s => s.id === pedidoId);
        if (!pedido) return;

        const outraPessoaEmail = usuarioAtual.tipo === 'cliente' ? pedido.prestadorEmail : pedido.clienteEmail;
        const outraPessoa = usuarios.find(u => u.email === outraPessoaEmail);
        
        chatHeader.innerText = `Conversa sobre "${pedido.servico}"`;
        
        // Marcar mensagens recebidas neste chat como lidas
        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        let atualizou = false;
        todasMensagens.forEach(m => {
            if (m.id_solicitacao === pedidoId && m.remetenteEmail !== emailLogado && m.lida !== true) {
                m.lida = true;
                atualizou = true;
            }
        });
        if (atualizou) {
            localStorage.setItem("mensagens", JSON.stringify(todasMensagens));
            if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
            atualizarExibicaoPedidos(); // Recarrega os botões para a bolinha sumir
        }

        renderMensagens(pedidoId);
        modal.style.display = "block";
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    function fecharChat() {
        modal.style.display = "none";
        currentPedidoId = null;
        chatMessagesContainer.innerHTML = "";
    }

    function renderMensagens(pedidoId) {
        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        const mensagensDoPedido = todasMensagens.filter(m => m.id_solicitacao === pedidoId);

        chatMessagesContainer.innerHTML = mensagensDoPedido.map(msg => {
            const classe = msg.remetenteEmail === emailLogado ? 'sent' : 'received';
            return `<div class="message ${classe}">${msg.mensagem}</div>`;
        }).join('');
    }

    function enviarMensagem() {
        const texto = chatInput.value.trim();
        if (!texto || !currentPedidoId) return;

        const novaMensagem = {
            id_mensagem: "MSG-" + Date.now(),
            id_solicitacao: currentPedidoId,
            remetenteEmail: emailLogado,
            mensagem: texto,
            data_envio: new Date().toISOString(),
            lida: false
        };

        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        todasMensagens.push(novaMensagem);
        localStorage.setItem("mensagens", JSON.stringify(todasMensagens));

        chatInput.value = "";
        renderMensagens(currentPedidoId);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // Event Listeners para o Chat
    closeModalBtn.addEventListener('click', fecharChat);
    chatSendBtn.addEventListener('click', enviarMensagem);
    chatInput.addEventListener('keypress', e => e.key === 'Enter' && enviarMensagem());
    window.addEventListener('click', e => e.target == modal && fecharChat());

    // ================= LOGOUT =================
    function logout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    }
    document.getElementById("btnLogout")?.addEventListener("click", logout);

    // Inicia a renderização
    carregarPedidos();
});