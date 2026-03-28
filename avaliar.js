document.addEventListener("DOMContentLoaded", function() {
    // ================= VALIDAÇÃO E CARREGAMENTO DE DADOS =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para avaliar um serviço!", "error");
        setTimeout(() => {
            window.location.href = "index.html";
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

    const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
    const pedido = solicitacoes.find(s => s.id === pedidoId);

    if (!pedido || pedido.clienteEmail !== emailLogado) {
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

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const prestador = usuarios.find(u => u.email === pedido.prestadorEmail);

    // Preenche informações do serviço
    const infoDiv = document.getElementById("infoServicoAvaliacao");
    infoDiv.innerHTML = `
        <h3 style="color: #00ADB5; margin-bottom: 5px;">${pedido.servico}</h3>
        <p><strong>Profissional:</strong> ${prestador ? prestador.nome : 'Não encontrado'}</p>
        <p><strong>Data de Conclusão:</strong> ${new Date(pedido.dataSolicitacao).toLocaleDateString('pt-BR')}</p>
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
    document.getElementById("formAvaliacao").addEventListener("submit", function(e) {
        e.preventDefault();

        if (currentRating === 0) {
            mostrarToast("Por favor, selecione uma nota de 1 a 5 estrelas.", "error");
            return;
        }

        const comentario = document.getElementById("comentario").value.trim();

        const novaAvaliacao = {
            id_avaliacao: "AV-" + Date.now(),
            id_solicitacao: pedidoId,
            prestadorEmail: pedido.prestadorEmail,
            clienteEmail: emailLogado,
            nota: currentRating,
            comentario: comentario,
            data_avaliacao: new Date().toISOString()
        };

        const avaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];
        avaliacoes.push(novaAvaliacao);
        localStorage.setItem("avaliacoes", JSON.stringify(avaliacoes));

        // Marcar o pedido como avaliado
        const pedidoIndex = solicitacoes.findIndex(s => s.id === pedidoId);
        if (pedidoIndex !== -1) {
            solicitacoes[pedidoIndex].avaliado = true;
            localStorage.setItem("solicitacoes", JSON.stringify(solicitacoes));
        }

        mostrarToast("Avaliação enviada com sucesso! Obrigado.", "success");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 1500);
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
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const usuarioLogado = usuarios.find(u => u.email === emailLogado);
        const fotoPerfil = usuarioLogado?.fotoPerfil || 'img/avatar_padrao.png';
        menu.innerHTML = `
            <a href="home.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html">Meus Pedidos</a>
            <div class="profile-menu-container">
                <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar" id="avatarMenuBtn" style="cursor: pointer;" title="Opções da Conta">
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