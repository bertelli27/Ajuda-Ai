document.addEventListener("DOMContentLoaded", async function() {
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        window.location.href = "login.html";
        return;
    }

    const usuarios = await API.getUsuarios();
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    
    if (usuarioAtual && usuarioAtual.tipo === 'admin') {
        window.location.href = "index.html";
        return;
    }

    async function renderizarCarteira() {
        const list = document.getElementById("transactionList");
        const walletBalance = document.getElementById("walletBalance");

        if(list) list.innerHTML = '<div style="text-align:center; padding: 20px; color:#AAAAAA;">Carregando transações da API...</div>';
        if(walletBalance) walletBalance.style.display = 'block';

        // 🚀 Busca as transações REAIS da API
        const minhasTransacoes = await API.getTransacoes();
        
        minhasTransacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        // 🚀 Calcula o saldo REAL
        // Soma apenas os recebimentos (onde ele é prestador) cujo status é CONCLUIDO (Liberado)
        let saldoReal = 0;
        minhasTransacoes.forEach(t => {
            if (t.prestadorEmail === emailLogado && t.status === 'CONCLUIDO' && t.tipo === 'PAGAMENTO') {
                saldoReal += parseFloat(t.valorPrestador);
            }
        });

        if(walletBalance) walletBalance.innerText = `R$ ${saldoReal.toFixed(2).replace('.', ',')}`;

        if (!list) return;

        if (minhasTransacoes.length === 0) {
            list.innerHTML = `
                <div class="empty-state fade-up-animation transaction-item" style="justify-content: center; flex-direction: column;">
                    <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 10px;">💸</div>
                    <p>Nenhuma transação encontrada.</p>
                </div>`;
        } else {
            list.innerHTML = minhasTransacoes.map(t => {
                const isClienteNestaTx = t.clienteEmail === emailLogado;
                const isEntrada = !isClienteNestaTx && t.tipo === 'PAGAMENTO';
                const sinal = isEntrada ? '+' : '-';
                const classe = isEntrada ? 'entrada' : 'saida';
                const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                let statusTag = '';
                if (t.status === 'RETIDO') statusTag = '<span style="background: #f0ad4e; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Retido</span>';
                else if (t.status === 'CONCLUIDO') statusTag = '<span style="background: #5cb85c; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Liberado</span>';
                else if (t.status === 'CANCELADO') statusTag = '<span style="background: #d9534f; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Estornado</span>';

                const valorExibicao = isClienteNestaTx ? t.valorServico : t.valorPrestador;
                const descricao = isClienteNestaTx ? `Pagamento de Serviço` : `Recebimento de Serviço`;

                return `
                    <div class="transaction-item ${classe}">
                        <div class="tx-info">
                            <h4>${descricao} ${statusTag}</h4>
                            <p>${dataFormatada}</p>
                        </div>
                        <div class="tx-valor">
                            ${sinal} R$ ${parseFloat(valorExibicao).toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Botões temporariamente desativados/mockados para a fase do TCC
    document.getElementById("btnSacar")?.addEventListener("click", () => {
        mostrarToast("A funcionalidade de saque real (API) será integrada no futuro.", "error");
    });
    document.getElementById("btnDepositar")?.addEventListener("click", () => {
        mostrarToast("Depósitos de teste desativados nesta fase.", "error");
    });

    renderizarCarteira();
    setupHeader();

    // ================= HEADER E LOGOUT =================
    window.logout = function(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "login.html";
    }

    async function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;
        if(!usuarioAtual) return;
        
        const fotoPerfil = usuarioAtual?.fotoPerfil || '../img/avatar_padrao.png';
        const primeiroNome = usuarioAtual.nome.split(' ')[0];
        const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        
        menu.innerHTML = `
            <a href="index.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="pedidos.html">${textoPedidos}</a>
            <a href="carteira.html" class="active-nav">Finanças</a>
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
