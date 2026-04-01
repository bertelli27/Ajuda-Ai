// ================= USUÁRIO =================

async function carregarUsuario() {
    const menu = document.getElementById("menu");
    if (!menu) return;

    // 1. Checar se o usuário está logado (usa a mesma lógica do login)
    const emailLogado = API.getSessaoAtual();

    if (emailLogado) {
        // 2. Se logado, buscar os dados completos do usuário
        const usuarios = await API.getUsuarios();
        const usuarioAtual = usuarios.find(u => u.email === emailLogado);

        if (usuarioAtual && usuarioAtual.nome) {
            const fotoPerfil = usuarioAtual.fotoPerfil || 'img/avatar_padrao.png';
            const primeiroNome = usuarioAtual.nome.split(' ')[0];
            const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';

            // 🔐 LOGADO: Monta a mensagem de boas-vindas e o menu do usuário
            menu.innerHTML = `
                <a href="home.html" class="active-nav">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="pedidos.html">${textoPedidos}</a>
                <div class="profile-menu-container">
                    <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
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
            // Adiciona o evento de clique para o botão de logout
            document.getElementById("btnLogout").addEventListener("click", logout);
            
            // Lógica para abrir/fechar o Dropdown ao clicar na foto
            document.getElementById("avatarMenuBtn").addEventListener("click", function(e) {
                e.stopPropagation();
                document.getElementById("profileDropdown").classList.toggle("show-dropdown");
            });

            // Fecha o Dropdown se clicar em qualquer outro lugar da tela
            window.addEventListener("click", function() {
                const dropdown = document.getElementById("profileDropdown");
                if (dropdown && dropdown.classList.contains("show-dropdown")) {
                    dropdown.classList.remove("show-dropdown");
                }
            });

            if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
        } else {
            // Caso não encontre o usuário (p.e., localStorage limpo), mostra o menu padrão de não logado
            mostrarMenuDeslogado(menu);
        }
    } else {
        // 🔓 NÃO LOGADO
        mostrarMenuDeslogado(menu);
    }
}

function mostrarMenuDeslogado(menu) {
    // Mostra os links de Entrar/Cadastrar no menu
    menu.innerHTML = `
        <a href="home.html" class="active-nav">Início</a>
        <a href="servicos.html">Serviços</a>
        <a href="index.html">Entrar</a>
        <a href="register.html">Cadastrar</a>
    `;
}

// ================= LOGOUT =================

function logout(e) {
    if (e) e.preventDefault();
    API.fazerLogout();
    window.location.href = "index.html";
}

// ================= CARREGAR SERVIÇOS DINAMICAMENTE =================

function carregarServicos() {
    const grid = document.querySelector(".services-grid");
    if (!grid) return;

    // 1. Mostrar Skeleton Loaders primeiro
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
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
    setTimeout(async () => {
    const usuarios = await API.getUsuarios();
    const prestadores = usuarios.filter(u => u.tipo === "prestador" && u.prestador);
    
    // 🚀 Busca as avaliações REAIS da API
    const avaliacoes = await API.getAvaliacoes(); 
    const todosServicos = await API.getServicos(); // 🚀 Busca os serviços para cruzar os dados

    grid.innerHTML = ''; // Limpa os cards estáticos

    if (prestadores.length === 0) {
        grid.innerHTML = `
            <div class="empty-state fade-up-animation">
                <div class="empty-state-icon">🔍</div>
                <p>Nenhum prestador de serviço encontrado no momento.</p>
            </div>`;
        return;
    }

    // Mostra apenas os 4 primeiros na home
    prestadores.slice(0, 4).forEach(prestador => {
        const card = document.createElement('div');
        card.className = 'service-card';

        // Calcula a média de avaliações
        const avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === prestador.email);
        let mediaEstrelas = 'N/A';
        if (avaliacoesDoPrestador.length > 0) {
            const somaNotas = avaliacoesDoPrestador.reduce((acc, a) => acc + a.nota, 0);
            const notaMedia = somaNotas / avaliacoesDoPrestador.length;
            mediaEstrelas = '★'.repeat(Math.round(notaMedia)) + '☆'.repeat(5 - Math.round(notaMedia));
        }
        
        // Encontra o serviço principal do prestador para exibir no card
        const servicoPrincipal = todosServicos.find(s => s.prestadorEmail === prestador.email);
        const tituloExibicao = servicoPrincipal ? servicoPrincipal.titulo : 'Profissional Autônomo';
        const categoriaExibicao = servicoPrincipal ? servicoPrincipal.categoria : 'Serviços Gerais';
        const preco = servicoPrincipal ? (servicoPrincipal.preco_base || servicoPrincipal.precoBase || servicoPrincipal.preco) : null;
        const valorDisplay = preco ? 'R$ ' + parseFloat(preco).toFixed(2).replace('.', ',') : 'A combinar';

        card.innerHTML = `
            <img src="${prestador.fotoPerfil || 'img/avatar_padrao.png'}" alt="Foto de ${prestador.nome}" class="card-avatar">
            <span style="font-size: 12px; background: #00ADB5; color: #222A31; padding: 3px 8px; border-radius: 10px; font-weight: bold; display: inline-block; margin-bottom: 10px;">${categoriaExibicao}</span>
            <h3>${tituloExibicao}</h3>
            <p>Prestador: ${prestador.nome.split(' ')[0]}</p>
            <p>Valor base: ${valorDisplay}</p>
            <p>Avaliação: <span class="rating-display">${mediaEstrelas}</span></p>
            <p>Cidade: ${prestador.endereco.cidade}</p>
            <div class="card-botoes">
                <button class="btn-ver-perfil" data-email-prestador="${prestador.email}">Ver Perfil</button>
                <button class="btn-service" data-email-prestador="${prestador.email}">Solicitar</button>
            </div>
        `;
        grid.appendChild(card);
    });
    }, 1500); // Fim do setTimeout
}

// ================= BOTÕES DOS SERVIÇOS (COM EVENT DELEGATION) =================

function configurarBotoes() {
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

// ================= BUSCA =================

function configurarBusca() {
    // A busca completa será implementada na página servicos.html
    // Na home, o link de "Serviços" leva para a página com a busca funcional.
}

// ================= ACESSIBILIDADE PARA CARDS CLICÁVEIS =================
function configurarAcessibilidadeCards() {
    const clickableCards = document.querySelectorAll('.pop-category-card, .step-card');

    clickableCards.forEach(card => {
        // Torna o card focável via teclado
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button'); // Informa ao leitor de tela que é um elemento clicável

        // Adiciona o evento para a tecla Enter ou Espaço
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Previne a rolagem da página com a barra de espaço
                this.click(); // Dispara o evento de clique já existente no HTML
            }
        });
    });
}

// ================= INIT =================

window.onload = () => {
    carregarUsuario();
    carregarServicos();
    configurarBotoes();
    configurarBusca();
    configurarAcessibilidadeCards();
};
