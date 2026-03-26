document.addEventListener("DOMContentLoaded", function() {
    // ================= VALIDAÇÃO DE LOGIN =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) {
        window.location.href = "index.html";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
    const mensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
    const avaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];
    
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    if (!usuarioAtual) {
        window.location.href = "index.html";
        return;
    }

    setupHeader(usuarioAtual);
    carregarDashboard(usuarioAtual, solicitacoes, mensagens, avaliacoes, usuarios);
});

function carregarDashboard(usuarioAtual, solicitacoes, mensagens, avaliacoes, usuarios) {
    // ================= 1. CÁLCULO DOS CARDS =================
    const emailLogado = usuarioAtual.email;
    const isPrestador = usuarioAtual.tipo === 'prestador';

    const meusPedidosComoCliente = solicitacoes.filter(s => s.clienteEmail === emailLogado);
    const meusPedidosComoPrestador = solicitacoes.filter(s => s.prestadorEmail === emailLogado);
    const todasMinhasSolicitacoes = [...meusPedidosComoCliente, ...meusPedidosComoPrestador];

    let solicitados = meusPedidosComoCliente.length;
    let emAndamento = todasMinhasSolicitacoes.filter(s => s.status === 'ACEITO').length;
    let concluidos = todasMinhasSolicitacoes.filter(s => s.status === 'CONCLUIDO').length;

    // Mensagens não lidas
    const meusPedidosIds = todasMinhasSolicitacoes.map(s => s.id);
    const naoLidas = mensagens.filter(m => meusPedidosIds.includes(m.id_solicitacao) && m.remetenteEmail !== emailLogado && !m.lida).length;

    // Preencher cards básicos
    document.getElementById("card-solicitados").innerText = solicitados;
    document.getElementById("card-andamento").innerText = emAndamento;
    document.getElementById("card-concluidos").innerText = concluidos;
    document.getElementById("card-mensagens").innerText = naoLidas;

    // Cards de prestador (Avaliação)
    if (isPrestador) {
        const wrapperAvaliacao = document.getElementById("wrapper-avaliacao");
        wrapperAvaliacao.style.display = 'block';

        const minhasAvaliacoes = avaliacoes.filter(a => a.prestadorEmail === emailLogado);
        let mediaEstrelas = 'N/A';
        if (minhasAvaliacoes.length > 0) {
            const soma = minhasAvaliacoes.reduce((acc, a) => acc + a.nota, 0);
            mediaEstrelas = (soma / minhasAvaliacoes.length).toFixed(1);
        }
        document.getElementById("card-avaliacao").innerText = mediaEstrelas;
    }

    // ================= 2. ATIVIDADES RECENTES =================
    todasMinhasSolicitacoes.sort((a, b) => new Date(b.dataSolicitacao) - new Date(a.dataSolicitacao)); // Mais recentes primeiro
    const activityList = document.getElementById("activity-list");
    
    if (todasMinhasSolicitacoes.length === 0) {
        activityList.innerHTML = '<p style="color: #AAAAAA;">Nenhuma atividade registrada ainda.</p>';
    } else {
        activityList.innerHTML = todasMinhasSolicitacoes.slice(0, 5).map(pedido => {
            const euSouCliente = pedido.clienteEmail === emailLogado;
            const outraPessoaEmail = euSouCliente ? pedido.prestadorEmail : pedido.clienteEmail;
            const outraPessoa = usuarios.find(u => u.email === outraPessoaEmail);
            const nomeOutraPessoa = outraPessoa ? outraPessoa.nome.split(' ')[0] : 'Usuário';
            
            const textoPessoa = euSouCliente ? `Prestador: ${nomeOutraPessoa}` : `Cliente: ${nomeOutraPessoa}`;
            const dataFormatada = new Date(pedido.dataSolicitacao).toLocaleDateString('pt-BR');
            
            const statusFormatado = formatarStatus(pedido.status, pedido.valorStatus);
            let badgeClass = `status-${pedido.status.toLowerCase()}`;

            return `
                <div class="activity-card" style="cursor: pointer;" onclick="window.location.href='pedidos.html'">
                    <div class="activity-info">
                        <span class="activity-title">${pedido.servico}</span>
                        <span class="activity-meta">${textoPessoa} &bull; ${dataFormatada}</span>
                    </div>
                    <span class="status ${badgeClass}">${statusFormatado}</span>
                </div>
            `;
        }).join('');
    }

    // ================= 3. CONQUISTAS (OPCIONAL) =================
    const achievementsList = document.getElementById("achievements-list");
    let achievements = [];
    
    // Lógica dinâmica para conquistas
    if (solicitados > 0 || meusPedidosComoPrestador.length > 0) {
        achievements.push({ icon: '🎉', title: 'Primeiro Passo', desc: 'Iniciou sua jornada no AjudaAí.' });
    }
    if (concluidos > 0) {
        achievements.push({ icon: '🤝', title: 'Negócio Fechado', desc: 'Primeiro serviço concluído.' });
    }
    if (concluidos >= 5) {
        achievements.push({ icon: '🏆', title: 'Veterano', desc: 'Completou 5 serviços com sucesso!' });
    }
    if (usuarioAtual.fotoPerfil) {
        achievements.push({ icon: '📸', title: 'Apresentável', desc: 'Adicionou uma foto de perfil.' });
    }

    if (achievements.length === 0) {
        achievementsList.innerHTML = '<p style="color: #AAAAAA; font-size: 13px;">Interaja na plataforma para ganhar selos!</p>';
    } else {
        achievementsList.innerHTML = achievements.map(ach => `
            <div class="achievement-card">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-details">
                    <h4>${ach.title}</h4>
                    <p>${ach.desc}</p>
                </div>
            </div>
        `).join('');
    }
}

function formatarStatus(status, valorStatus) {
    if (status === 'PENDENTE') {
        if (valorStatus === 'PROPOSTO') return 'Orçamento Enviado';
        return 'Aguardando Orçamento';
    }
    if (status === 'ACEITO') return 'Em Andamento';
    if (status === 'AGUARDANDO_CONFIRMACAO') return 'Aguard. Confirmação';
    if (status === 'CONCLUIDO') return 'Finalizado';
    if (status === 'CANCELADO') return 'Cancelado';
    return status;
}

// ================= HEADER E LOGOUT =================
function setupHeader(usuarioAtual) {
    const menu = document.getElementById("menu");
    if (!menu) return;
    const fotoPerfil = usuarioAtual?.fotoPerfil || 'img/avatar_padrao.png';
    
    menu.innerHTML = `
        <a href="dashboard.html" style="color: #00ADB5; font-weight: bold;">Dashboard</a>
        <a href="servicos.html">Serviços</a>
        <a href="pedidos.html">Meus Pedidos</a>
        <div class="profile-menu-container">
            <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar" onclick="document.getElementById('profileDropdown').classList.toggle('show-dropdown')" style="cursor: pointer;" title="Opções da Conta">
            <div class="profile-dropdown" id="profileDropdown">
                <a href="perfil.html">Meu Perfil</a>
                <a href="#" onclick="logout(event)">Sair</a>
            </div>
        </div>
    `;
    if (typeof atualizarBadgeNotificacao === 'function') atualizarBadgeNotificacao();
}

function logout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("usuarioLogado");
    sessionStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
}