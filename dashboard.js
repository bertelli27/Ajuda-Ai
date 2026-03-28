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
    renderizarHistoricoFinanceiro(emailLogado);
});

function carregarDashboard(usuarioAtual, solicitacoes, mensagens, avaliacoes, usuarios) {
    // ================= 1. CÁLCULO DOS CARDS =================
    const emailLogado = usuarioAtual.email;
    const isPrestador = usuarioAtual.tipo === 'prestador'; // Check if user has a provider profile
    
    if (isPrestador) {
        document.getElementById("dashboard-prestador-area").style.display = "block";
    }

    const meusPedidosComoCliente = solicitacoes.filter(s => s.clienteEmail === emailLogado);
    const meusPedidosComoPrestador = solicitacoes.filter(s => s.prestadorEmail === emailLogado);
    const todasMinhasSolicitacoes = [...meusPedidosComoCliente, ...meusPedidosComoPrestador];

    // Cálculos Gerais para Gráfico e Conquistas
    let solicitados = meusPedidosComoCliente.length;
    let emAndamento = todasMinhasSolicitacoes.filter(s => s.status === 'ACEITO').length;
    let concluidos = todasMinhasSolicitacoes.filter(s => s.status === 'CONCLUIDO').length;

    // Dados para o gráfico
    const statusCounts = {
        pendente: todasMinhasSolicitacoes.filter(s => s.status === 'PENDENTE' || s.status === 'AGUARDANDO_CONFIRMACAO').length,
        andamento: emAndamento,
        concluido: concluidos,
        cancelado: todasMinhasSolicitacoes.filter(s => s.status === 'CANCELADO').length,
    };

    // Métricas de Cliente
    document.getElementById("card-solicitados").innerText = solicitados;
    document.getElementById("card-andamento-cliente").innerText = meusPedidosComoCliente.filter(s => s.status === 'ACEITO').length;
    document.getElementById("card-concluidos-cliente").innerText = meusPedidosComoCliente.filter(s => s.status === 'CONCLUIDO').length;

    // Métricas de Prestador
    if (isPrestador) {
        document.getElementById("card-andamento-prestador").innerText = meusPedidosComoPrestador.filter(s => s.status === 'ACEITO').length;
        document.getElementById("card-concluidos-prestador").innerText = meusPedidosComoPrestador.filter(s => s.status === 'CONCLUIDO').length;

        const minhasAvaliacoes = avaliacoes.filter(a => a.prestadorEmail === emailLogado);
        let mediaEstrelas = 'N/A';
        if (minhasAvaliacoes.length > 0) {
            const soma = minhasAvaliacoes.reduce((acc, a) => acc + a.nota, 0);
            mediaEstrelas = `★ ${(soma / minhasAvaliacoes.length).toFixed(1)}`;
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

    // ================= 4. RENDERIZAR GRÁFICO =================
    renderStatusChart(statusCounts);
}

function renderizarHistoricoFinanceiro(emailLogado) {
    const todasTransacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
    // Filtra transações onde o usuário logado é cliente OU prestador
    const minhasTransacoes = todasTransacoes.filter(t => t.clienteEmail === emailLogado || t.prestadorEmail === emailLogado);
    
    minhasTransacoes.sort((a, b) => new Date(b.data) - new Date(a.data)); // Recentes primeiro

    const list = document.getElementById("transactionList");
    if (!list) return;

    if (minhasTransacoes.length === 0) {
        list.innerHTML = '<p style="color: #AAAAAA; text-align: center; margin-top: 20px; background: #393E46; padding: 20px; border-radius: 12px;">Nenhuma transação encontrada.</p>';
    } else {
        list.innerHTML = minhasTransacoes.map(t => {
            const isClienteNestaTx = t.clienteEmail === emailLogado;
            const isEntrada = !isClienteNestaTx;
            const sinal = isEntrada ? '+' : '-';
            const classe = isEntrada ? 'entrada' : 'saida';
            const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let statusTag = '';
            if (t.status === 'RETIDO') statusTag = '<span style="background: #f0ad4e; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Retido</span>';
            else if (t.status === 'CONCLUIDO') statusTag = '<span style="background: #5cb85c; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Concluído</span>';
            else if (t.status === 'CANCELADO') statusTag = '<span style="background: #d9534f; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Estornado</span>';

            const valorExibicao = isClienteNestaTx ? t.valorServico : t.valorPrestador;
            const descricao = isClienteNestaTx ? `Pagamento de Serviço (${t.tipo})` : `Recebimento de Serviço`;

            let detalhesHtml = '';
            if (isEntrada && t.status !== 'CANCELADO') {
                detalhesHtml = `<div class="tx-details">Valor do Serviço: R$ ${t.valorServico.toFixed(2).replace('.', ',')} | Taxa da Plataforma: R$ ${t.taxaPlataforma.toFixed(2).replace('.', ',')}</div>`;
            }

            return `
                <div class="transaction-item ${classe}">
                    <div class="tx-info">
                        <h4>${descricao} ${statusTag}</h4>
                        <p>${dataFormatada}</p>
                        ${detalhesHtml}
                    </div>
                    <div class="tx-valor">
                        ${sinal} R$ ${valorExibicao.toFixed(2).replace('.', ',')}
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderStatusChart(counts) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';

    const data = {
        labels: ['Pendentes', 'Em Andamento', 'Concluídos', 'Cancelados'],
        datasets: [{
            label: 'Serviços',
            data: [counts.pendente, counts.andamento, counts.concluido, counts.cancelado],
            backgroundColor: [
                '#f0ad4e', // Laranja para Pendente
                '#5cb85c', // Verde para Em Andamento
                '#007bff', // Azul para Concluído
                '#d9534f'  // Vermelho para Cancelado
            ],
            borderColor: isLightTheme ? '#FFFFFF' : '#393E46',
            borderWidth: 4
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isLightTheme ? '#4A5568' : '#EEEEEE',
                        font: { size: 14, family: "'Poppins', sans-serif" }
                    }
                }
            }
        }
    });
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
        <a href="home.html">Início</a>
        <a href="servicos.html">Serviços</a>
        <a href="pedidos.html">Meus Pedidos</a>
        <div class="profile-menu-container">
            <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar" onclick="document.getElementById('profileDropdown').classList.toggle('show-dropdown')" style="cursor: pointer;" title="Opções da Conta">
            <div class="profile-dropdown" id="profileDropdown">
                <a href="dashboard.html" style="color: #00ADB5; font-weight: bold;">Dashboard</a>
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