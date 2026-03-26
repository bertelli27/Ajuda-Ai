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
            const valorFormatado = pedido.valorCombinado ? `R$ ${parseFloat(pedido.valorCombinado).toFixed(2).replace('.', ',')}` : 'A combinar';
            const formatStatus = pedido.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguardando Confirmação' : pedido.status;
            
            return `
                <div class="pedido-card">
                    <h3>${pedido.servico}</h3>
                    <p><strong>Prestador:</strong> ${prestador ? prestador.nome : 'Não encontrado'}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p><strong>Valor:</strong> ${valorFormatado}</p>
                    <p><strong>Status:</strong> <span class="status status-${pedido.status.toLowerCase()}">${formatStatus}</span></p>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">Ver Conversa${badgeHTML}</button>
                        ${pedido.status === 'AGUARDANDO_CONFIRMACAO' ? `<button class="btn-acao confirmar-conclusao" data-pedido-id="${pedido.id}">Confirmar Conclusão</button>` : ''}
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
            const valorFormatado = pedido.valorCombinado ? `R$ ${parseFloat(pedido.valorCombinado).toFixed(2).replace('.', ',')}` : 'A combinar';
            const formatStatus = pedido.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguardando Cliente' : pedido.status;
            
            return `
                <div class="pedido-card">
                    <h3>Solicitação de ${cliente ? cliente.nome.split(' ')[0] : 'Cliente'}</h3>
                    <p><strong>Serviço:</strong> ${pedido.servico}</p>
                    <p><strong>Descrição:</strong> ${pedido.descricao}</p>
                    <p><strong>Endereço:</strong> ${pedido.enderecoRealizacao}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p><strong>Valor:</strong> ${valorFormatado}</p>
                    <p><strong>Status:</strong> <span class="status status-${pedido.status.toLowerCase()}">${formatStatus}</span></p>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">Ver Conversa${badgeHTML}</button>
                        ${pedido.status === 'PENDENTE' ? `
                            <button class="btn-acao aceitar" data-pedido-id="${pedido.id}">Aceitar</button>
                            <button class="btn-acao recusar" data-pedido-id="${pedido.id}">Recusar</button>
                        ` : ''}
                        ${pedido.status === 'ACEITO' ? `
                            <button class="btn-acao concluir" data-pedido-id="${pedido.id}">Finalizar Serviço</button>
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
        else if (target.classList.contains('concluir')) novoStatus = 'AGUARDANDO_CONFIRMACAO';
        else if (target.classList.contains('confirmar-conclusao')) novoStatus = 'CONCLUIDO';
        
        if (novoStatus) {
            const index = solicitacoes.findIndex(s => s.id === pedidoId);
            if (index !== -1) {
                solicitacoes[index].status = novoStatus;
                localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));

                if (novoStatus === 'AGUARDANDO_CONFIRMACAO') {
                    enviarMensagemSistema(pedidoId, "🛠️ <strong>Serviço finalizado pelo prestador.</strong> Aguardando o cliente confirmar a conclusão.");
                } else if (novoStatus === 'CONCLUIDO') {
                    enviarMensagemSistema(pedidoId, "✅ <strong>Conclusão confirmada pelo cliente.</strong> O serviço foi encerrado com sucesso.");
                }

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
        
        atualizarAreaNegociacao();

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

    function atualizarAreaNegociacao() {
        const area = document.getElementById("negociacao-area");
        if (!area || !currentPedidoId) return;

        const pedido = solicitacoes.find(s => s.id === currentPedidoId);
        if (!pedido) return;
        
        let html = '';
        
        // Verifica se o usuário logado é o prestador DESTE pedido específico
        const isPrestador = pedido.prestadorEmail === usuarioAtual.email;
        const valorFormatado = pedido.valorCombinado ? `R$ ${parseFloat(pedido.valorCombinado).toFixed(2).replace('.', ',')}` : 'Não definido';
        const descricaoProposta = pedido.descricaoProposta || '';
        
        // Formatação de Data e Hora para exibição
        let dataHoraFormatada = '';
        if (pedido.dataProposta) {
             const dataParts = pedido.dataProposta.split('-');
             const dataBr = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
             dataHoraFormatada = `<strong>Data/Hora Proposta:</strong> ${dataBr} às ${pedido.horaProposta || 'Não informado'}`;
        }

        if (isPrestador) {
            if (pedido.valorStatus === 'ACEITO') {
                html = `
                    <div><strong>Valor Combinado:</strong> <span style="color: #5cb85c;">${valorFormatado} (Aceito pelo Cliente)</span></div>
                    ${dataHoraFormatada ? `<div>${dataHoraFormatada}</div>` : ''}
                    <div class="negociacao-descricao-proposta aceito"><strong>Escopo do Serviço:</strong><br>${descricaoProposta}</div>
                `;
            } else {
                html = `
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <strong style="white-space: nowrap;">Orçamento (R$):</strong>
                            <input type="number" id="inputValorNegociado" value="${pedido.valorCombinado || ''}" placeholder="Ex: 150.00" style="padding: 8px; border-radius: 8px; border: 1px solid #00ADB5; background: #393E46; color: #EEE; outline: none; width: 120px;">
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <strong style="white-space: nowrap;">Data:</strong>
                            <input type="date" id="inputDataProposta" value="${pedido.dataProposta || ''}" style="padding: 8px; border-radius: 8px; border: 1px solid #00ADB5; background: #393E46; color: #EEE; outline: none;">
                            <strong style="white-space: nowrap;">Hora:</strong>
                            <input type="time" id="inputHoraProposta" value="${pedido.horaProposta || ''}" style="padding: 8px; border-radius: 8px; border: 1px solid #00ADB5; background: #393E46; color: #EEE; outline: none;">
                        </div>
                        <textarea id="textareaDescricaoProposta" placeholder="Descreva o que está incluso no valor (ex: material, mão de obra...).">${descricaoProposta}</textarea>
                        <button id="btnEnviarProposta" class="btn-login" style="padding: 8px 15px; width: 100%;">Enviar Proposta</button>
                        ${pedido.valorStatus === 'PROPOSTO' ? '<span style="color: #f0ad4e; font-size: 13px; width: 100%;">Aguardando aprovação do cliente...</span>' : ''}
                    </div>
                `;
            }
        } else {
            // Cliente
            if (pedido.valorStatus === 'ACEITO') {
                html = `
                    <div><strong>Valor Combinado:</strong> <span style="color: #5cb85c;">${valorFormatado} (Aceito)</span></div>
                    ${dataHoraFormatada ? `<div>${dataHoraFormatada}</div>` : ''}
                    <div class="negociacao-descricao-proposta aceito"><strong>Escopo do Serviço:</strong><br>${descricaoProposta}</div>
                `;
            } else if (pedido.valorStatus === 'PROPOSTO') {
                html = `
                    <div style="width: 100%;">
                        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 10px;">
                            <div><strong>Proposta do Prestador:</strong> <span style="color: #f0ad4e; font-size: 18px; font-weight: bold;">${valorFormatado}</span></div>
                            ${dataHoraFormatada ? `<div style="font-size: 14px;">${dataHoraFormatada}</div>` : ''}
                            <div>
                                <button id="btnAceitarProposta" class="btn-login" style="background: #5cb85c; padding: 8px 15px; width: auto; margin: 0;">Aceitar Proposta</button>
                            </div>
                        </div>
                        <div class="negociacao-descricao-proposta"><strong>Escopo do Serviço Proposto:</strong><br>${descricaoProposta}</div>
                    </div>
                `;
            } else {
                html = `<div><strong>Valor:</strong> <span style="color: #AAAAAA;">Aguardando orçamento do prestador...</span></div>`;
            }
        }
        
        area.innerHTML = html;

        // Adicionar eventos aos botões recém renderizados
        if (isPrestador && pedido.valorStatus !== 'ACEITO') {
            document.getElementById("btnEnviarProposta")?.addEventListener("click", () => {
                const novoValor = document.getElementById("inputValorNegociado").value;
                const novaDescricao = document.getElementById("textareaDescricaoProposta").value.trim();
                const novaData = document.getElementById("inputDataProposta").value;
                const novaHora = document.getElementById("inputHoraProposta").value;

                if (!novoValor || parseFloat(novoValor) <= 0) {
                    mostrarToast("Digite um valor válido.", "error");
                    return;
                }
                if (!novaDescricao) {
                    mostrarToast("Por favor, descreva o serviço que será feito.", "error");
                    return;
                }
                if (!novaData || !novaHora) {
                     mostrarToast("Por favor, informe a data e o horário propostos.", "error");
                     return;
                }
                
                pedido.valorCombinado = novoValor;
                pedido.descricaoProposta = novaDescricao;
                pedido.dataProposta = novaData;
                pedido.horaProposta = novaHora;
                pedido.valorStatus = 'PROPOSTO';
                salvarEAtualizarPedido(pedido);
                
                const dataParts = novaData.split('-');
                const dataBr = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
                
                enviarMensagemSistema(pedido.id, `🕒 <strong>Orçamento enviado:</strong> R$ ${parseFloat(novoValor).toFixed(2).replace('.', ',')}
                    <br><strong>Data/Hora:</strong> ${dataBr} às ${novaHora}
                    <br><br><strong>Serviços inclusos:</strong><br>${novaDescricao}
                `);
                
                atualizarAreaNegociacao();
            });
        } else if (!isPrestador && pedido.valorStatus === 'PROPOSTO') {
            document.getElementById("btnAceitarProposta")?.addEventListener("click", () => {
                pedido.valorStatus = 'ACEITO';
                salvarEAtualizarPedido(pedido);
                
                enviarMensagemSistema(pedido.id, `✅ <strong>Orçamento ACEITO</strong> pelo cliente (R$ ${parseFloat(pedido.valorCombinado).toFixed(2).replace('.', ',')}).`);
                atualizarAreaNegociacao();
            });
        }
    }

    function salvarEAtualizarPedido(pedidoModificado) {
        const index = solicitacoes.findIndex(s => s.id === pedidoModificado.id);
        if (index !== -1) {
            solicitacoes[index] = pedidoModificado;
            localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
            atualizarExibicaoPedidos();
        }
    }

    function enviarMensagemSistema(pedidoId, texto) {
        const novaMensagem = {
            id_mensagem: "MSG-" + Date.now(),
            id_solicitacao: pedidoId,
            remetenteEmail: "SISTEMA",
            mensagem: texto,
            data_envio: new Date().toISOString(),
            lida: false
        };
        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        todasMensagens.push(novaMensagem);
        localStorage.setItem("mensagens", JSON.stringify(todasMensagens));

        if (currentPedidoId === pedidoId) {
            renderMensagens(pedidoId);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
        
        if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
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
            if (msg.remetenteEmail === "SISTEMA") {
                return `<div class="message system">${msg.mensagem}</div>`;
            }
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

    // ================= HEADER E LOGOUT =================
    function logout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    }

    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;
        const fotoPerfil = usuarioAtual?.fotoPerfil || 'img/avatar_padrao.png';
        menu.innerHTML = `
            <a href="home.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html">Meus Pedidos</a>
            <div class="profile-menu-container">
                <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar" id="avatarMenuBtn" style="cursor: pointer;" title="Opções da Conta">
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="perfil.html">Meu Perfil</a>
                    <a href="#" id="btnLogout">Sair</a>
                </div>
            </div>
        `;
        document.getElementById("btnLogout").addEventListener("click", logout);
        document.getElementById("avatarMenuBtn").addEventListener("click", function(e) {
            e.stopPropagation();
            document.getElementById("profileDropdown").classList.toggle("show-dropdown");
        });
        window.addEventListener("click", function() {
            const dropdown = document.getElementById("profileDropdown");
            if (dropdown && dropdown.classList.contains("show-dropdown")) {
                dropdown.classList.remove("show-dropdown");
            }
        });
        if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
    }

    // Inicia a renderização
    setupHeader();
    carregarPedidos();
});