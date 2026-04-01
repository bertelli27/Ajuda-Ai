document.addEventListener("DOMContentLoaded", async function() {
    // ================= VALIDAÇÃO DE USUÁRIO LOGADO =================
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para solicitar um serviço!", "error");
        setTimeout(() => { window.location.href = "index.html"; }, 1500);
        return;
    }

    // ================= CARREGAMENTO DE DADOS =================
    const params = new URLSearchParams(window.location.search);
    const servicoId = parseInt(params.get("servicoId"), 10);

    if (!servicoId) {
        mostrarToast("ID do serviço não fornecido.", "error");
        setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
        return;
    }

    try {
        // Busca todos os dados necessários da API
        // Usamos o mock de getUsuarios por enquanto para pegar os dados do cliente
        const [usuarios, servicoSolicitado] = await Promise.all([
            API.getUsuarios(), 
            API.getServicoById(servicoId)
        ]);

        const clienteAtual = usuarios.find(u => u.email === emailLogado);

        if (servicoSolicitado.prestador_email === emailLogado) {
            mostrarToast("Você não pode solicitar um serviço a si mesmo.", "error");
            setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
            return;
        }

        // Se tudo estiver OK, preenche a tela e configura o formulário
        preencherDadosTela(servicoSolicitado, clienteAtual);
        configurarFormulario(servicoId);

    } catch (error) {
        mostrarToast(error.message, "error");
        setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
    }

    // ================= FUNÇÕES DE UI E LÓGICA =================
    function preencherDadosTela(servico, cliente) {
        document.getElementById("infoPrestador").innerHTML = `
            <h3 style="color: #00ADB5; margin-bottom: 5px;">${servico.titulo}</h3>
            <p style="margin-bottom: 5px;"><strong>Profissional:</strong> ${servico.prestador_nome}</p>
        `;

        if (cliente && cliente.endereco) {
            const end = cliente.endereco;
            const enderecoFormatado = `${end.rua}, ${end.numero} ${end.complemento ? '- ' + end.complemento : ''} - ${end.bairro}, ${end.cidade} - ${end.estado}`;
            document.getElementById("enderecoLocal").value = enderecoFormatado;
        }
        setupHeader(cliente);
    }

    function configurarFormulario(idServico) {
        document.getElementById("formSolicitacao").addEventListener("submit", async function(e) {
            e.preventDefault();
            const btnSubmit = e.submitter;
            setButtonLoading(btnSubmit);

            const dadosSolicitacao = {
                servicoId: idServico,
                descricaoProblema: document.getElementById("descricaoProblema").value.trim(),
                dataDesejada: document.getElementById("dataDesejada").value,
                enderecoRealizacao: document.getElementById("enderecoLocal").value.trim()
            };

            try {
                await API.criarSolicitacao(dadosSolicitacao);
                mostrarToast("Solicitação enviada com sucesso! Acompanhe em 'Meus Pedidos'.", "success");
                setTimeout(() => { window.location.href = "pedidos.html"; }, 2000);
            } catch (error) {
                mostrarToast(error.message, "error");
                removeButtonLoading(btnSubmit);
            }
        });
    }

    // ================= HEADER E LOGOUT =================
    function logout(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "index.html";
    }

    function setupHeader(usuarioAtual) {
        const menu = document.getElementById("menu");
        if (!menu) return;
        const fotoPerfil = usuarioAtual?.fotoPerfil || 'img/avatar_padrao.png';
        const primeiroNome = usuarioAtual.nome.split(' ')[0];
        const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
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
});