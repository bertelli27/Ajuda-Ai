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
    const negociacaoArea = document.getElementById("negociacao-area"); // A caixa interna
    const fecharOrcamentoBtn = document.getElementById("fechar-orcamento-btn");
    let currentPedidoId = null; // Para saber qual chat está aberto
    let focusableElements = [];
    let firstFocusableElement;
    let lastFocusableElement;

    // Variáveis de Paginação
    let currentPageEnviados = 1;
    let currentPageRecebidos = 1;
    const ITEMS_PER_PAGE = 6;

    // ================= LÓGICA DE EXIBIÇÃO (CLIENTE vs PRESTADOR) =================
    function carregarPedidos() {
        // Adiciona listeners de eventos aos controles de filtro e ordenação
        filtroStatusRecebidos.addEventListener('change', () => { currentPageRecebidos = 1; atualizarLista('recebidos'); });
        ordenarDataRecebidos.addEventListener('change', () => { currentPageRecebidos = 1; atualizarLista('recebidos'); });
        filtroStatusEnviados.addEventListener('change', () => { currentPageEnviados = 1; atualizarLista('enviados'); });
        ordenarDataEnviados.addEventListener('change', () => { currentPageEnviados = 1; atualizarLista('enviados'); });

        // Configuração das Abas (Contexto de Uso)
        const btnTabContratados = document.getElementById("btnTabContratados");
        const btnTabPrestados = document.getElementById("btnTabPrestados");

        if (usuarioAtual.tipo === 'prestador') {
            btnTabPrestados.style.display = 'block';

            btnTabContratados.addEventListener("click", () => {
                btnTabContratados.classList.add("active");
                btnTabPrestados.classList.remove("active");
                enviadosSection.style.display = "block";
                recebidosSection.style.display = "none";
            });

            btnTabPrestados.addEventListener("click", () => {
                btnTabPrestados.classList.add("active");
                btnTabContratados.classList.remove("active");
                recebidosSection.style.display = "block";
                enviadosSection.style.display = "none";
            });
        }

        // Carga inicial dos pedidos
        atualizarExibicaoPedidos();
    }

    function renderSkeletons(container, quantidade) {
        container.innerHTML = '';
        for (let i = 0; i < quantidade; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'pedido-card';
            skeletonCard.innerHTML = `
                <div class="skeleton skeleton-title" style="width: 70%; margin: 0 0 15px 0; height: 20px;"></div>
                <div class="skeleton skeleton-text" style="width: 90%; margin: 0 0 10px 0;"></div>
                <div class="skeleton skeleton-text" style="width: 60%; margin: 0 0 10px 0;"></div>
                <div class="skeleton skeleton-text" style="width: 40%; margin: 0 0 10px 0;"></div>
                <div class="skeleton skeleton-text" style="width: 30%; margin: 0 0 15px 0;"></div>
                <div class="botoes-acao">
                    <div class="skeleton skeleton-button" style="flex-grow: 1;"></div>
                    <div class="skeleton skeleton-button" style="flex-grow: 1;"></div>
                </div>
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
        const filtroStatus = isEnviados ? filtroStatusEnviados.value : filtroStatusRecebidos.value;
        const ordenarData = isEnviados ? ordenarDataEnviados.value : ordenarDataRecebidos.value;
        const currentPage = isEnviados ? currentPageEnviados : currentPageRecebidos;

        // Filtra e ordena síncrono para calcular paginação
        let pedidos = solicitacoes.filter(s => isEnviados ? s.clienteEmail === usuarioAtual.email : s.prestadorEmail === usuarioAtual.email);
        pedidos = aplicarFiltros(pedidos, filtroStatus, ordenarData);

        const totalItems = pedidos.length;
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedPedidos = pedidos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        // 1. Mostrar Skeletons na quantidade exata de itens que vão renderizar (evita pulos)
        const numSkeletons = paginatedPedidos.length > 0 ? paginatedPedidos.length : 1;
        renderSkeletons(container, numSkeletons);

        // Renderiza a paginação imediatamente
        renderPaginacao(totalItems, currentPage, ITEMS_PER_PAGE, isEnviados ? 'paginacao-enviados' : 'paginacao-recebidos', (newPage) => {
            if (isEnviados) currentPageEnviados = newPage;
            else currentPageRecebidos = newPage;
            atualizarLista(tipo);
        });

        // 2. Simular carregamento rápido e renderizar dados reais
        setTimeout(() => {
            const avaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];
            if (isEnviados) {
                renderPedidosCliente(paginatedPedidos, container, avaliacoes);
            } else {
                renderPedidosPrestador(paginatedPedidos, container);
            }
        }, 500); 
    }

    function renderPaginacao(totalItems, currentPage, itemsPerPage, containerId, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = ''; // Não exibe setas se houver apenas 1 página
            return;
        }
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

    function renderPedidosCliente(pedidos, container, avaliacoes) {
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-up-animation">
                    <div class="empty-state-icon">📝</div>
                    <p>Você ainda não fez nenhuma solicitação de serviço.</p>
                    <button class="btn-service" style="margin-top: 20px; width: auto; padding: 10px 25px;" onclick="window.location.href='servicos.html'">Buscar Serviços</button>
                </div>`;
            return;
        }
        const mensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        container.innerHTML = pedidos.map(pedido => {
            const prestador = usuarios.find(u => u.email === pedido.prestadorEmail);
            const naoLidas = mensagens.filter(m => m.id_solicitacao === pedido.id && m.remetenteEmail !== emailLogado && !m.lida).length;
            const badgeHTML = naoLidas > 0 ? `<span class="notificacao-badge" style="top: -8px; right: -8px;">${naoLidas}</span>` : '';
            const valorFormatado = pedido.valorCombinado ? `R$ ${parseFloat(pedido.valorCombinado).toFixed(2).replace('.', ',')}` : 'A combinar';
            const statusBadgeHTML = formatarStatusBadge(pedido);
            const timelineHTML = gerarTimelineHTML(pedido);
            const textoBotaoChat = pedido.status === 'CANCELADO' ? 'Ver Histórico' : 'Ver Conversa';
            const statusPagamento = pedido.statusPagamento || 'Pendente';

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
                    <p><strong>Prestador:</strong> ${prestador ? prestador.nome : 'Não encontrado'}</p>
                    ${timelineHTML}
                    <div class="card-details">
                        <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                        <p><strong>Valor:</strong> ${valorFormatado}</p>
                        <p><strong>Pagamento:</strong> <span style="color: ${statusPagamento === 'RETIDO' ? '#f0ad4e' : statusPagamento === 'LIBERADO' ? '#5cb85c' : '#AAAAAA'};">${statusPagamento.replace('_', ' ')}</span></p>
                        ${avaliacaoInfoHTML}
                    </div>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">${textoBotaoChat}${badgeHTML}</button>
                        ${pedido.status === 'PENDENTE' ? `<button class="btn-acao cancelar" data-pedido-id="${pedido.id}">Cancelar Solicitação</button>` : ''}
                        ${pedido.status === 'AGUARDANDO_CONFIRMACAO' ? `<button class="btn-acao confirmar-conclusao" data-pedido-id="${pedido.id}">Confirmar Conclusão</button>` : ''}
                        ${(pedido.status === 'CONCLUIDO' && !pedido.avaliado) ? `<button class="btn-acao btn-avaliar" data-pedido-id="${pedido.id}">Avaliar Serviço</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderPedidosPrestador(pedidos, container) {
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-up-animation">
                    <div class="empty-state-icon">📭</div>
                    <p>Você ainda não recebeu nenhuma solicitação de serviço.</p>
                </div>`;
            return;
        }
        const mensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        container.innerHTML = pedidos.map(pedido => {
            const cliente = usuarios.find(u => u.email === pedido.clienteEmail);
            const naoLidas = mensagens.filter(m => m.id_solicitacao === pedido.id && m.remetenteEmail !== emailLogado && !m.lida).length;
            const badgeHTML = naoLidas > 0 ? `<span class="notificacao-badge" style="top: -8px; right: -8px;">${naoLidas}</span>` : '';
            const valorFormatado = pedido.valorCombinado ? `R$ ${parseFloat(pedido.valorCombinado).toFixed(2).replace('.', ',')}` : 'A combinar';
            const statusBadgeHTML = formatarStatusBadge(pedido);
            const timelineHTML = gerarTimelineHTML(pedido);
            const textoBotaoChat = pedido.status === 'CANCELADO' ? 'Ver Histórico' : 'Ver Conversa';
            const statusPagamento = pedido.statusPagamento || 'Pendente';
            
            return `
                <div class="pedido-card">
                    <div class="card-header">
                        <h3>Solicitação de ${cliente ? cliente.nome.split(' ')[0] : 'Cliente'}</h3>
                        ${statusBadgeHTML}
                    </div>
                    <p><strong>Serviço:</strong> ${pedido.servico}</p>
                    ${timelineHTML}
                    <div class="card-details">
                        <p><strong>Descrição:</strong> ${pedido.descricao}</p>
                        <p><strong>Endereço:</strong> ${pedido.enderecoRealizacao}</p>
                        <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                        <p><strong>Valor:</strong> ${valorFormatado}</p>
                        <p><strong>Pagamento:</strong> <span style="color: ${statusPagamento === 'RETIDO' ? '#f0ad4e' : statusPagamento === 'LIBERADO' ? '#5cb85c' : '#AAAAAA'};">${statusPagamento.replace('_', ' ')}</span></p>
                    </div>
                    <div class="botoes-acao">
                        <button class="btn-acao btn-chat" data-pedido-id="${pedido.id}" style="position: relative;">${textoBotaoChat}${badgeHTML}</button>
                        ${(pedido.status === 'PENDENTE' && pedido.valorStatus !== 'PROPOSTO') ? `
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
        else if (target.classList.contains('cancelar')) novoStatus = 'CANCELADO';
        else if (target.classList.contains('concluir')) novoStatus = 'AGUARDANDO_CONFIRMACAO';
        else if (target.classList.contains('confirmar-conclusao')) novoStatus = 'CONCLUIDO';
        
        if (novoStatus) {
            const index = solicitacoes.findIndex(s => s.id === pedidoId);
            if (index !== -1) {
                const pedidoModificado = solicitacoes[index];
                
                // LOGICA FINANCEIRA
                const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
                const txIndex = transacoes.findIndex(t => t.servicoId === pedidoModificado.id);
                
                if (novoStatus === 'CANCELADO' && pedidoModificado.statusPagamento === 'RETIDO') {
                    pedidoModificado.statusPagamento = 'ESTORNADO';
                    // Atualiza o status da transação existente para 'CANCELADO'
                    if (txIndex !== -1) transacoes[txIndex].status = 'CANCELADO';
                }
                
                if (novoStatus === 'CONCLUIDO' && pedidoModificado.statusPagamento === 'RETIDO') {
                    pedidoModificado.statusPagamento = 'LIBERADO';
                    // Atualiza o status da transação existente para 'CONCLUIDO'
                    if (txIndex !== -1) transacoes[txIndex].status = 'CONCLUIDO';
                }
                
                localStorage.setItem('transacoes', JSON.stringify(transacoes));
                
                solicitacoes[index] = pedidoModificado;
                solicitacoes[index].status = novoStatus;
                localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));

                if (novoStatus === 'AGUARDANDO_CONFIRMACAO') {
                    enviarMensagemSistema(pedidoId, "🛠️ <strong>Serviço finalizado pelo prestador.</strong> Aguardando o cliente confirmar a conclusão para liberar o pagamento.");
                } else if (novoStatus === 'CONCLUIDO') {
                    enviarMensagemSistema(pedidoId, "✅ <strong>Conclusão confirmada pelo cliente.</strong> O pagamento foi liberado para o prestador.");
                } else if (target.classList.contains('cancelar') && novoStatus === 'CANCELADO') {
                    enviarMensagemSistema(pedidoId, "🚫 <strong>Solicitação cancelada.</strong> O valor pago foi estornado.");
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

        fecharOrcamento(); // Garante que o orçamento comece fechado
        atualizarAreaNegociacao();

        // Arquivar chat se estiver cancelado ou concluído (esconder área de digitação)
        const chatInputArea = document.querySelector(".chat-input-area");
        if (pedido.status === 'CANCELADO' || pedido.status === 'CONCLUIDO') {
            chatInputArea.style.display = 'none';
        } else {
            chatInputArea.style.display = 'flex';
        }

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
        // Ativa o Modo Foco
        document.body.classList.add('focus-mode-active');

        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        // --- NOVO: Lógica de Acessibilidade (Foco) ---
        // Pega todos os elementos focáveis dentro do modal
        focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusableElement = focusableElements[0]; // Geralmente o botão de fechar 'X'
        lastFocusableElement = focusableElements[focusableElements.length - 1];

        // Move o foco para o primeiro elemento (o botão de fechar)
        setTimeout(() => firstFocusableElement.focus(), 100); // Pequeno delay para garantir a renderização

        // Adiciona o listener para o trap de foco
        modal.addEventListener('keydown', trapFocus);
    }

    function atualizarAreaNegociacao() {
        const area = document.getElementById("negociacao-area");
        if (!area || !currentPedidoId) return;

        const pedido = solicitacoes.find(s => s.id === currentPedidoId);
        if (!pedido) return;
        
        // Se estiver cancelado ou concluído, limpa a negociação e mostra aviso de arquivado
        if (pedido.status === 'CANCELADO') {
            area.innerHTML = `<div style="text-align: center; color: #d9534f; font-weight: bold; padding: 20px;">🚫 Solicitação cancelada. O chat foi arquivado.</div>`;
            return;
        } else if (pedido.status === 'CONCLUIDO') {
            area.innerHTML = `<div style="text-align: center; color: #007bff; font-weight: bold; padding: 20px;">✅ Serviço concluído. O chat foi arquivado.</div>`;
            return;
        }

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
                    <div class="orcamento-details">
                        <div class="orcamento-highlight" style="border-left-color: #5cb85c; background: rgba(92, 184, 92, 0.1);">
                            <span>Valor Combinado:</span>
                            <strong style="color: #5cb85c;">${valorFormatado} (Aceito pelo Cliente)</strong>
                        </div>
                        ${dataHoraFormatada ? `<div class="orcamento-info">${dataHoraFormatada}</div>` : ''}
                        <div class="orcamento-desc">
                            <strong>Escopo do Serviço:</strong>
                            <p style="white-space: pre-wrap; margin-top: 5px; color: #CCCCCC;">${descricaoProposta}</p>
                        </div>
                    </div>
                `;
            } else {
                html = `
                    <div class="orcamento-form">
                        <div class="form-group-row">
                            <div class="form-group">
                                <label>Orçamento (R$)</label>
                                <input type="text" id="inputValorNegociado" value="${pedido.valorCombinado ? formatarMoedaParaMascara(pedido.valorCombinado) : ''}" placeholder="R$ 0,00">
                            </div>
                        </div>
                        <div class="form-group-row">
                            <div class="form-group">
                                <label>Data Sugerida</label>
                                <input type="date" id="inputDataProposta" value="${pedido.dataProposta || ''}">
                            </div>
                            <div class="form-group">
                                <label>Horário Sugerido</label>
                                <input type="time" id="inputHoraProposta" value="${pedido.horaProposta || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Descrição do Serviço / Inclusões</label>
                            <textarea id="textareaDescricaoProposta" placeholder="Descreva o que está incluso no valor (ex: material, mão de obra...).">${descricaoProposta}</textarea>
                        </div>
                        <button id="btnEnviarProposta" class="btn-service" style="width: 100%;">Enviar Proposta</button>
                        ${pedido.valorStatus === 'PROPOSTO' ? '<div style="color: #f0ad4e; font-size: 13px; text-align: center; margin-top: 10px;">Aguardando aprovação do cliente...</div>' : ''}
                    </div>
                `;
            }
        } else {
            // Cliente
            if (pedido.valorStatus === 'ACEITO') {
                html = `
                    <div class="orcamento-details">
                        <div class="orcamento-highlight" style="border-left-color: #5cb85c; background: rgba(92, 184, 92, 0.1);">
                            <span>Valor Combinado:</span>
                            <strong style="color: #5cb85c;">${valorFormatado} (Aceito)</strong>
                        </div>
                        ${dataHoraFormatada ? `<div class="orcamento-info">${dataHoraFormatada}</div>` : ''}
                        <div class="orcamento-desc">
                            <strong>Escopo do Serviço:</strong>
                            <p style="white-space: pre-wrap; margin-top: 5px; color: #CCCCCC;">${descricaoProposta}</p>
                        </div>
                    </div>
                `;
            } else if (pedido.valorStatus === 'PROPOSTO') {
                html = `
                    <div class="orcamento-details">
                        <div class="orcamento-highlight" style="border-left-color: #f0ad4e; background: rgba(240, 173, 78, 0.1);">
                            <span>Proposta do Prestador:</span>
                            <strong style="color: #f0ad4e;">${valorFormatado}</strong>
                        </div>
                        ${dataHoraFormatada ? `<div class="orcamento-info">${dataHoraFormatada}</div>` : ''}
                        <div class="orcamento-desc">
                            <strong>Escopo do Serviço Proposto:</strong>
                            <p style="white-space: pre-wrap; margin-top: 5px; color: #CCCCCC;">${descricaoProposta}</p>
                        </div>
                        <button id="btnAceitarProposta" class="btn-aceitar-orcamento">Aceitar Proposta</button>
                    </div>
                `;
            } else {
                html = `<div style="text-align: center; color: #AAAAAA; padding: 20px;">Aguardando orçamento do prestador...</div>`;
            }
        }
        
        area.innerHTML = html;
        
        // Aplica a máscara no input gerado
        aplicarMascaraDinheiro(document.getElementById("inputValorNegociado"));

        // Adicionar eventos aos botões recém renderizados
        if (isPrestador && pedido.valorStatus !== 'ACEITO') {

            document.getElementById("btnEnviarProposta")?.addEventListener("click", () => {
                const novoValorStr = document.getElementById("inputValorNegociado").value;
                const novoValor = limparMascaraDinheiro(novoValorStr);
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
                setTimeout(fecharOrcamento, 500); // Fecha a caixa de orçamento automaticamente
            });
        } else if (!isPrestador && pedido.valorStatus === 'PROPOSTO') {
            document.getElementById("btnAceitarProposta")?.addEventListener("click", () => {
                // Envia para o Checkout (Pagamento)
                window.location.href = `pagamento.html?pedido=${pedido.id}`;
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

    function abrirOrcamento() {
        if (orcamentoOverlay) orcamentoOverlay.style.display = 'flex';
        if (chatView) chatView.classList.add('blurred');
    }

    function fecharChat() {
        modal.style.display = "none";
        // Desativa o Modo Foco
        document.body.classList.remove('focus-mode-active');

        currentPedidoId = null;
        chatMessagesContainer.innerHTML = "";
        fecharOrcamento(); // Garante que o overlay do orçamento feche junto com o chat

        // --- NOVO: Remove o listener ao fechar ---
        modal.removeEventListener('keydown', trapFocus);
    }

    function fecharOrcamento() {
        if (orcamentoOverlay) orcamentoOverlay.style.display = 'none';
        if (chatView) chatView.classList.remove('blurred');
    }

    function renderMensagens(pedidoId) {
        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        const mensagensDoPedido = todasMensagens.filter(m => m.id_solicitacao === pedidoId);

        chatMessagesContainer.innerHTML = mensagensDoPedido.map(msg => {
            if (msg.remetenteEmail === "SISTEMA") {
                return `<div class="message system">${msg.mensagem}</div>`;
            }
            const classe = msg.remetenteEmail === emailLogado ? 'sent' : 'received';
            
            let conteudo = msg.mensagem ? `<div>${msg.mensagem}</div>` : '';
            if (msg.imagemBase64) {
                conteudo += `<img src="${msg.imagemBase64}" alt="Anexo" class="chat-image" onclick="window.open('${msg.imagemBase64}', '_blank')">`;
            }
            
            return `<div class="message ${classe}">${conteudo}</div>`;
        }).join('');
    }

    function enviarNovaMensagemObjeto(texto, imagemBase64 = null) {
        const novaMensagem = {
            id_mensagem: "MSG-" + Date.now(),
            id_solicitacao: currentPedidoId,
            remetenteEmail: emailLogado,
            mensagem: texto,
            imagemBase64: imagemBase64,
            data_envio: new Date().toISOString(),
            lida: false
        };

        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        todasMensagens.push(novaMensagem);
        localStorage.setItem("mensagens", JSON.stringify(todasMensagens));

        chatInput.value = "";
        if (chatImageInput) chatImageInput.value = ""; // Limpa o input de arquivo
        renderMensagens(currentPedidoId);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    function enviarMensagem() {
        const texto = chatInput.value.trim();
        if (!texto && !currentPedidoId) return;
        
        if (texto) {
            enviarNovaMensagemObjeto(texto);
        }
    }

    // --- NOVO: Função para o Focus Trap do Modal ---
    function trapFocus(e) {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
        if (!isTabPressed) {
            // Se a tecla for ESC, fecha o modal
            if (e.key === 'Escape' || e.keyCode === 27) {
                fecharChat();
            }
            return;
        }

        if (e.shiftKey) { // Shift + Tab (voltando)
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else { // Tab (avançando)
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }

    // Event Listeners para o Chat
    closeModalBtn.addEventListener('click', fecharChat);
    chatSendBtn.addEventListener('click', enviarMensagem);
    chatInput.addEventListener('keypress', e => e.key === 'Enter' && enviarMensagem());
    
    // Botão para exibir/ocultar a caixa de Orçamento no chat
    if (btnToggleOrcamento) {
        btnToggleOrcamento.addEventListener('click', () => {
            if (orcamentoOverlay.style.display === 'none' || orcamentoOverlay.style.display === '') {
                abrirOrcamento();
            } else {
                fecharOrcamento();
            }
        });
    }

    // Botão X dentro do orçamento
    if (fecharOrcamentoBtn) {
        fecharOrcamentoBtn.addEventListener('click', fecharOrcamento);
    }

    // Fecha o orçamento se clicar no fundo (overlay)
    if (orcamentoOverlay) {
        orcamentoOverlay.addEventListener('click', function(e) {
            if (e.target === orcamentoOverlay) { // Garante que o clique foi no fundo, não na caixa
                fecharOrcamento();
            }
        });
    }

    // Envio de Imagem
    if (chatImageInput) {
        chatImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file || !currentPedidoId) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                enviarNovaMensagemObjeto(chatInput.value.trim(), base64);
            };
            reader.readAsDataURL(file);
        });
    }

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
        const primeiroNome = usuarioAtual.nome.split(' ')[0];
        const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        menu.innerHTML = `
            <a href="home.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html" class="active-nav">${textoPedidos}</a>
            <div class="profile-menu-container">
                <a href="#" id="avatarMenuBtn" class="menu-avatar-link" title="Opções da Conta">
                    <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                    <span>${primeiroNome}</span>
                </a>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="dashboard.html">Dashboard</a>
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

function formatarStatusBadge(pedido) {
    const { status, valorStatus } = pedido;
    let texto = status;
    let classe = `status-${status.toLowerCase()}`;

    if (status === 'PENDENTE') {
        if (valorStatus === 'PROPOSTO') {
            texto = 'Orçamento Enviado';
            classe = 'status-aguardando_confirmacao'; // Reusing a blueish color
        } else {
            texto = 'Aguardando Orçamento';
            classe = 'status-pendente'; // Orange
        }
    } else if (status === 'ACEITO') {
        texto = 'Em Andamento';
        classe = 'status-aceito'; // Green
    } else if (status === 'AGUARDANDO_CONFIRMACAO') {
        texto = 'Aguardando Confirmação';
        classe = 'status-aguardando_confirmacao'; // Blueish
    } else if (status === 'CONCLUIDO') {
        texto = 'Finalizado';
        classe = 'status-concluido'; // Blue
    } else if (status === 'CANCELADO') {
        texto = 'Cancelado';
        classe = 'status-cancelado'; // Red
    }
    
    return `<span class="status ${classe}">${texto}</span>`;
}

function gerarTimelineHTML(pedido) {
    const { status } = pedido;

    if (status === 'CANCELADO') {
        return `<div class="timeline-cancelled">Serviço Cancelado</div>`;
    }

    const steps = [
        { id: 'solicitado', icon: '📝', label: 'Solicitado' },
        { id: 'orcamento', icon: '💲', label: 'Orçamento' },
        { id: 'pagamento', icon: '💳', label: 'Pagamento' },
        { id: 'andamento', icon: '🛠️', label: 'Em Andamento' },
        { id: 'finalizado', icon: '✅', label: 'Finalizado' }
    ];

    let currentStepIndex = 0;

    if (status === 'PENDENTE') currentStepIndex = 1; // Orçamento
    else if (status === 'ACEITO') currentStepIndex = 3; // Em Andamento
    else if (status === 'AGUARDANDO_CONFIRMACAO') currentStepIndex = 4; // Finalizado
    else if (status === 'CONCLUIDO') currentStepIndex = 5; // Todos completos
    
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