document.addEventListener("DOMContentLoaded", async function() {
    // ================= VALIDAÇÃO E CARREGAMENTO DE DADOS =================
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para ver seus pedidos!", "error");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500); 
        return;
    }

    // 🚀 BUSCA OS DADOS DA API COM FALLBACK DE SEGURANÇA
    const [usuarios, solicitacoesDaAPI, avaliacoesGlobais] = await Promise.all([
        API.getUsuarios(), 
        API.getSolicitacoes(),
        API.getAvaliacoes()
    ]);
    
    // Pega as solicitações 100% da API agora!
    let solicitacoes = solicitacoesDaAPI;

    const usuarioAtual = usuarios.find(u => u.email === emailLogado);

    if (!usuarioAtual) {
        mostrarToast("Usuário não encontrado. Faça login novamente.", "error");
        API.fazerLogout();
        window.location.href = "index.html";
        return;
    }

    // Containers para pedidos enviados e recebidos
    const recebidosSection = document.getElementById("recebidos-section");
    const recebidosContainer = document.getElementById("pedidos-recebidos-container");
    const enviadosSection = document.getElementById("enviados-section");
    const enviadosContainer = document.getElementById("pedidos-enviados-container");
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
    const chatImageInput = document.getElementById("chat-image-input");
    const btnToggleOrcamento = document.getElementById("btnToggleOrcamento");
    const orcamentoOverlay = document.getElementById("orcamento-overlay");
    const chatView = document.getElementById("chat-view");
    const negociacaoArea = document.getElementById("negociacao-area"); 
    const fecharOrcamentoBtn = document.getElementById("fechar-orcamento-btn");
    let currentPedidoId = null; 
    let focusableElements = [];
    let firstFocusableElement;
    let lastFocusableElement;
    let chatPollingInterval = null; // 🚀 Variável para o chat em tempo real

    // Variáveis de Paginação
    let currentPageEnviados = 1;
    let currentPageRecebidos = 1;
    const ITEMS_PER_PAGE = 6;

    // ================= LÓGICA DE EXIBIÇÃO (CLIENTE vs PRESTADOR) =================
    function carregarPedidos() {
        filtroStatusRecebidos?.addEventListener('change', () => { currentPageRecebidos = 1; atualizarLista('recebidos'); });
        ordenarDataRecebidos?.addEventListener('change', () => { currentPageRecebidos = 1; atualizarLista('recebidos'); });
        filtroStatusEnviados?.addEventListener('change', () => { currentPageEnviados = 1; atualizarLista('enviados'); });
        ordenarDataEnviados?.addEventListener('change', () => { currentPageEnviados = 1; atualizarLista('enviados'); });

        // Configuração das Abas para separar Prestados e Contratados
        const btnTabContratados = document.getElementById("btnTabContratados");
        const btnTabPrestados = document.getElementById("btnTabPrestados");
        const tabsContainer = document.querySelector(".tabs-container");
        const pageTitle = document.querySelector(".services-section h2");

        if (usuarioAtual.tipo === 'prestador') {
            if(btnTabPrestados) btnTabPrestados.style.display = 'block';
            if(pageTitle) pageTitle.innerText = "Meus Serviços e Pedidos";

            btnTabContratados?.addEventListener("click", () => {
                btnTabContratados.classList.add("active");
                btnTabPrestados.classList.remove("active");
                enviadosSection.style.display = "block";
                recebidosSection.style.display = "none";
            });

            btnTabPrestados?.addEventListener("click", () => {
                btnTabPrestados.classList.add("active");
                btnTabContratados.classList.remove("active");
                recebidosSection.style.display = "block";
                enviadosSection.style.display = "none";
            });
        } else {
            // Se for apenas cliente, remove o visual das abas e muda o título
            if (tabsContainer) tabsContainer.style.display = 'none';
            if (pageTitle) pageTitle.innerText = "Meus Pedidos";
        }

        atualizarExibicaoPedidos();
    }

    function renderSkeletons(container, quantidade) {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < quantidade; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'pedido-card';
            skeletonCard.innerHTML = `
                <div class="skeleton skeleton-title" style="width: 70%; margin: 0 0 15px 0; height: 20px;"></div>
                <div class="skeleton skeleton-text" style="width: 90%; margin: 0 0 10px 0;"></div>
                <div class="skeleton skeleton-text" style="width: 60%; margin: 0 0 10px 0;"></div>
                <div class="skeleton skeleton-text" style="width: 40%; margin: 0 0 10px 0;"></div>
                <div class="botoes-acao"><div class="skeleton skeleton-button" style="flex-grow: 1;"></div></div>
            `;
            container.appendChild(skeletonCard);
        }
    }

    function atualizarExibicaoPedidos() {
        atualizarLista('enviados');
        if (usuarioAtual.tipo === 'prestador') {
            atualizarLista('recebidos');
        }
    }

    function atualizarLista(tipo) {
        const isEnviados = tipo === 'enviados';
        const container = isEnviados ? enviadosContainer : recebidosContainer;
        const filtroStatus = isEnviados ? (filtroStatusEnviados?.value || 'todos') : (filtroStatusRecebidos?.value || 'todos');
        const ordenarData = isEnviados ? (ordenarDataEnviados?.value || 'recentes') : (ordenarDataRecebidos?.value || 'recentes');
        const currentPage = isEnviados ? currentPageEnviados : currentPageRecebidos;

        // FILTRO DE PEDIDOS COM BLINDAGEM DE VARIÁVEIS API x LOCALSTORAGE
        let pedidos = solicitacoes.filter(s => {
            const cEmail = s.clienteEmail || s.cliente_email;
            const pEmail = s.prestadorEmail || s.prestador_email;
            return isEnviados ? cEmail === usuarioAtual.email : pEmail === usuarioAtual.email;
        });

        pedidos = aplicarFiltros(pedidos, filtroStatus, ordenarData);

        const totalItems = pedidos.length;
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedPedidos = pedidos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        const numSkeletons = paginatedPedidos.length > 0 ? paginatedPedidos.length : 1;
        renderSkeletons(container, numSkeletons);

        renderPaginacao(totalItems, currentPage, ITEMS_PER_PAGE, isEnviados ? 'paginacao-enviados' : 'paginacao-recebidos', (newPage) => {
            if (isEnviados) currentPageEnviados = newPage;
            else currentPageRecebidos = newPage;
            atualizarLista(tipo);
        });

        setTimeout(() => {
            if (isEnviados) {
                renderPedidosCliente(paginatedPedidos, container, avaliacoesGlobais);
            } else {
                renderPedidosPrestador(paginatedPedidos, container);
            }
        }, 500); 
    }

    function renderPaginacao(totalItems, currentPage, itemsPerPage, containerId, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) { container.innerHTML = ''; return; }
        container.innerHTML = `
            <button class="page-btn" id="prev-${containerId}" ${currentPage === 1 ? 'disabled' : ''}>&#8592;</button>
            <span class="page-info">Página ${currentPage} de ${totalPages}</span>
            <button class="page-btn" id="next-${containerId}" ${currentPage === totalPages ? 'disabled' : ''}>&#8594;</button>
        `;
        document.getElementById(`prev-${containerId}`)?.addEventListener('click', () => onPageChange(currentPage - 1));
        document.getElementById(`next-${containerId}`)?.addEventListener('click', () => onPageChange(currentPage + 1));
    }

    function aplicarFiltros(listaPedidos, status, ordenacao) {
        let pedidosFiltrados = [...listaPedidos];
        if (status !== 'todos') {
            pedidosFiltrados = pedidosFiltrados.filter(p => p.status === status);
        }
        pedidosFiltrados.sort((a, b) => {
            const dataStrA = a.dataSolicitacao || a.criado_em || new Date().toISOString();
            const dataStrB = b.dataSolicitacao || b.criado_em || new Date().toISOString();
            return ordenacao === 'recentes' ? new Date(dataStrB) - new Date(dataStrA) : new Date(dataStrA) - new Date(dataStrB);
        });
        return pedidosFiltrados;
    }

    function renderPedidosCliente(pedidos, container, avaliacoes) {
        if (!container) return;
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-up-animation">
                    <div class="empty-state-icon">📝</div>
                    <p>Você ainda não fez nenhuma solicitação de serviço.</p>
                    <button class="btn-service" style="margin-top: 20px; width: auto; padding: 10px 25px;" onclick="window.location.href='servicos.html'">Buscar Serviços</button>
                </div>`;
            return;
        }
        container.innerHTML = pedidos.map(pedido => {
            // Fallbacks de segurança para as variáveis
            const dataPedido = pedido.data_desejada || pedido.dataSelecionada || pedido.criado_em || new Date().toISOString();
            const pEmail = pedido.prestadorEmail || pedido.prestador_email;
            const nomePrestador = pedido.prestador_nome || usuarios.find(u => u.email === pEmail)?.nome || 'Não encontrado';
            const valorCombinado = pedido.valor_combinado || pedido.valorCombinado;
            const statusPagamento = pedido.statusPagamento || pedido.status_pagamento || 'Pendente';
            const valorStatusAtual = pedido.valorStatus || pedido.valor_status; // 🚀 Blindagem Extra

            const naoLidas = pedido.mensagensNaoLidas || 0;
            const badgeHTML = naoLidas > 0 ? `<span class="notificacao-badge" style="top: -8px; right: -8px;">${naoLidas}</span>` : '';
            const valorFormatado = valorCombinado ? `R$ ${parseFloat(valorCombinado).toFixed(2).replace('.', ',')}` : 'A combinar';
            const statusBadgeHTML = formatarStatusBadge(pedido, emailLogado);
            const timelineHTML = gerarTimelineHTML(pedido);
            const textoBotaoChat = pedido.status === 'CANCELADO' ? 'Ver Histórico' : 'Ver Conversa';

            let avaliacaoInfoHTML = '';
            if (pedido.status === 'CONCLUIDO' && pedido.avaliado) {
                const minhaAvaliacao = avaliacoes.find(a => a.id_solicitacao === pedido.id);
                if (minhaAvaliacao) {
                    const estrelas = '★'.repeat(minhaAvaliacao.nota) + '☆'.repeat(5 - minhaAvaliacao.nota);
                    avaliacaoInfoHTML = `<p><strong>Sua Avaliação:</strong> <span class="rating-display">${estrelas}</span></p>`;
                }
            }
            
            return `
                <div class="pedido-card">
                    <div class="card-header">
                        <h3>${pedido.servico}</h3>
                        ${statusBadgeHTML}
                    </div>
                    <p><strong>Prestador:</strong> ${nomePrestador}</p>
                    ${timelineHTML}
                    <div class="card-details">
                        <p><strong>Data:</strong> ${new Date(dataPedido).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                        <p><strong>Valor:</strong> ${valorFormatado}</p>
                        <p><strong>Pagamento:</strong> <span style="color: ${statusPagamento === 'RETIDO' ? '#f0ad4e' : statusPagamento === 'LIBERADO' ? '#5cb85c' : '#AAAAAA'};">${statusPagamento.replace('_', ' ')}</span></p>
                        ${avaliacaoInfoHTML}
                    </div>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">${textoBotaoChat}${badgeHTML}</button>
                    ${(pedido.status === 'PENDENTE' && valorStatusAtual === 'PROPOSTO') ? `<button class="btn-acao ver-orcamento" data-pedido-id="${pedido.id}" style="background-color: #f0ad4e; color: #222A31;">Ver Orçamento</button>` : ''}
                        ${pedido.status === 'PENDENTE' ? `<button class="btn-acao cancelar" data-pedido-id="${pedido.id}">Cancelar Solicitação</button>` : ''}
                        ${pedido.status === 'AGUARDANDO_CONFIRMACAO' ? `<button class="btn-acao confirmar-conclusao" data-pedido-id="${pedido.id}">Confirmar Conclusão</button>` : ''}
                        ${(pedido.status === 'CONCLUIDO' && !pedido.avaliado) ? `<button class="btn-acao btn-avaliar" data-pedido-id="${pedido.id}">Avaliar Serviço</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderPedidosPrestador(pedidos, container) {
        if (!container) return;
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-up-animation">
                    <div class="empty-state-icon">📭</div>
                    <p>Você ainda não recebeu nenhuma solicitação de serviço.</p>
                </div>`;
            return;
        }
        container.innerHTML = pedidos.map(pedido => {
            // Fallbacks de segurança
            const cEmail = pedido.clienteEmail || pedido.cliente_email;
            const nomeCliente = pedido.cliente_nome || usuarios.find(u => u.email === cEmail)?.nome || 'Cliente';
            const dataPedido = pedido.data_desejada || pedido.dataSelecionada || pedido.criado_em || new Date().toISOString();
            const descricaoProblema = pedido.descricao_problema || pedido.descricaoProblema || pedido.descricao || 'Não informado';
            const enderecoLocal = pedido.endereco_realizacao || pedido.enderecoRealizacao || 'Não informado';
            const valorCombinado = pedido.valor_combinado || pedido.valorCombinado;
            const statusPagamento = pedido.statusPagamento || pedido.status_pagamento || 'Pendente';
            const valorStatusAtual = pedido.valorStatus || pedido.valor_status; // 🚀 Blindagem Extra

            const naoLidas = pedido.mensagensNaoLidas || 0;
            const badgeHTML = naoLidas > 0 ? `<span class="notificacao-badge" style="top: -8px; right: -8px;">${naoLidas}</span>` : '';
            const valorFormatado = valorCombinado ? `R$ ${parseFloat(valorCombinado).toFixed(2).replace('.', ',')}` : 'A combinar';
            const statusBadgeHTML = formatarStatusBadge(pedido, emailLogado);
            const timelineHTML = gerarTimelineHTML(pedido);
            const textoBotaoChat = pedido.status === 'CANCELADO' ? 'Ver Histórico' : 'Ver Conversa';
            
            return `
                <div class="pedido-card">
                    <div class="card-header">
                        <h3>Solicitação de ${nomeCliente.split(' ')[0]}</h3>
                        ${statusBadgeHTML}
                    </div>
                    <p><strong>Serviço:</strong> ${pedido.servico}</p>
                    ${timelineHTML}
                    <div class="card-details">
                        <p><strong>Descrição:</strong> ${descricaoProblema}</p>
                        <p><strong>Endereço:</strong> ${enderecoLocal}</p>
                        <p><strong>Data:</strong> ${new Date(dataPedido).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                        <p><strong>Valor:</strong> ${valorFormatado}</p>
                        <p><strong>Pagamento:</strong> <span style="color: ${statusPagamento === 'RETIDO' ? '#f0ad4e' : statusPagamento === 'LIBERADO' ? '#5cb85c' : '#AAAAAA'};">${statusPagamento.replace('_', ' ')}</span></p>
                    </div>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">${textoBotaoChat}${badgeHTML}</button>
                    ${(pedido.status === 'PENDENTE' && valorStatusAtual !== 'PROPOSTO') ? `
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
    if(mainContainer) {
        mainContainer.addEventListener('click', async function(e) {
            const target = e.target;
            const pedidoIdStr = target.getAttribute('data-pedido-id');
            if (!pedidoIdStr) return;

            let novoStatus = '';
            if (target.classList.contains('aceitar')) novoStatus = 'ACEITO';
            else if (target.classList.contains('recusar')) novoStatus = 'CANCELADO';
            else if (target.classList.contains('cancelar')) novoStatus = 'CANCELADO';
            else if (target.classList.contains('concluir')) novoStatus = 'AGUARDANDO_CONFIRMACAO';
            else if (target.classList.contains('confirmar-conclusao')) novoStatus = 'CONCLUIDO';
            
            if (novoStatus) {
                const index = solicitacoes.findIndex(s => s.id == pedidoIdStr); // Usando == para evitar erro de String vs Number
                if (index !== -1) {
                    const pedidoModificado = { ...solicitacoes[index] }; // Cria uma cópia segura para não bugar a memória
                    
                    const statusAtualPagamento = pedidoModificado.statusPagamento || pedidoModificado.status_pagamento;
                    
                    if (novoStatus === 'CANCELADO' && statusAtualPagamento === 'RETIDO') {
                        pedidoModificado.statusPagamento = 'ESTORNADO';
                    }
                    
                    if (novoStatus === 'CONCLUIDO' && statusAtualPagamento === 'RETIDO') {
                        pedidoModificado.statusPagamento = 'LIBERADO';
                    }
                    
                    // UX: Botão em estado de carregamento para evitar cliques duplos
                    const textoOriginal = target.innerText;
                    target.innerText = "Aguarde...";
                    target.disabled = true;

                    try {
                        // 🚀 Aguarda a API atualizar o Banco de Dados Real ANTES de mexer na tela!
                        await API.atualizarSolicitacao(pedidoModificado.id, { 
                            status: novoStatus, 
                            statusPagamento: pedidoModificado.statusPagamento 
                        });

                        // Se deu tudo certo no banco, atualizamos a tela e as variáveis locais
                        solicitacoes[index].status = novoStatus;
                        solicitacoes[index].statusPagamento = pedidoModificado.statusPagamento;

                        if (novoStatus === 'AGUARDANDO_CONFIRMACAO') {
                            await enviarMensagemSistema(pedidoIdStr, "🛠️ <strong>Serviço finalizado pelo prestador.</strong> Aguardando o cliente confirmar a conclusão para liberar o pagamento.");
                        } else if (novoStatus === 'CONCLUIDO') {
                            await enviarMensagemSistema(pedidoIdStr, "✅ <strong>Conclusão confirmada pelo cliente.</strong> O pagamento foi liberado para o prestador.");
                        } else if (target.classList.contains('cancelar') && novoStatus === 'CANCELADO') {
                            await enviarMensagemSistema(pedidoIdStr, "🚫 <strong>Solicitação cancelada.</strong> O valor pago foi estornado.");
                        }

                        // Garante dados 100% frescos da API e atualiza a interface visualmente
                        const novasSolicitacoes = await API.getSolicitacoes();
                        solicitacoes = novasSolicitacoes.length > 0 ? novasSolicitacoes : solicitacoes;
                        
                        atualizarExibicaoPedidos(); 
                        mostrarToast("Status atualizado com sucesso!", "success");
                        if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
                        
                    } catch (error) {
                        console.error(error);
                        mostrarToast("Erro ao atualizar o status. Tente novamente.", "error");
                        target.innerText = textoOriginal;
                        target.disabled = false;
                    }
                }
            } else if (target.classList.contains('btn-avaliar')) {
                window.location.href = `avaliar.html?pedido=${pedidoIdStr}`;
            } else if (target.classList.contains('btn-chat')) {
                abrirChat(pedidoIdStr);
            } else if (target.classList.contains('ver-orcamento')) {
                abrirChat(pedidoIdStr, true); // O 'true' avisa a função para já abrir a caixa de orçamento!
            }
        });
    }

    // ================= LÓGICA DO CHAT =================
    function abrirChat(pedidoId, autoOpenOrcamento = false) {
        currentPedidoId = pedidoId;
        const pedido = solicitacoes.find(s => s.id == pedidoId);
        if (!pedido) return;

        chatHeader.innerText = `Conversa sobre "${pedido.servico}"`;

        if (autoOpenOrcamento) {
            abrirOrcamento();
        } else {
            fecharOrcamento(); 
        }
        atualizarAreaNegociacao();

        const chatInputArea = document.querySelector(".chat-input-area");
        if (pedido.status === 'CANCELADO' || pedido.status === 'CONCLUIDO') {
            if(chatInputArea) chatInputArea.style.display = 'none';
        } else {
            if(chatInputArea) chatInputArea.style.display = 'flex';
        }

        // 🚀 Chama a API para marcar as mensagens como lidas no Banco de Dados
        API.marcarMensagensComoLidas(pedidoId).then(() => {
            if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
            
            // Atualiza o contador localmente para a bolinha do chat sumir da tela imediatamente
            const pIndex = solicitacoes.findIndex(s => s.id == pedidoId);
            if (pIndex !== -1 && solicitacoes[pIndex].mensagensNaoLidas > 0) {
                solicitacoes[pIndex].mensagensNaoLidas = 0;
                atualizarExibicaoPedidos();
            }
        });

        renderMensagens(pedidoId);
        modal.style.display = "block";
        document.body.classList.add('focus-mode-active');
        
        // 🚀 INICIA O CHAT EM TEMPO REAL (Atualiza a cada 3 segundos)
        if (chatPollingInterval) clearInterval(chatPollingInterval);
        chatPollingInterval = setInterval(() => {
            if (currentPedidoId) renderMensagens(currentPedidoId, false);
        }, 3000);

        focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusableElement = focusableElements[0]; 
        lastFocusableElement = focusableElements[focusableElements.length - 1];

        setTimeout(() => { if(firstFocusableElement) firstFocusableElement.focus(); }, 100);
        modal.addEventListener('keydown', trapFocus);
    }

    function atualizarAreaNegociacao() {
        const area = document.getElementById("negociacao-area");
        if (!area || !currentPedidoId) return;

        const pedido = solicitacoes.find(s => s.id == currentPedidoId);
        if (!pedido) return;
        
        if (pedido.status === 'CANCELADO') {
            area.innerHTML = `<div style="text-align: center; color: #d9534f; font-weight: bold; padding: 20px;">🚫 Solicitação cancelada. O chat foi arquivado.</div>`;
            return;
        } else if (pedido.status === 'CONCLUIDO') {
            area.innerHTML = `<div style="text-align: center; color: #007bff; font-weight: bold; padding: 20px;">✅ Serviço concluído. O chat foi arquivado.</div>`;
            return;
        }

        // Fallbacks Seguros
        const pEmail = pedido.prestadorEmail || pedido.prestador_email;
        const valorCombinado = pedido.valorCombinado || pedido.valor_combinado;
        const descricaoProposta = pedido.descricaoProposta || pedido.descricao_proposta || '';
        const dataProposta = pedido.dataProposta || pedido.data_proposta;
        const horaProposta = pedido.horaProposta || pedido.hora_proposta;
        const nomePrestador = pedido.prestador_nome || usuarios.find(u => u.email === pEmail)?.nome || 'Profissional';

        const isPrestador = pEmail === usuarioAtual.email;
        const valorFormatado = valorCombinado ? `R$ ${parseFloat(valorCombinado).toFixed(2).replace('.', ',')}` : 'Não definido';
        
        let dataHoraFormatada = '';
        if (dataProposta) {
            let dataBr = dataProposta;
            if (dataProposta.includes('T')) {
                dataBr = new Date(dataProposta).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            } else if (dataProposta.includes('-')) {
                const dataParts = dataProposta.split('-');
                if (dataParts.length === 3) dataBr = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
            }
            dataHoraFormatada = `<strong>Data/Hora Proposta:</strong> ${dataBr} às ${horaProposta || 'Não informado'}`;
        }

        let html = '';
        if (isPrestador) {
            if (pedido.valorStatus === 'ACEITO') {
                html = `
                    <div class="orcamento-details" style="background: #222A31; padding: 25px; border-radius: 12px; border: 1px solid #5cb85c;">
                        <h4 style="color: #5cb85c; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #393E46; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            ✅ Orçamento Aprovado
                        </h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <span style="color: #AAAAAA; font-size: 14px;">Valor Combinado:</span>
                            <strong style="color: #5cb85c; font-size: 24px;">${valorFormatado}</strong>
                        </div>
                        ${dataHoraFormatada ? `<div style="color: #EEEEEE; font-size: 14px; margin-bottom: 15px;">📅 ${dataHoraFormatada}</div>` : ''}
                        <div class="orcamento-desc" style="background: #2A343D; padding: 15px; border-radius: 8px;">
                            <strong style="color: #EEEEEE; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Escopo do Serviço</strong>
                            <p style="white-space: pre-wrap; margin-top: 8px; color: #CCCCCC; font-size: 14px; line-height: 1.6;">${descricaoProposta}</p>
                        </div>
                    </div>`;
            } else {
                html = `
                    <div class="orcamento-form" style="background: #222A31; padding: 25px; border-radius: 12px; border: 1px solid #00ADB5;">
                        <h4 style="color: #00ADB5; margin-bottom: 20px; font-size: 18px;">Enviar Nova Proposta</h4>
                        <div class="form-group-row">
                            <div class="form-group">
                                <label style="color:#AAAAAA; font-size:13px;">Orçamento (R$)</label>
                                <input type="text" id="inputValorNegociado" value="${valorCombinado ? formatarMoedaParaMascara(valorCombinado) : ''}" placeholder="R$ 0,00" style="background:#2A343D; border:1px solid #4F5B66; color:#EEE;">
                            </div>
                        </div>
                        <div class="form-group-row" style="margin-top:15px;">
                            <div class="form-group">
                                <label style="color:#AAAAAA; font-size:13px;">Data Sugerida</label>
                                <input type="date" id="inputDataProposta" value="${dataProposta || ''}" style="background:#2A343D; border:1px solid #4F5B66; color:#EEE;">
                            </div>
                            <div class="form-group">
                                <label style="color:#AAAAAA; font-size:13px;">Horário</label>
                                <input type="time" id="inputHoraProposta" value="${horaProposta || ''}" style="background:#2A343D; border:1px solid #4F5B66; color:#EEE;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-top:15px;">
                            <label style="color:#AAAAAA; font-size:13px;">Descrição do Serviço / Inclusões</label>
                            <textarea id="textareaDescricaoProposta" placeholder="Descreva o que está incluso no valor..." style="background:#2A343D; border:1px solid #4F5B66; color:#EEE;">${descricaoProposta}</textarea>
                        </div>
                        <button id="btnEnviarProposta" class="btn-service" style="width: 100%; margin-top:20px; font-size:16px;">Enviar Proposta ao Cliente</button>
                        ${pedido.valorStatus === 'PROPOSTO' ? '<div style="color: #f0ad4e; font-size: 13px; text-align: center; margin-top: 15px; font-weight: 500;">⏳ Aguardando aprovação do cliente...</div>' : ''}
                    </div>`;
            }
        } else {
            if (pedido.valorStatus === 'ACEITO') {
                html = `
                    <div class="orcamento-details" style="background: #222A31; padding: 25px; border-radius: 12px; border: 1px solid #5cb85c;">
                        <h4 style="color: #5cb85c; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #393E46; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            ✅ Orçamento Aprovado
                        </h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <span style="color: #AAAAAA; font-size: 14px;">Valor Combinado:</span>
                            <strong style="color: #5cb85c; font-size: 24px;">${valorFormatado}</strong>
                        </div>
                        ${dataHoraFormatada ? `<div style="color: #EEEEEE; font-size: 14px; margin-bottom: 15px;">📅 ${dataHoraFormatada}</div>` : ''}
                        <div class="orcamento-desc" style="background: #2A343D; padding: 15px; border-radius: 8px;">
                            <strong style="color: #EEEEEE; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Escopo do Serviço</strong>
                            <p style="white-space: pre-wrap; margin-top: 8px; color: #CCCCCC; font-size: 14px; line-height: 1.6;">${descricaoProposta}</p>
                        </div>
                    </div>`;
            } else if (pedido.valorStatus === 'PROPOSTO') {
                html = `
                    <div class="orcamento-details" style="background: #222A31; padding: 25px; border-radius: 12px; border: 1px solid #f0ad4e; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #f0ad4e;"></div>
                        <h4 style="color: #f0ad4e; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #393E46; padding-bottom: 10px;">
                            Nova Proposta Recebida
                        </h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <span style="color: #AAAAAA; font-size: 14px;">Valor Cobrado:</span>
                            <strong style="color: #f0ad4e; font-size: 24px;">${valorFormatado}</strong>
                        </div>
                        ${dataHoraFormatada ? `<div style="color: #EEEEEE; font-size: 14px; margin-bottom: 15px;">📅 ${dataHoraFormatada}</div>` : ''}
                        <div class="orcamento-desc" style="background: #2A343D; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <strong style="color: #EEEEEE; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Escopo do Serviço</strong>
                            <p style="white-space: pre-wrap; margin-top: 8px; color: #CCCCCC; font-size: 14px; line-height: 1.6;">${descricaoProposta}</p>
                        </div>
                        <button id="btnAceitarProposta" class="btn-aceitar-orcamento" style="width: 100%; font-size: 16px; padding: 14px; box-shadow: 0 4px 15px rgba(92, 184, 92, 0.2);">Aceitar Proposta e Pagar</button>
                    </div>`;
            } else {
                html = `
                    <div style="text-align: center; color: #AAAAAA; padding: 40px 20px; background: #222A31; border-radius: 12px; border: 1px dashed #4F5B66;">
                        <span style="font-size: 32px; display: block; margin-bottom: 10px;">⏳</span>
                        Aguardando orçamento do prestador...
                    </div>`;
            }
        }
        
        area.innerHTML = html;
        
        if (document.getElementById("inputValorNegociado")) {
            aplicarMascaraDinheiro(document.getElementById("inputValorNegociado"));
        }

        if (isPrestador && pedido.valorStatus !== 'ACEITO') {
            document.getElementById("btnEnviarProposta")?.addEventListener("click", () => {
                const submitButton = document.getElementById("btnEnviarProposta");
                setButtonLoading(submitButton);

                const novoValorStr = document.getElementById("inputValorNegociado").value;
                const novoValor = limparMascaraDinheiro(novoValorStr);
                const novaDescricao = document.getElementById("textareaDescricaoProposta").value.trim();
                const novaData = document.getElementById("inputDataProposta").value;
                const novaHora = document.getElementById("inputHoraProposta").value;

                if (!novoValor || parseFloat(novoValor) <= 0) {
                    mostrarToast("Digite um valor válido.", "error");
                    removeButtonLoading(submitButton); return;
                }
                if (!novaDescricao) {
                    mostrarToast("Por favor, descreva o serviço que será feito.", "error");
                    removeButtonLoading(submitButton); return;
                }
                if (!novaData || !novaHora) {
                     mostrarToast("Por favor, informe a data e o horário propostos.", "error");
                     removeButtonLoading(submitButton); return;
                }
                
                setTimeout(() => {
                    pedido.valorCombinado = novoValor;
                    pedido.descricaoProposta = novaDescricao;
                    pedido.dataProposta = novaData;
                    pedido.horaProposta = novaHora;
                    pedido.valorStatus = 'PROPOSTO';
                    salvarEAtualizarPedido(pedido);
                    
                    const dataParts = novaData.split('-');
                    const dataBr = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
                    
                    enviarMensagemSistema(pedido.id, `🕒 <strong>Orçamento enviado:</strong> R$ ${parseFloat(novoValor).toFixed(2).replace('.', ',')}<br><strong>Data/Hora:</strong> ${dataBr} às ${novaHora}<br><br><strong>Serviços inclusos:</strong><br>${novaDescricao}`);
                    
                    atualizarAreaNegociacao();
                    setTimeout(fecharOrcamento, 500); 
                }, 800);
            });
        } else if (!isPrestador && pedido.valorStatus === 'PROPOSTO') {
            document.getElementById("btnAceitarProposta")?.addEventListener("click", () => {
                document.getElementById('pagamentoServicoTitulo').innerText = pedido.servico;
                document.getElementById('pagamentoPrestadorNome').innerText = nomePrestador;
                document.getElementById('pagamentoValorTotal').innerText = `R$ ${parseFloat(valorCombinado).toFixed(2).replace('.', ',')}`;

                document.getElementById('payPix').checked = true;
                document.getElementById('areaPix').style.display = 'block';
                document.getElementById('areaCartao').style.display = 'none';

                document.getElementById('pagamentoModal').style.display = 'flex';
            });
        }
    }

    async function salvarEAtualizarPedido(pedidoModificado) {
        const index = solicitacoes.findIndex(s => s.id == pedidoModificado.id);
        if (index !== -1) {
            solicitacoes[index] = pedidoModificado;
            atualizarExibicaoPedidos();
            
            // 🚀 Salva o Orçamento do Prestador no Banco de Dados Real!
            await API.atualizarSolicitacao(pedidoModificado.id, pedidoModificado).catch(console.error);
        }
    }

    async function enviarMensagemSistema(pedidoId, texto) {
        try {
            // 🚀 Envia a mensagem do sistema para a API
            await API.enviarMensagemSistemaApi(pedidoId, texto);
            
            if (currentPedidoId == pedidoId) {
                renderMensagens(pedidoId, true);
            }
        } catch (e) {
            console.error("Erro ao salvar mensagem do sistema na API", e);
        }
        if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
    }

    function abrirOrcamento() {
        if (orcamentoOverlay) orcamentoOverlay.style.display = 'flex';
        if (chatView) chatView.classList.add('blurred');
    }

    function fecharChat() {
        if(modal) modal.style.display = "none";
        document.body.classList.remove('focus-mode-active');
        currentPedidoId = null;
        if(chatMessagesContainer) chatMessagesContainer.innerHTML = "";
        fecharOrcamento(); 
        if(modal) modal.removeEventListener('keydown', trapFocus);
        
        // 🚀 DESLIGA O TEMPO REAL AO FECHAR O CHAT
        if (chatPollingInterval) {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }
        
        // 🚀 FORÇA A ATUALIZAÇÃO DA TELA (Garante que o botão "Confirmar Conclusão" apareça assim que o chat fechar)
        API.getSolicitacoes().then(novasSolicitacoes => {
            solicitacoes = novasSolicitacoes.length > 0 ? novasSolicitacoes : solicitacoes;
            atualizarExibicaoPedidos();
        });
    }

    function fecharOrcamento() {
        if (orcamentoOverlay) orcamentoOverlay.style.display = 'none';
        if (chatView) chatView.classList.remove('blurred');
    }

    async function renderMensagens(pedidoId, autoScroll = true) {
        if(!chatMessagesContainer) return;
        
        // 🚀 Busca as mensagens REAIS do banco de dados
        const mensagensDoPedido = await API.getMensagensPorPedido(pedidoId);

        // Verifica se o usuário estava no final do chat para não puxar a tela se ele estiver lendo algo antigo
        const isAtBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop <= chatMessagesContainer.clientHeight + 50;

        chatMessagesContainer.innerHTML = mensagensDoPedido.map(msg => {
            if (msg.remetenteEmail === "SISTEMA") {
                return `<div class="message system">${msg.mensagem}</div>`;
            }
            const classe = msg.remetenteEmail === emailLogado ? 'sent' : 'received';
            let conteudo = msg.mensagem ? `<div>${msg.mensagem}</div>` : '';
            if (msg.imagemBase64) {
                conteudo += `<img src="${msg.imagemBase64}" alt="Anexo" class="chat-image" onclick="abrirLightbox(this)">`;
            }
            return `<div class="message ${classe}">${conteudo}</div>`;
        }).join('');
        
        if (autoScroll || isAtBottom) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    async function enviarNovaMensagemObjeto(texto, imagemBase64 = null) {
        try {
            // 🚀 Envia a mensagem real para o Banco de Dados
            await API.enviarMensagemApi(currentPedidoId, texto, imagemBase64);
            
            if(chatInput) {
                chatInput.style.height = 'auto'; 
                chatInput.value = "";
            }
            if (chatImageInput) chatImageInput.value = ""; 
            
            renderMensagens(currentPedidoId, true);
        } catch (e) {
            console.error("Erro ao enviar mensagem para a API", e);
            mostrarToast(e.message, "error");
        }
    }

    function enviarMensagem() {
        if(!chatInput) return;
        const texto = chatInput.value.trim();
        if (!texto) return;

        setButtonLoading(chatSendBtn);
        enviarNovaMensagemObjeto(texto, null).finally(() => {
            removeButtonLoading(chatSendBtn);
        });
    }

    function trapFocus(e) {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
        if (!isTabPressed) {
            if (e.key === 'Escape' || e.keyCode === 27) fecharChat();
            return;
        }
        if (e.shiftKey) { 
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus(); e.preventDefault();
            }
        } else { 
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus(); e.preventDefault();
            }
        }
    }

    if(closeModalBtn) closeModalBtn.addEventListener('click', fecharChat);
    if(chatSendBtn) chatSendBtn.addEventListener('click', enviarMensagem);
    if(chatInput) chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
    });
    
    if (btnToggleOrcamento) {
        btnToggleOrcamento.addEventListener('click', () => {
            if (orcamentoOverlay.style.display === 'none' || orcamentoOverlay.style.display === '') abrirOrcamento();
            else fecharOrcamento();
        });
    }

    if (fecharOrcamentoBtn) fecharOrcamentoBtn.addEventListener('click', fecharOrcamento);
    if (orcamentoOverlay) {
        orcamentoOverlay.addEventListener('click', function(e) {
            if (e.target === orcamentoOverlay) fecharOrcamento();
        });
    }

    if (chatInput) {
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
        });
    }

    if (chatImageInput) {
        chatImageInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file || !currentPedidoId) return;
            try {
                mostrarToast("Anexando imagem...", "success");
                const base64Comprimido = await comprimirImagem(file, 800, 800, 0.7);
                enviarNovaMensagemObjeto(chatInput.value.trim(), base64Comprimido);
            } catch (error) { mostrarToast("Erro ao processar o anexo.", "error"); }
        });
    }

    if (chatView) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            chatView.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            chatView.addEventListener(eventName, () => {
                const inputArea = document.querySelector(".chat-input-area");
                if (currentPedidoId && inputArea && inputArea.style.display !== 'none') chatView.classList.add('drag-active');
            }, false);
        });
        chatView.addEventListener('dragleave', e => {
            if (!chatView.contains(e.relatedTarget)) chatView.classList.remove('drag-active');
        }, false);
        chatView.addEventListener('drop', async (e) => {
            chatView.classList.remove('drag-active');
            const inputArea = document.querySelector(".chat-input-area");
            if (!currentPedidoId || !inputArea || inputArea.style.display === 'none') return;
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                try {
                    mostrarToast("Anexando imagem...", "success");
                    const base64Comprimido = await comprimirImagem(file, 800, 800, 0.7);
                    enviarNovaMensagemObjeto(chatInput.value.trim(), base64Comprimido);
                } catch (error) { mostrarToast("Erro ao processar o anexo.", "error"); }
            } else if (file) { mostrarToast("Por favor, solte apenas arquivos de imagem.", "error"); }
        }, false);
    }

    window.addEventListener('click', e => { if(e.target == modal) fecharChat() });

    // ================= HEADER E LOGOUT =================
    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;
        const fotoPerfil = usuarioAtual?.fotoPerfil || 'img/avatar_padrao.png';
        const primeiroNome = usuarioAtual.nome.split(' ')[0];
        const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        
        menu.innerHTML = `
            <a href="home.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html" class="active-nav">${textoPedidos}</a>
            <div class="profile-menu-container">
                <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                    <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                    <span>${primeiroNome}</span>
                </a>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="dashboard.html">Dashboard</a>
                    <a href="perfil.html">Meu Perfil</a>
                    <a href="configuracoes.html">Configurações</a>
                    <a href="#" onclick="logout(event)">Sair</a>
                </div>
            </div>
        `;
        
        const avatarMenuBtn = document.getElementById("avatarMenuBtn");
        if(avatarMenuBtn) {
            avatarMenuBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                document.getElementById("profileDropdown").classList.toggle("show-dropdown");
            });
        }

        window.addEventListener("click", function() {
            const dropdown = document.getElementById("profileDropdown");
            if (dropdown && dropdown.classList.contains("show-dropdown")) {
                dropdown.classList.remove("show-dropdown");
            }
        });
        
        if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
    }

    // A função de logout precisa estar no escopo global para o `onclick="logout(event)"` funcionar perfeitamente
    window.logout = function(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "index.html";
    }

    // ================= LÓGICA DE PAGAMENTO SIMULADO =================
    document.querySelectorAll('input[name="metodoPagamento"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'pix') {
                document.getElementById('areaPix').style.display = 'block';
                document.getElementById('areaCartao').style.display = 'none';
            } else {
                document.getElementById('areaPix').style.display = 'none';
                document.getElementById('areaCartao').style.display = 'block';
            }
        });
    });

    const btnConfirmarPag = document.getElementById('btnConfirmarPagamentoSimulado');
    if (btnConfirmarPag) {
        btnConfirmarPag.addEventListener('click', function() {
            const btn = this;
            setButtonLoading(btn);

            const metodoEscolhido = document.querySelector('input[name="metodoPagamento"]:checked').value;
            if (metodoEscolhido === 'cartao') {
                const numeroCartao = document.querySelector('#areaCartao input[placeholder="0000 0000 0000 0000"]').value;
                if (numeroCartao.length < 14) {
                    mostrarToast("Digite um número de cartão válido.", "error");
                    removeButtonLoading(btn);
                    return;
                }
            }

            setTimeout(async () => {
                if (currentPedidoId) {
                    const index = solicitacoes.findIndex(s => s.id == currentPedidoId);
                    if (index !== -1) {
                        solicitacoes[index].status = 'ACEITO';
                        solicitacoes[index].valorStatus = 'ACEITO';
                        solicitacoes[index].statusPagamento = 'RETIDO'; 
                        
                        try {
                            // 🚀 Aguarda o banco salvar a transação REAL antes de dar o ok visual
                            await API.atualizarSolicitacao(solicitacoes[index].id, solicitacoes[index]);
                            await enviarMensagemSistema(currentPedidoId, "💳 <strong>Pagamento Aprovado!</strong> O valor foi retido com segurança pela plataforma. O serviço já pode ser iniciado.");
                            
                            mostrarToast("Pagamento aprovado com sucesso!", "success");
                            document.getElementById('pagamentoModal').style.display = 'none';
                            setTimeout(() => location.reload(), 1000);
                        } catch (err) {
                            console.error(err);
                            mostrarToast("Erro ao processar o pagamento no banco de dados.", "error");
                        } finally {
                            removeButtonLoading(btn);
                        }
                    }
                }
            }, 1500);
        });
    }

    const modalPagamento = document.getElementById('pagamentoModal');
    window.addEventListener('click', (e) => {
        if (e.target === modalPagamento) {
            modalPagamento.style.display = 'none';
        }
    });

    // Inicia a renderização (Final)
    setupHeader();
    carregarPedidos();

    // 🚀 INICIA O POLLING DA LISTA DE PEDIDOS PARA ATUALIZAÇÕES EM TEMPO REAL
    setInterval(async () => {
        // Só atualiza se o chat não estiver aberto para não causar conflitos de renderização
        if (modal && modal.style.display === 'block') return;

        const novasSolicitacoes = await API.getSolicitacoes();
        if (novasSolicitacoes.length === 0) return;

        // Compara a lista nova com a antiga para ver se algo mudou
        let mudancaDetectada = false;
        if (novasSolicitacoes.length !== solicitacoes.length) {
            mudancaDetectada = true;
        } else {
            for (const novoPedido of novasSolicitacoes) {
                    // Usamos == para evitar falsos negativos entre String e Number
                    const pedidoAntigo = solicitacoes.find(p => p.id == novoPedido.id);
                if (!pedidoAntigo || 
                    pedidoAntigo.status !== novoPedido.status || 
                    pedidoAntigo.statusPagamento !== novoPedido.statusPagamento ||
                    pedidoAntigo.mensagensNaoLidas !== novoPedido.mensagensNaoLidas) { // 🚀 Atualiza se receber mensagem!
                    mudancaDetectada = true;
                    break;
                }
            }
        }

        if (mudancaDetectada) {
            solicitacoes = novasSolicitacoes;
            atualizarExibicaoPedidos();
        }
    }, 5000); // Verifica a cada 5 segundos
});

