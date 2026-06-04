document.addEventListener("DOMContentLoaded", function() {

    // ================= MENU DINÂMICO E LOGOUT =================
    async function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;

        const emailLogado = API.getSessaoAtual();

        if (emailLogado) {
            const usuarios = await API.getUsuarios();
            const usuarioLogado = usuarios.find(u => u.email === emailLogado);
            const fotoPerfil = usuarioLogado?.fotoPerfil || '../img/avatar_padrao.png';
            const primeiroNome = usuarioLogado.nome.split(' ')[0];
            const textoPedidos = usuarioLogado.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
            // Usuário Logado
            menu.innerHTML = `
                <a href="index.html">Início</a>
                <a href="servicos.html" class="active-nav">Serviços</a>
                ${usuarioLogado.tipo !== 'admin' ? `<a href="pedidos.html">${textoPedidos}</a>` : ''}
                <div class="profile-menu-container">
                    <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                        <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                        <span>${primeiroNome}</span>
                    </a>
                    <div class="profile-dropdown" id="profileDropdown">
                        ${usuarioLogado.tipo === 'admin' ? '<a href="admin.html" style="color: #d9534f; font-weight: bold;">👑 Painel Admin</a>' : ''}
                        ${usuarioLogado.tipo !== 'admin' ? `<a href="dashboard.html">Dashboard</a>` : ''}
                        <a href="perfil.html">Meu Perfil</a>
                        <a href="configuracoes.html">Configurações</a>
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
        } else {
            // Usuário Deslogado
            menu.innerHTML = `
                <a href="index.html">Início</a>
                <a href="servicos.html" class="active-nav">Serviços</a>
                <a href="login.html">Entrar</a>
                <a href="register.html">Cadastrar</a>
            `;
        }
    }

    function logout(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "login.html";
    }

    // ================= VARIÁVEIS DE PAGINAÇÃO =================
    let currentPage = 1;
    const ITEMS_PER_PAGE = 6;

    // ================= CARREGAR SERVIÇOS =================
    async function carregarServicos(categoriaFiltro = "Todos", termoBusca = "") {
        const grid = document.querySelector(".services-grid");
        const emailLogado = API.getSessaoAtual();
        if (!grid) return;

        grid.innerHTML = '';
        for (let i = 0; i < ITEMS_PER_PAGE; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'service-card';
            skeletonCard.innerHTML = `
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-title" style="width: 40%; margin-bottom: 15px;"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 50%;"></div>
                <div class="skeleton skeleton-text" style="width: 70%;"></div>
                <div class="card-botoes" style="margin-top: 20px;">
                    <div class="skeleton skeleton-button" style="flex-grow: 1;"></div>
                    <div class="skeleton skeleton-button" style="flex-grow: 1;"></div>
                </div>
            `;
            grid.appendChild(skeletonCard);
        }

        setTimeout(async () => {
            const todosServicos = await API.getServicos();
            const usuarios = await API.getUsuarios();
            const avaliacoes = await API.getAvaliacoes();

            const usuarioLogadoObj = usuarios.find(u => u.email === emailLogado);
            const isAdmin = usuarioLogadoObj && usuarioLogadoObj.tipo === 'admin';

            let servicosFiltrados = todosServicos.filter(s => {
                const prestador = usuarios.find(u => u.email === s.prestadorEmail);
                return prestador && prestador.tipo === 'prestador';
            });

            // 1. Filtro de categoria
            if (categoriaFiltro !== "Todos") {
                servicosFiltrados = servicosFiltrados.filter(s => s.categoria === categoriaFiltro);
            }

            // 2. Filtro de busca
            if (termoBusca) {
                servicosFiltrados = servicosFiltrados.filter(s => {
                    const prestador = usuarios.find(u => u.email === s.prestadorEmail);
                    const textoCard = `${s.titulo} ${s.categoria} ${s.descricao} ${prestador?.nome} ${prestador?.endereco.cidade}`.toLowerCase();
                    return textoCard.includes(termoBusca);
                });
            }

            // 3. Paginação
            const totalItems = servicosFiltrados.length;
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const paginatedServicos = servicosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            grid.innerHTML = ''; // Limpa os skeletons

            if (paginatedServicos.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state fade-up-animation">
                        <div class="empty-state-icon">🔍</div>
                        <p>Nenhum prestador encontrado com estes critérios.</p>
                    </div>`;
            } else {
                paginatedServicos.forEach(servico => {
                    const prestador = usuarios.find(u => u.email === servico.prestadorEmail);
                    const isSelf = prestador?.email === emailLogado;
                    if (prestador) renderizarCard(servico, prestador, avaliacoes, grid, isSelf, isAdmin);
                });
            }

            renderPaginacao(totalItems, currentPage, ITEMS_PER_PAGE, 'paginacao-servicos', (newPage) => {
                currentPage = newPage;
                carregarServicos(categoriaFiltro, termoBusca);
            });

        }, 1500);
    }

    function renderizarCard(servico, prestador, avaliacoes, grid, isSelf, isAdmin) {
            const card = document.createElement('div');
            card.className = 'service-card';

        // 🚀 USA A MÉDIA PONDERADA REAL VINDA DIRETO DO BANCO DE DADOS!
        let mediaEstrelas = 'Novo';
        if (servico.totalAvaliacoes > 0) {
            mediaEstrelas = `★ ${parseFloat(servico.mediaAvaliacao).toFixed(1)}`;
        }

        card.innerHTML = `
                <img src="${prestador.fotoPerfil || '../img/avatar_padrao.png'}" alt="Foto de ${prestador.nome}" class="card-avatar">
                <span style="font-size: 12px; background: #00ADB5; color: #222A31; padding: 3px 8px; border-radius: 10px; font-weight: bold; display: inline-block; margin-bottom: 10px;">${servico.categoria}</span>
                <h3>${servico.titulo}</h3>
                <p><strong>Prestador:</strong> ${prestador.nome}</p>
                <p><strong>Avaliação do Serviço:</strong> <span class="rating-display">${mediaEstrelas}</span> (${servico.totalAvaliacoes})</p>
                <p><strong>Descrição:</strong> ${servico.descricao || 'Sem descrição.'}</p>
                <p><strong>Cidade:</strong> ${prestador.endereco.cidade} - ${prestador.endereco.estado}</p>
                <div class="card-botoes">
                    <button class="btn-ver-perfil" data-email-prestador="${prestador.email}">Ver Perfil</button>
                    ${isAdmin 
                        ? `<button class="btn-acao recusar btn-remover-servico" data-servico-id="${servico.id}" style="padding: 12px 15px;">Remover Serviço</button>` 
                        : (!isSelf ? `<button class="btn-service" data-servico-id="${servico.id}">Solicitar</button>` : '')}
                </div>
            `;
        grid.appendChild(card);
    }

    function renderPaginacao(totalItems, currentPage, itemsPerPage, containerId, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = '';
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

    // ================= CONFIGURAR BOTÕES DE SOLICITAÇÃO =================
    function configurarBotoesSolicitacao() {
        const grid = document.querySelector(".services-grid");
        if (!grid) return;

        grid.addEventListener("click", function(e) {
            if (e.target && e.target.classList.contains('btn-remover-servico')) {
                const servicoId = e.target.getAttribute('data-servico-id');
                if(confirm("👑 MODO ADMIN:\nTem certeza que deseja excluir este serviço permanentemente da plataforma? Esta ação será registrada.")) {
                    const btn = e.target;
                    const originalText = btn.innerText;
                    btn.innerText = "Excluindo...";
                    btn.disabled = true;
                    API.excluirServico(servicoId).then(() => {
                        mostrarToast("Serviço removido com sucesso.", "success");
                        const searchTerm = document.getElementById("searchInput")?.value || "";
                        const category = document.querySelector('.btn-categoria.active')?.getAttribute('data-cat') || 'Todos';
                        carregarServicos(category, searchTerm);
                    }).catch(err => {
                        mostrarToast("Erro ao excluir serviço.", "error");
                        btn.innerText = originalText;
                        btn.disabled = false;
                    });
                }
                return;
            }
            if (e.target && e.target.classList.contains('btn-service')) {
                const emailLogado = API.getSessaoAtual();

                if (!emailLogado) {
                    mostrarToast("Você precisa fazer login para solicitar um serviço!", "error");
                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 1500);
                } else {
                    const servicoId = e.target.getAttribute('data-servico-id');
                    window.location.href = `solicitar.html?servicoId=${servicoId}`;
                }
            }
            if (e.target && e.target.classList.contains('btn-ver-perfil')) {
                const prestadorEmail = e.target.getAttribute('data-email-prestador');
                window.location.href = `perfil.html?usuario=${encodeURIComponent(prestadorEmail)}`;
                }
            });
        }

    // ================= CONFIGURAR BUSCA =================
    let searchDebounceTimer; // Variável para controlar o debounce
    function configurarBusca() {
        const btn = document.getElementById("searchBtn");
        const searchInput = document.getElementById("searchInput");
        if (!btn || !searchInput) return;

        function executarBusca() {
            // Cancela qualquer debounce pendente se uma busca explícita for acionada
            clearTimeout(searchDebounceTimer); 
            currentPage = 1; // Reseta a página para a primeira
            const termo = searchInput.value.toLowerCase();
            const categoriaAtiva = document.querySelector('.btn-categoria.active')?.getAttribute('data-cat') || 'Todos';
            carregarServicos(categoriaAtiva, termo);
        }

        // Evento de input com debounce para busca em tempo real
        searchInput.addEventListener("input", () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(executarBusca, 500); // Espera 500ms depois que o usuário para de digitar
        });

        btn.addEventListener("click", executarBusca);
    }

    // ================= CONFIGURAR FILTROS DE CATEGORIA =================
    function configurarFiltrosCategoria() {
        const botoesCategoria = document.querySelectorAll('.btn-categoria');
        botoesCategoria.forEach(btn => {
            btn.addEventListener('click', (e) => {
                botoesCategoria.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                currentPage = 1; // Reseta a página
                const categoria = e.target.getAttribute('data-cat');
                const termoBusca = document.getElementById("searchInput").value.toLowerCase();
                carregarServicos(categoria, termoBusca);
            });
        });
    }

    // ================= ASSISTENTE INTELIGENTE =================
    let ultimaAnaliseIA = null;

    function renderizarResultadoIA(analise) {
        const iaResultado = document.getElementById("ia-resultado");
        const iaCategoriaTexto = document.getElementById("ia-categoria-texto");
        const iaExplicacao = document.getElementById("ia-explicacao");
        const iaLista = document.getElementById("ia-profissionais-lista");
        const iaOrientacao = document.getElementById("ia-orientacao");

        if (!iaResultado || !iaCategoriaTexto || !iaLista) return;

        iaCategoriaTexto.innerText = analise.categoriaPrincipal;
        if (iaExplicacao) iaExplicacao.innerText = analise.explicacao;

        if (iaOrientacao) {
            if (analise.mensagemOrientacao) {
                iaOrientacao.innerText = analise.mensagemOrientacao;
                iaOrientacao.style.display = "block";
            } else {
                iaOrientacao.style.display = "none";
                iaOrientacao.innerText = "";
            }
        }

        let html = "";

        const catalogo = analise.sugestoesCatalogo || [];
        const mostrarCatalogo = catalogo.length > 0 &&
            (analise.tipoCorrespondencia === "catalogo" || analise.tipoCorrespondencia === "misto" || analise.semPrestadoresDisponiveis);

        if (mostrarCatalogo) {
            html += `<li style="list-style: none; margin-bottom: 10px; font-size: 13px; color: #00ADB5; font-weight: 600;">Profissão sugerida (com base no que você escreveu)</li>`;
            html += catalogo.map((prof) => `
                <li style="background: rgba(0, 173, 181, 0.12); border: 1px solid rgba(0, 173, 181, 0.35); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;">
                    <strong style="color: #EEEEEE;">${prof.nome}</strong>
                    <span style="color: #ffc107; font-size: 12px; margin-left: 8px;">Perfil indicado · ${prof.confianca}%</span>
                    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.85;">${prof.descricao}</p>
                    ${prof.termosRelevantes?.length ? `<p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.65;">Termos: ${prof.termosRelevantes.join(", ")}</p>` : ""}
                </li>
            `).join("");
        }

        const prestadores = analise.profissionais || [];
        if (prestadores.length > 0) {
            if (mostrarCatalogo) {
                html += `<li style="list-style: none; margin: 14px 0 10px; font-size: 13px; color: #AAAAAA; font-weight: 600;">Prestadores cadastrados na plataforma</li>`;
            }
            html += prestadores.map((prof) => `
                <li style="background: rgba(34, 42, 49, 0.5); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;">
                    <strong style="color: #EEEEEE;">${prof.nome}</strong>
                    <span style="color: #00ADB5; font-size: 12px; margin-left: 8px;">${prof.confianca}% de compatibilidade</span>
                    ${prof.baixaCorrespondencia ? `<span style="color: #ffc107; font-size: 11px; margin-left: 6px;">(correspondência parcial)</span>` : ""}
                    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.8;">${prof.descricao}</p>
                </li>
            `).join("");
        }

        if (!html) {
            html = `<li style="color: #AAAAAA; font-size: 14px;">Não foi possível identificar uma profissão. Descreva o problema com mais detalhes (o que aconteceu, onde, urgência).</li>`;
        }

        iaLista.innerHTML = html;
        iaResultado.style.display = "block";
    }

    function configurarIA() {
        const btnSugerir = document.getElementById("btnSugerirServico");
        const inputDescricao = document.getElementById("ia-descricao-problema");
        const iaResultado = document.getElementById("ia-resultado");
        const btnUsarSugestao = document.getElementById("btnUsarSugestao");

        if (!btnSugerir || !inputDescricao) return;

        btnSugerir.addEventListener("click", async () => {
            const texto = inputDescricao.value.trim();
            if (!texto) {
                mostrarToast("Descreva seu problema no assistente primeiro.", "error");
                return;
            }

            btnSugerir.innerHTML = "⏳ Analisando...";
            btnSugerir.disabled = true;

            try {
                const analise = await API.analisarProblema(texto);
                ultimaAnaliseIA = analise;
                renderizarResultadoIA(analise);
            } catch (e) {
                mostrarToast(e.message || "Erro ao analisar o problema.", "error");
            } finally {
                btnSugerir.innerHTML = "Analisar Problema";
                btnSugerir.disabled = false;
            }
        });

        inputDescricao.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                btnSugerir.click();
            }
        });

        btnUsarSugestao?.addEventListener("click", () => {
            if (!ultimaAnaliseIA) return;

            const categoriaSugerida = ultimaAnaliseIA.categoriaPrincipal;
            const fonteBusca = (ultimaAnaliseIA.tipoCorrespondencia === "catalogo" || !ultimaAnaliseIA.profissionais?.length)
                ? (ultimaAnaliseIA.sugestoesCatalogo || [])
                : ultimaAnaliseIA.profissionais;
            const termosBusca = fonteBusca
                .map((p) => p.nome.split(" ")[0].toLowerCase())
                .join(" ");
            const nomesProfissionais = fonteBusca.map((p) => p.nome).join(", ");

            document.querySelectorAll('.btn-categoria').forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-cat') === categoriaSugerida) {
                    b.classList.add('active');
                }
            });

            currentPage = 1;
            const searchInput = document.getElementById("searchInput");
            if (searchInput) searchInput.value = termosBusca;
            carregarServicos(categoriaSugerida, termosBusca);

            iaResultado.style.display = "none";
            inputDescricao.value = "";
            ultimaAnaliseIA = null;

            mostrarToast(`Exibindo: ${nomesProfissionais} (${categoriaSugerida})`, "success");
        });
    }

    // ================= INICIALIZAÇÃO =================
    setupHeader();
    carregarServicos();
    configurarBotoesSolicitacao();
    configurarBusca();
    configurarFiltrosCategoria();
    configurarIA();
});
