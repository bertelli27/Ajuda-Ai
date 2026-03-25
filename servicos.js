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
    function carregarServicos() {
        const grid = document.querySelector(".services-grid");
        if (!grid) return;

        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const prestadores = usuarios.filter(u => u.tipo === "prestador" && u.prestador);

        grid.innerHTML = ''; // Limpa a área

        if (prestadores.length === 0) {
            grid.innerHTML = '<p style="color: #AAAAAA; text-align: center; grid-column: span 4;">Nenhum prestador de serviço cadastrado no momento.</p>';
            return;
        }

        prestadores.forEach(prestador => {
            const card = document.createElement('div');
            card.className = 'service-card';
            // Adicionando mais detalhes ao card
            card.innerHTML = `
                <h3>${prestador.prestador.servico || 'Serviço não informado'}</h3>
                <p><strong>Prestador:</strong> ${prestador.nome}</p>
                <p><strong>Descrição:</strong> ${prestador.prestador.descricao || '-'}</p>
                <p><strong>Preço médio:</strong> R$${parseFloat(prestador.prestador.valor || 0).toFixed(2).replace('.', ',')}</p>
                <p><strong>Disponibilidade:</strong> ${prestador.prestador.disponibilidade || '-'}</p>
                <p><strong>Local:</strong> ${prestador.endereco.cidade} - ${prestador.endereco.estado}</p>
                <button class="btn-service" data-email-prestador="${prestador.email}">Solicitar Serviço</button>
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
                    alert("Você precisa fazer login para solicitar um serviço!");
                    window.location.href = "index.html";
                } else {
                    const prestadorEmail = e.target.getAttribute('data-email-prestador');
                    window.location.href = `solicitar.html?prestador=${encodeURIComponent(prestadorEmail)}`;
                }
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

    // ================= INICIALIZAÇÃO =================
    setupHeader();
    carregarServicos();
    configurarBotoesSolicitacao();
    configurarBusca();
});