function formatarStatusBadge(pedido, emailLogado) {
    const status = pedido.status;
    const valorStatus = pedido.valorStatus || pedido.valor_status;
    const pEmail = pedido.prestadorEmail || pedido.prestador_email;
    const isPrestador = pEmail === emailLogado;
    
    let texto = status;
    let classe = `status-${status.toLowerCase()}`;

    if (status === 'PENDENTE') {
        if (valorStatus === 'PROPOSTO') {
            texto = isPrestador ? 'Orçamento Enviado' : 'Orçamento Recebido';
            classe = 'status-aguardando_confirmacao'; 
        } else {
            texto = 'Aguardando Resposta';
            classe = 'status-pendente'; 
        }
    } else if (status === 'ACEITO') {
        if (valorStatus === 'ACEITO') {
            texto = 'Em Andamento';
            classe = 'status-aceito'; 
        } else {
            texto = 'Serviço Aceito';
            classe = 'status-aceito';
        }
    } else if (status === 'AGUARDANDO_CONFIRMACAO') {
        texto = 'Aguardando Confirmação';
        classe = 'status-aguardando_confirmacao'; 
    } else if (status === 'CONCLUIDO') {
        texto = 'Serviço Concluído';
        classe = 'status-concluido'; 
    } else if (status === 'CANCELADO') {
        texto = 'Cancelado';
        classe = 'status-cancelado'; 
    }
    
    return `<span class="status ${classe}">${texto}</span>`;
}

