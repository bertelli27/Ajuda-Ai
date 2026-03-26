document.addEventListener("DOMContentLoaded", function() {

    // ================= MENU DINÂMICO E LOGOUT =================
    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;

        const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");

        if (emailLogado) {
            const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            const usuarioLogado = usuarios.find(u => u.email === emailLogado);
            const fotoPerfil = usuarioLogado?.fotoPerfil || 'img/avatar_padrao.png';
            // Usuário Logado
            menu.innerHTML = `
                <a href="dashboard.html">Dashboard</a>
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
        } else {
            // Usuário Deslogado
            menu.innerHTML = `
                <a href="home.html">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="index.html">Entrar</a>
                <a href="register.html">Cadastrar</a>
            `;
        }
    }

    function logout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    }

    // ================= VARIÁVEIS DE PAGINAÇÃO =================
    let currentPage = 1;
    const ITEMS_PER_PAGE = 6;

    // ================= CARREGAR SERVIÇOS =================
    function carregarServicos(categoriaFiltro = "Todos", termoBusca = "") {
        const grid = document.querySelector(".services-grid");
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

        setTimeout(() => {
            const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            let prestadores = usuarios.filter(u => u.tipo === "prestador" && u.prestador);
            const avaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];

            // 1. Filtro de categoria
            if (categoriaFiltro !== "Todos") {
                prestadores = prestadores.filter(u => {
                    const cat = u.prestador.categoria || "Outros";
                    return cat === categoriaFiltro;
                });
            }

            // 2. Filtro de busca
            if (termoBusca) {
                prestadores = prestadores.filter(p => {
                    const textoCard = `${p.prestador.servico || ''} ${p.nome || ''} ${p.endereco.cidade || ''} ${p.prestador.categoria || ''} ${p.prestador.descricao || ''}`.toLowerCase();
                    return textoCard.includes(termoBusca);
                });
            }

            // 3. Paginação
            const totalItems = prestadores.length;
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const paginatedPrestadores = prestadores.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            grid.innerHTML = ''; // Limpa os skeletons

            if (paginatedPrestadores.length === 0) {
                grid.innerHTML = '<p class="aviso-sem-pedidos" style="grid-column: 1 / -1;">Nenhum prestador encontrado com estes critérios.</p>';
            } else {
                paginatedPrestadores.forEach(prestador => {
                    renderizarCard(prestador, avaliacoes, grid);
                });
            }

            renderPaginacao(totalItems, currentPage, ITEMS_PER_PAGE, 'paginacao-servicos', (newPage) => {
                currentPage = newPage;
                carregarServicos(categoriaFiltro, termoBusca);
            });

        }, 1500);
    }

    function renderizarCard(prestador, avaliacoes, grid) {
            const card = document.createElement('div');
            card.className = 'service-card';

        const avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === prestador.email);
        let mediaEstrelas = 'N/A';
        if (avaliacoesDoPrestador.length > 0) {
            const somaNotas = avaliacoesDoPrestador.reduce((acc, a) => acc + a.nota, 0);
            const notaMedia = somaNotas / avaliacoesDoPrestador.length;
            mediaEstrelas = '★'.repeat(Math.round(notaMedia)) + '☆'.repeat(5 - Math.round(notaMedia));
        }

        card.innerHTML = `
                <img src="${prestador.fotoPerfil || 'img/avatar_padrao.png'}" alt="Foto de ${prestador.nome}" class="card-avatar">
                <span style="font-size: 12px; background: #00ADB5; color: #222A31; padding: 3px 8px; border-radius: 10px; font-weight: bold; display: inline-block; margin-bottom: 10px;">${prestador.prestador.categoria || 'Outros'}</span>
                <h3>${prestador.prestador.servico || 'Serviço não informado'}</h3>
                <p><strong>Prestador:</strong> ${prestador.nome}</p>
                <p><strong>Avaliação:</strong> <span class="rating-display">${mediaEstrelas}</span> (${avaliacoesDoPrestador.length})</p>
                <p><strong>Descrição:</strong> ${prestador.prestador.descricao || '-'}</p>
                <p><strong>Preço médio:</strong> R$${parseFloat(prestador.prestador.valor || 0).toFixed(2).replace('.', ',')}</p>
                <p><strong>Disponibilidade:</strong> ${prestador.prestador.disponibilidade || '-'}</p>
                <p><strong>Local:</strong> ${prestador.endereco.cidade} - ${prestador.endereco.estado}</p>
                <div class="card-botoes">
                    <button class="btn-ver-perfil" data-email-prestador="${prestador.email}">Ver Perfil</button>
                    <button class="btn-service" data-email-prestador="${prestador.email}">Solicitar</button>
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
                const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");

                if (!emailLogado) {
                    mostrarToast("Você precisa fazer login para solicitar um serviço!", "error");
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 1500);
                } else {
                    const prestadorEmail = e.target.getAttribute('data-email-prestador');
                    window.location.href = `solicitar.html?prestador=${encodeURIComponent(prestadorEmail)}`;
                }
            }
            if (e.target && e.target.classList.contains('btn-ver-perfil')) {
                const prestadorEmail = e.target.getAttribute('data-email-prestador');
                window.location.href = `perfil.html?usuario=${encodeURIComponent(prestadorEmail)}`;
                }
            });
        }

    // ================= CONFIGURAR BUSCA =================
    function configurarBusca() {
        const btn = document.getElementById("searchBtn");
        const searchInput = document.getElementById("searchInput");
        if (!btn || !searchInput) return;

        function executarBusca() {
            currentPage = 1; // Reseta a página para a primeira
            const termo = searchInput.value.toLowerCase();
            const categoriaAtiva = document.querySelector('.btn-categoria.active')?.getAttribute('data-cat') || 'Todos';
            carregarServicos(categoriaAtiva, termo);
        }

        btn.addEventListener("click", executarBusca);
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') executarBusca();
        });
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

    // ================= INICIALIZAÇÃO =================
    setupHeader();
    carregarServicos();
    configurarBotoesSolicitacao();
    configurarBusca();
    configurarFiltrosCategoria();
});