// ================= USUÁRIO =================

function carregarUsuario() {
    const areaMenu = document.getElementById("area-usuario-menu");
    const mensagemBoasVindas = document.getElementById("mensagem-boas-vindas");
    if (!areaMenu || !mensagemBoasVindas) return;

    // 1. Checar se o usuário está logado (usa a mesma lógica do login)
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");

    if (emailLogado) {
        // 2. Se logado, buscar os dados completos do usuário
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const usuarioAtual = usuarios.find(u => u.email === emailLogado);

        if (usuarioAtual && usuarioAtual.nome) {
            // 🔐 LOGADO: Monta a mensagem de boas-vindas e o menu do usuário
            mensagemBoasVindas.innerText = `Olá, ${usuarioAtual.nome.split(' ')[0]}!`;
            areaMenu.innerHTML = `
                <a href="pedidos.html">Meus Pedidos</a>
                <a href="perfil.html">Meu Perfil</a>
                <a href="#" id="btnLogout">Sair</a>
            `;
            // Adiciona o evento de clique para o botão de logout
            document.getElementById("btnLogout").addEventListener("click", logout);
        } else {
            // Caso não encontre o usuário (p.e., localStorage limpo), mostra o menu padrão de não logado
            mostrarMenuDeslogado(areaMenu, mensagemBoasVindas);
        }
    } else {
        // 🔓 NÃO LOGADO
        mostrarMenuDeslogado(areaMenu, mensagemBoasVindas);
    }
}

function mostrarMenuDeslogado(areaMenu, mensagemBoasVindas) {
    // Limpa a mensagem de boas-vindas se não estiver logado
    mensagemBoasVindas.innerText = '';

    // Mostra os links de Entrar/Cadastrar no menu
    areaMenu.innerHTML = `
        <a href="index.html">Entrar</a>
        <a href="register.html">Cadastrar</a>
    `;
}

// ================= LOGOUT =================

function logout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("usuarioLogado");
    sessionStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
}

// ================= CARREGAR SERVIÇOS DINAMICAMENTE =================

function carregarServicos() {
    const grid = document.querySelector(".services-grid");
    if (!grid) return;

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const prestadores = usuarios.filter(u => u.tipo === "prestador" && u.prestador);

    grid.innerHTML = ''; // Limpa os cards estáticos

    if (prestadores.length === 0) {
        grid.innerHTML = '<p style="color: #AAAAAA; text-align: center; grid-column: span 4;">Nenhum prestador de serviço encontrado no momento.</p>';
        return;
    }

    // Mostra apenas os 4 primeiros na home
    prestadores.slice(0, 4).forEach(prestador => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <h3>${prestador.prestador.servico || 'Serviço não informado'}</h3>
            <p>Prestador: ${prestador.nome.split(' ')[0]}</p>
            <p>Preço médio: R$${parseFloat(prestador.prestador.valor || 0).toFixed(2).replace('.', ',')}</p>
            <p>Cidade: ${prestador.endereco.cidade}</p>
            <button class="btn-service" data-email-prestador="${prestador.email}">Solicitar Serviço</button>
        `;
        grid.appendChild(card);
    });
}

// ================= BOTÕES DOS SERVIÇOS (COM EVENT DELEGATION) =================

function configurarBotoes() {
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

// ================= BUSCA =================

function configurarBusca() {
    // A busca completa será implementada na página servicos.html
    // Na home, o link de "Serviços" leva para a página com a busca funcional.
}

// ================= INIT =================

window.onload = () => {
    carregarUsuario();
    carregarServicos();
    configurarBotoes();
    configurarBusca();
};