function gerarTimelineHTML(pedido) {
    const { status } = pedido;

    if (status === 'CANCELADO') return `<div class="timeline-cancelled">Serviço Cancelado</div>`;

    const steps = [
        { id: 'solicitado', icon: '📝', label: 'Aguardando' },
        { id: 'orcamento', icon: '💲', label: 'Orçamento' },
        { id: 'pagamento', icon: '💳', label: 'Pagamento' },
        { id: 'andamento', icon: '🛠️', label: 'Em Andamento' },
        { id: 'finalizado', icon: '✅', label: 'Concluído' }
    ];

    let currentStepIndex = 0;

    if (status === 'PENDENTE') currentStepIndex = 1;
    else if (status === 'ACEITO') currentStepIndex = 3;
    else if (status === 'AGUARDANDO_CONFIRMACAO') currentStepIndex = 4;
    else if (status === 'CONCLUIDO') currentStepIndex = 5;
    
    return `<div class="status-timeline">${steps.map((step, index) => {
        let stepClass = index < currentStepIndex ? 'completed' : (index === currentStepIndex ? 'current' : 'future');
        if (currentStepIndex > steps.length - 1) stepClass = 'completed';
        return `
            <div class="timeline-step ${stepClass}">
                <div class="step-icon">${step.icon}</div>
                <span class="step-label">${step.label}</span>
            </div>
        `;
    }).join('')}</div>`;
}
