document.addEventListener("DOMContentLoaded", function() {

    // ================= MENU DINÂMICO E LOGOUT =================
    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;

        const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");

        if (emailLogado) {
            // Usuário Logado
            menu.innerHTML = `
                <a href="home.html">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="pedidos.html">Meus Pedidos</a>
                <a href="perfil.html">Meu Perfil</a>
                <a href="#" id="btnLogout">Sair</a>
            `;
            document.getElementById("btnLogout").addEventListener("click", logout);
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

        grid.innerHTML = ''; // Limpa a área

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