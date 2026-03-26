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

    // ================= CARREGAR SERVIÇOS =================
    function carregarServicos(categoriaFiltro = "Todos") {
        const grid = document.querySelector(".services-grid");
        if (!grid) return;

        // 1. Mostrar Skeleton Loaders primeiro
        grid.innerHTML = '';
        for (let i = 0; i < 6; i++) { // 6 cards preenchem bem a página inteira de serviços
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

        // 2. Simular um atraso de rede (1.5 segundos) antes de carregar os dados reais
        setTimeout(() => {
            const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            let prestadores = usuarios.filter(u => u.tipo === "prestador" && u.prestador);
            const avaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];

            // Aplica o filtro de categoria
            if (categoriaFiltro !== "Todos") {
                prestadores = prestadores.filter(u => {
                    const cat = u.prestador.categoria || "Outros"; // Usuarios antigos caem em "Outros"
                    return cat === categoriaFiltro;
                });
            }

            grid.innerHTML = ''; // Limpa os skeletons

            if (prestadores.length === 0) {
                grid.innerHTML = '<p style="color: #AAAAAA; text-align: center; grid-column: span 4;">Nenhum prestador encontrado para esta categoria.</p>';
                return;
            }

            prestadores.forEach(prestador => {
            const card = document.createElement('div');
            card.className = 'service-card';

            // Calcula a média de avaliações
            const avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === prestador.email);
            let mediaEstrelas = 'N/A';
            let notaMedia = 0;
            if (avaliacoesDoPrestador.length > 0) {
                const somaNotas = avaliacoesDoPrestador.reduce((acc, a) => acc + a.nota, 0);
                notaMedia = somaNotas / avaliacoesDoPrestador.length;
                mediaEstrelas = '★'.repeat(Math.round(notaMedia)) + '☆'.repeat(5 - Math.round(notaMedia));
            }

            // Adicionando mais detalhes ao card
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
        });
        }, 1500); // Fim do setTimeout
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

        function filtrar() {
            const termo = searchInput.value.toLowerCase();
            const cards = document.querySelectorAll(".service-card");
            cards.forEach(card => {
                const texto = card.innerText.toLowerCase();
                card.style.display = texto.includes(termo) ? "block" : "none";
            });
        }

        btn.addEventListener("click", filtrar);
        searchInput.addEventListener("keyup", filtrar);
    }

    // ================= CONFIGURAR FILTROS DE CATEGORIA =================
    function configurarFiltrosCategoria() {
        const botoesCategoria = document.querySelectorAll('.btn-categoria');
        botoesCategoria.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active de todos e bota no clicado
                botoesCategoria.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Recarrega os serviços com o filtro
                const categoria = e.target.getAttribute('data-cat');
                carregarServicos(categoria);
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