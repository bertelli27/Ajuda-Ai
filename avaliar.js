document.addEventListener("DOMContentLoaded", async function() {
    // ================= VALIDAÇÃO E CARREGAMENTO DE DADOS =================
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para avaliar um serviço!", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get("pedido");
    if (!pedidoId) {
        mostrarToast("Pedido não especificado.", "error");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 1500);
        return;
    }

    // 🚀 Busca os dados reais da API!
    const [usuarios, solicitacoes] = await Promise.all([
        API.getUsuarios(),
        API.getSolicitacoes()
    ]);

    const pedido = solicitacoes.find(s => s.id == pedidoId);
    const cEmail = pedido?.clienteEmail || pedido?.cliente_email;

    if (!pedido || cEmail !== emailLogado) {
        mostrarToast("Você não tem permissão para avaliar este pedido.", "error");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 1500);
        return;
    }
    
    if (pedido.avaliado) {
        mostrarToast("Este pedido já foi avaliado.", "error");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 1500);
        return;
    }

    const pEmail = pedido.prestadorEmail || pedido.prestador_email;
    const prestador = usuarios.find(u => u.email === pEmail);

    // Preenche informações do serviço
    const dataSolicitacao = pedido.dataSolicitacao || pedido.criado_em || new Date().toISOString();
    const infoDiv = document.getElementById("infoServicoAvaliacao");
    infoDiv.innerHTML = `
        <h3 style="color: #00ADB5; margin-bottom: 5px;">${pedido.servico}</h3>
        <p><strong>Profissional:</strong> ${prestador ? prestador.nome : 'Não encontrado'}</p>
        <p><strong>Data de Conclusão:</strong> ${new Date(dataSolicitacao).toLocaleDateString('pt-BR')}</p>
    `;

    // ================= LÓGICA DAS ESTRELAS =================
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;

    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            resetStars();
            const value = parseInt(star.getAttribute('data-value'));
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('hover');
            }
        });

        star.addEventListener('mouseout', () => {
            resetStars();
            highlightStars(currentRating);
        });

        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            highlightStars(currentRating);
        });
    });

    function resetStars() {
        stars.forEach(s => s.classList.remove('hover', 'selected'));
    }

    function highlightStars(value) {
        for (let i = 0; i < value; i++) {
            stars[i].classList.add('selected');
        }
    }

    // ================= SALVAR AVALIAÇÃO =================
    document.getElementById("formAvaliacao").addEventListener("submit", async function(e) {
        e.preventDefault();

        if (currentRating === 0) {
            mostrarToast("Por favor, selecione uma nota de 1 a 5 estrelas.", "error");
            return;
        }

        const comentario = document.getElementById("comentario").value.trim();
        const btnSubmit = document.querySelector('#formAvaliacao button[type="submit"]');
        setButtonLoading(btnSubmit);

        const novaAvaliacao = {
            id_solicitacao: pedido.id,
            prestadorEmail: pEmail,
            nota: currentRating,
            comentario: comentario
        };

        try {
            await API.criarAvaliacao(novaAvaliacao);
            mostrarToast("Avaliação enviada com sucesso! Obrigado.", "success");
            setTimeout(() => {
                window.location.href = "pedidos.html";
            }, 1500);
        } catch (error) {
            mostrarToast(error.message, "error");
            removeButtonLoading(btnSubmit);
        }
    });
    
    // ================= HEADER E LOGOUT =================
    window.logout = function(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "login.html";
    }

    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;
        const usuarioLogado = usuarios.find(u => u.email === emailLogado);
        if (!usuarioLogado) return;
        
        const fotoPerfil = usuarioLogado?.fotoPerfil || 'img/avatar_padrao.png';
        const primeiroNome = usuarioLogado.nome.split(' ')[0];
        const textoPedidos = usuarioLogado.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        
        menu.innerHTML = `
            <a href="index.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html" class="active-nav">${textoPedidos}</a>
            <div class="profile-menu-container">
                <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                    <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                    <span>${primeiroNome}</span>
                </a>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="dashboard.html">Dashboard</a>
                    <a href="perfil.html">Meu Perfil</a>
                    <a href="configuracoes.html">Configurações</a>
                    <a href="#" onclick="logout(event)">Sair</a>
                </div>
            </div>
        `;
        
        const avatarMenuBtn = document.getElementById("avatarMenuBtn");
        if(avatarMenuBtn) {
            avatarMenuBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                document.getElementById("profileDropdown").classList.toggle("show-dropdown");
            });
        }
        
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