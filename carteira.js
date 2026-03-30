document.addEventListener("DOMContentLoaded", function() {
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) {
        window.location.href = "index.html";
        return;
    }

    function renderizarCarteira() {
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const usuarioAtual = usuarios.find(u => u.email === emailLogado);
        
        const saldo = usuarioAtual.saldo || 0;
        document.getElementById("walletBalance").innerText = `R$ ${saldo.toFixed(2).replace('.', ',')}`;

        const todasTransacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
        const minhasTransacoes = todasTransacoes.filter(t => t.userEmail === emailLogado);
        
        minhasTransacoes.sort((a, b) => new Date(b.data) - new Date(a.data)); // Recentes primeiro

        const list = document.getElementById("transactionList");
        if (minhasTransacoes.length === 0) {
            list.innerHTML = `
                <div class="empty-state fade-up-animation transaction-item" style="justify-content: center; flex-direction: column;">
                    <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 10px;">💸</div>
                    <p>Nenhuma transação encontrada.</p>
                </div>`;
        } else {
            list.innerHTML = minhasTransacoes.map(t => {
                const isEntrada = t.tipo === 'ENTRADA';
                const sinal = isEntrada ? '+' : '-';
                const classe = isEntrada ? 'entrada' : 'saida';
                const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="transaction-item ${classe}">
                        <div class="tx-info">
                            <h4>${t.descricao}</h4>
                            <p>${dataFormatada}</p>
                        </div>
                        <div class="tx-valor">
                            ${sinal} R$ ${parseFloat(t.valor).toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    document.getElementById("btnSacar").addEventListener("click", () => {
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const userIndex = usuarios.findIndex(u => u.email === emailLogado);
        const saldo = usuarios[userIndex].saldo || 0;

        if (saldo <= 0) {
            mostrarToast("Você não possui saldo para sacar.", "error");
            return;
        }

        const valorStr = prompt(`Saldo disponível: R$ ${saldo.toFixed(2)}\nDigite o valor que deseja sacar:`);
        if (!valorStr) return;
        
        const valorNum = parseFloat(valorStr.replace(',', '.'));
        if (isNaN(valorNum) || valorNum <= 0 || valorNum > saldo) {
            mostrarToast("Valor inválido para saque.", "error");
            return;
        }

        usuarios[userIndex].saldo -= valorNum;
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        const transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
        transacoes.push({ id: 'TX-' + Date.now(), userEmail: emailLogado, tipo: 'SAIDA', descricao: 'Saque para Conta Bancária', valor: valorNum, data: new Date().toISOString() });
        localStorage.setItem("transacoes", JSON.stringify(transacoes));

        mostrarToast("Saque realizado com sucesso!", "success");
        renderizarCarteira();
    });

    // Botão auxiliar para testes do TCC
    document.getElementById("btnDepositar").addEventListener("click", () => {
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const userIndex = usuarios.findIndex(u => u.email === emailLogado);
        usuarios[userIndex].saldo = (usuarios[userIndex].saldo || 0) + 500; // Adiciona R$500 fictícios
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        
        const transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
        transacoes.push({ id: 'TX-' + Date.now(), userEmail: emailLogado, tipo: 'ENTRADA', descricao: 'Depósito via Pix (Teste)', valor: 500, data: new Date().toISOString() });
        localStorage.setItem("transacoes", JSON.stringify(transacoes));

        mostrarToast("Saldo de teste adicionado!", "success");
        renderizarCarteira();
    });

    renderizarCarteira();
    setupHeader();

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
        const primeiroNome = usuarioLogado.nome.split(' ')[0];
        const textoPedidos = usuarioLogado.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        menu.innerHTML = `
            <a href="home.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html">${textoPedidos}</a>
            <a href="carteira.html" class="active-nav">Finanças</a>
            <div class="profile-menu-container">
                <a href="#" id="avatarMenuBtn" class="menu-avatar-link" title="Opções da Conta">
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