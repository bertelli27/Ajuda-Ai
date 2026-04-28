document.addEventListener("DOMContentLoaded", async function() {
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        window.location.href = "login.html";
        return;
    }

    // Configuração do Menu
    const usuarios = await API.getUsuarios();
    const usuarioLogado = usuarios.find(u => u.email === emailLogado);
    
    if (usuarioLogado) {
        const menu = document.getElementById("menu");
        const fotoPerfil = usuarioLogado.fotoPerfil || 'img/avatar_padrao.png';
        const primeiroNome = usuarioLogado.nome.split(' ')[0];
        const textoPedidos = usuarioLogado.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        
        menu.innerHTML = `
            <a href="index.html">Início</a>
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
                    <a href="configuracoes.html" class="active-nav">Configurações</a>
                    <a href="#" onclick="logout(event)">Sair</a>
                </div>
            </div>
        `;
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
    }

    // ================= EXCLUSÃO LÓGICA =================
    document.getElementById("btnDesativarConta").addEventListener("click", function() {
        mostrarConfirmacao("Tem certeza que deseja excluir sua conta? Você perderá o acesso à plataforma.", async () => {
            const btn = document.getElementById("btnDesativarConta");
            setButtonLoading(btn);
            try {
                await API.desativarContaApi();
                mostrarToast("Conta excluída com sucesso. Redirecionando...", "success");
                setTimeout(() => {
                    API.fazerLogout();
                    window.location.href = "login.html";
                }, 2000);
            } catch (error) {
                mostrarToast(error.message, "error");
                removeButtonLoading(btn);
            }
        });
    });

    function mostrarConfirmacao(mensagem, callbackConfirmar) {
        const existingModal = document.getElementById('customConfirmModal');
        if (existingModal) existingModal.remove();
        const modalHtml = `
            <div id="customConfirmModal" class="modal" style="display: flex; align-items: center; justify-content: center; z-index: 10000; background-color: rgba(0,0,0,0.7);">
                <div class="modal-content fade-up-animation" style="max-width: 400px; height: auto; text-align: center; padding: 30px; margin: 0;">
                    <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
                    <h3 style="color: #EEEEEE; margin-bottom: 15px; font-size: 20px;">Atenção</h3>
                    <p style="color: #AAAAAA; margin-bottom: 25px; font-size: 15px;">${mensagem}</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="btnConfirmCancel" class="btn-forgot" style="margin: 0; flex: 1;">Cancelar</button>
                        <button id="btnConfirmOk" class="btn-login" style="background-color: #d9534f; color: white; margin: 0; flex: 1; box-shadow: none;">Confirmar</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('customConfirmModal');
        document.getElementById('btnConfirmCancel').onclick = () => modal.remove();
        document.getElementById('btnConfirmOk').onclick = () => { modal.remove(); callbackConfirmar(); };
    }

    window.logout = function(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "login.html";
    }
});
