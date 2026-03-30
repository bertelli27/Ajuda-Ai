document.addEventListener("DOMContentLoaded", function() {
    // ================= VALIDAÇÃO DE USUÁRIO LOGADO =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para solicitar um serviço!", "error");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const clienteAtual = usuarios.find(u => u.email === emailLogado);

    // ================= PEGAR PRESTADOR DA URL =================
    const params = new URLSearchParams(window.location.search);
    const prestadorEmail = params.get("prestador");

    if (!prestadorEmail) {
        mostrarToast("Prestador não encontrado.", "error");
        setTimeout(() => {
            window.location.href = "servicos.html";
        }, 1500);
        return;
    }

    const prestador = usuarios.find(u => u.email === prestadorEmail && u.tipo === "prestador");

    if (!prestador) {
        mostrarToast("Este usuário não é um prestador válido.", "error");
        setTimeout(() => {
            window.location.href = "servicos.html";
        }, 1500);
        return;
    }

    // Regra: Usuário não pode contratar a si mesmo
    if (prestador.email === emailLogado) {
        mostrarToast("Você não pode solicitar um serviço a si mesmo.", "error");
        setTimeout(() => {
            window.location.href = "servicos.html";
        }, 1500);
        return;
    }

    // ================= EXIBIR DADOS =================
    const infoDiv = document.getElementById("infoPrestador");
    infoDiv.innerHTML = `
        <h3 style="color: #00ADB5; margin-bottom: 5px;">${prestador.prestador.servico}</h3>
        <p style="margin-bottom: 5px;"><strong>Profissional:</strong> ${prestador.nome}</p>
        <p style="margin-bottom: 5px;"><strong>Valor Médio:</strong> R$${parseFloat(prestador.prestador.valor || 0).toFixed(2).replace('.', ',')}</p>
        <p><strong>Disponibilidade:</strong> ${prestador.prestador.disponibilidade}</p>
    `;

    // Preenche o endereço do cliente como sugestão inicial
    if (clienteAtual && clienteAtual.endereco) {
        const end = clienteAtual.endereco;
        const enderecoFormatado = `${end.rua}, ${end.numero} ${end.complemento ? '- ' + end.complemento : ''} - ${end.bairro}, ${end.cidade} - ${end.estado}`;
        document.getElementById("enderecoLocal").value = enderecoFormatado;
    }

    // ================= SALVAR SOLICITAÇÃO =================
    document.getElementById("formSolicitacao").addEventListener("submit", function(e) {
        e.preventDefault();

        const descricao = document.getElementById("descricaoProblema").value.trim();
        const data = document.getElementById("dataDesejada").value;
        const endereco = document.getElementById("enderecoLocal").value.trim();

        const novaSolicitacao = {
            id: "SOL-" + Date.now(), // Gera um ID único simulado
            clienteEmail: clienteAtual.email,
            prestadorEmail: prestador.email,
            servico: prestador.prestador.servico,
            descricao: descricao,
            dataSelecionada: data,
            enderecoRealizacao: endereco,
            status: "PENDENTE", // Exatamente como na sua documentação de BD
            statusPagamento: "PENDENTE",
            dataSolicitacao: new Date().toISOString(),
            valorCombinado: null,
            valorStatus: 'INICIAL', // 'INICIAL', 'PROPOSTO', 'ACEITO'
            descricaoProposta: ''
        };

        // Salva na "Tabela" de solicitações no LocalStorage
        const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
        solicitacoes.push(novaSolicitacao);
        localStorage.setItem("solicitacoes", JSON.stringify(solicitacoes));

        mostrarToast("Solicitação bem sucedida! Aguardando resposta do prestador.", "success");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 2000);
    });

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
        const fotoPerfil = clienteAtual?.fotoPerfil || 'img/avatar_padrao.png';
        const primeiroNome = clienteAtual.nome.split(' ')[0];
        const textoPedidos = clienteAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        menu.innerHTML = `
            <a href="home.html">Início</a>
            <a href="servicos.html" class="active-nav">Serviços</a>
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

    setupHeader();
});