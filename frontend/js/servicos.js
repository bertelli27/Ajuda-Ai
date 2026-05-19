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
                <a href="pedidos.html">${textoPedidos}</a>
                <div class="profile-menu-container">
                    <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                        <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                        <span>${primeiroNome}</span>
                    </a>
                    <div class="profile-dropdown" id="profileDropdown">
                        ${usuarioLogado.tipo === 'admin' ? '<a href="admin.html" style="color: #d9534f; font-weight: bold;">👑 Painel Admin</a>' : ''}
                        <a href="dashboard.html">Dashboard</a>
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
                    if (prestador) renderizarCard(servico, prestador, avaliacoes, grid, isSelf);
                });
            }

            renderPaginacao(totalItems, currentPage, ITEMS_PER_PAGE, 'paginacao-servicos', (newPage) => {
                currentPage = newPage;
                carregarServicos(categoriaFiltro, termoBusca);
            });

        }, 1500);
    }

    function renderizarCard(servico, prestador, avaliacoes, grid, isSelf) {
            const card = document.createElement('div');
            card.className = 'service-card';

        const avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === prestador.email);
        let mediaEstrelas = 'N/A';
        if (avaliacoesDoPrestador.length > 0) {
            const somaNotas = avaliacoesDoPrestador.reduce((acc, a) => acc + a.nota, 0);
            const notaMedia = somaNotas / avaliacoesDoPrestador.length;
            mediaEstrelas = `★ ${notaMedia.toFixed(1)}`;
        }

        card.innerHTML = `
                <img src="${prestador.fotoPerfil || '../img/avatar_padrao.png'}" alt="Foto de ${prestador.nome}" class="card-avatar">
                <span style="font-size: 12px; background: #00ADB5; color: #222A31; padding: 3px 8px; border-radius: 10px; font-weight: bold; display: inline-block; margin-bottom: 10px;">${servico.categoria}</span>
                <h3>${servico.titulo}</h3>
                <p><strong>Prestador:</strong> ${prestador.nome}</p>
                <p><strong>Avaliação:</strong> <span class="rating-display">${mediaEstrelas}</span> (${avaliacoesDoPrestador.length})</p>
                <p><strong>Descrição:</strong> ${servico.descricao || 'Sem descrição.'}</p>
                <p><strong>Cidade:</strong> ${prestador.endereco.cidade} - ${prestador.endereco.estado}</p>
                <div class="card-botoes">
                    <button class="btn-ver-perfil" data-email-prestador="${prestador.email}">Ver Perfil</button>
                    ${!isSelf ? `<button class="btn-service" data-servico-id="${servico.id}">Solicitar</button>` : ''}
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

    // ================= INTELIGÊNCIA ARTIFICIAL (CLASSIFICADOR) =================
    async function sugerirServicoIA(descricao) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const desc = descricao.toLowerCase();
                // Palavras mapeadas diretamente para as Categorias Reais do sistema
                const regras = {
                    "Limpeza": ["limpeza", "limpar", "faxina", "suja", "sujo", "poeira", "diarista", "lavar"],
                    "Manutenção": ["água", "agua", "cano", "vazamento", "vazando", "pia", "torneira", "ralo", "encanamento", "luz", "energia", "tomada", "fio", "curto", "disjuntor", "chuveiro", "eletricista", "encanador", "ar condicionado"],
                    "Reformas": ["pintura", "tinta", "parede", "pintar", "reforma", "pedreiro", "construir", "montar", "móveis", "moveis", "guarda-roupa", "mesa", "cadeira", "armário", "armario"],
                    "Tecnologia": ["computador", "pc", "notebook", "formatar", "vírus", "internet", "wifi", "rede", "celular", "tela"],
                    "Saúde e Beleza": ["cabelo", "corte", "unha", "manicure", "maquiagem", "massagem"],
                };

                let categoriaSugerida = "Outros"; // Fallback

                for (const [categoria, palavras] of Object.entries(regras)) {
                    if (palavras.some(palavra => desc.includes(palavra))) {
                        categoriaSugerida = categoria;
                        break;
                    }
                }
                resolve(categoriaSugerida);
            }, 800); // 800ms delay para parecer real
        });
    }

    function configurarIA() {
        const btnSugerir = document.getElementById("btnSugerirServico");
        const inputDescricao = document.getElementById("ia-descricao-problema");
        const iaResultado = document.getElementById("ia-resultado");
        const iaSugestaoTexto = document.getElementById("ia-sugestao-texto");
        const btnUsarSugestao = document.getElementById("btnUsarSugestao");

        if (!btnSugerir || !inputDescricao) return;

        btnSugerir.addEventListener("click", async () => {
            const texto = inputDescricao.value.trim();
            if (!texto) {
                mostrarToast("Descreva seu problema na caixa da IA primeiro.", "error");
                return;
            }

            btnSugerir.innerHTML = "⏳ Analisando...";
            btnSugerir.disabled = true;

            try {
                const categoria = await sugerirServicoIA(texto);
                iaSugestaoTexto.innerText = categoria;
                iaResultado.style.display = "block";
            } catch (e) {
                mostrarToast("Erro na IA.", "error");
            } finally {
                btnSugerir.innerHTML = "Analisar Problema";
                btnSugerir.disabled = false;
            }
        });

        btnUsarSugestao.addEventListener("click", () => {
            const categoriaSugerida = iaSugestaoTexto.innerText;
            
            // 1. Atualiza visualmente os botões redondos de categoria (Deixa a sugerida "active")
            const botoesCategoria = document.querySelectorAll('.btn-categoria');
            botoesCategoria.forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-cat') === categoriaSugerida) {
                    b.classList.add('active');
                }
            });

            // 2. Executa a busca e limpa o texto da barra de pesquisa comum
            currentPage = 1;
            document.getElementById("searchInput").value = ""; 
            carregarServicos(categoriaSugerida, "");
            
            // 3. Esconde a caixa e dá feedback
            iaResultado.style.display = "none";
            inputDescricao.value = "";
            mostrarToast(`Exibindo profissionais da categoria: ${categoriaSugerida}`, "success");
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
