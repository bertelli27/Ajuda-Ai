document.addEventListener("DOMContentLoaded", async function() {
    // ================= VALIDAÇÃO DE LOGIN =================
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        window.location.href = "login.html";
        return;
    }

    // 🚀 Consumindo a Camada de Serviços (Prepara para a API)
    const usuarios = await API.getUsuarios();
    const solicitacoes = await API.getSolicitacoes();
    const avaliacoes = await API.getAvaliacoes();
    const servicos = await API.getServicos();
    const transacoes = await API.getTransacoes();
    
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    if (!usuarioAtual) {
        window.location.href = "login.html";
        return;
    }

    setupHeader(usuarioAtual, usuarios);
    carregarDashboard(usuarioAtual, solicitacoes, avaliacoes, usuarios, servicos, transacoes);
    await renderizarHistoricoFinanceiro(emailLogado);

    // Só renderiza o gráfico financeiro se a seção for visível
    if (usuarioAtual.tipo === 'prestador') {
        await renderEvolucaoFinanceiraChart(emailLogado);
    }

    // Adiciona o evento de clique para o novo botão de exportar
    document.getElementById("btnExportarPDF").addEventListener("click", exportarParaPDF);
    
    // Adiciona o evento de filtro de período para o histórico financeiro
    document.getElementById("filtroPeriodoTransacoes").addEventListener("change", () => {
        renderizarHistoricoFinanceiro(emailLogado);
    });
});

function carregarDashboard(usuarioAtual, solicitacoes, avaliacoes, usuarios, servicos, transacoes) {
    // ================= 0. CABEÇALHO =================
    if (usuarioAtual.nome) document.getElementById('dash-user-name').innerText = usuarioAtual.nome.split(' ')[0];

    // ================= 1. CÁLCULO DOS CARDS =================
    const emailLogado = usuarioAtual.email;
    const isPrestador = usuarioAtual.tipo === 'prestador'; // Check if user has a provider profile
    
    if (isPrestador) {
        document.getElementById("dashboard-prestador-area").style.display = "block";
        document.getElementById("financeiro-section").style.display = "block";
    }

    // Fallbacks para garantir que lê do BD (snake_case) ou do Cache
    const meusPedidosComoCliente = solicitacoes.filter(s => (s.clienteEmail || s.cliente_email) === emailLogado);
    const meusPedidosComoPrestador = solicitacoes.filter(s => (s.prestadorEmail || s.prestador_email) === emailLogado);
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
    const conversasAtivasCliente = meusPedidosComoCliente.filter(s => s.status !== 'CONCLUIDO' && s.status !== 'CANCELADO').length;
    document.getElementById("card-conversas-ativas").innerText = conversasAtivasCliente;

    // Métricas de Prestador
    if (isPrestador) {
        const conversasAtivasPrestador = meusPedidosComoPrestador.filter(s => s.status !== 'CONCLUIDO' && s.status !== 'CANCELADO').length;
        const meusServicos = servicos.filter(s => s.prestadorEmail === emailLogado);

        // Lógica para Serviço Mais Solicitado
        let servicoPopular = 'N/A';
        if (meusPedidosComoPrestador.length > 0) {
            const contagem = meusPedidosComoPrestador.reduce((acc, pedido) => {
                const sId = pedido.servicoId || pedido.servico_id;
                acc[sId] = (acc[sId] || 0) + 1;
                return acc;
            }, {});
            const idMaisPedido = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])[0];
            const servicoEncontrado = servicos.find(s => s.id == idMaisPedido); // Usa == para ignorar String vs Number
            if (servicoEncontrado) servicoPopular = servicoEncontrado.titulo;
        }

        const minhasTransacoesConcluidas = transacoes.filter(t => (t.prestadorEmail || t.prestador_email) === emailLogado && t.status === 'CONCLUIDO');
        const totalRecebido = minhasTransacoesConcluidas.reduce((acc, t) => acc + parseFloat(t.valorPrestador || t.valor_prestador || 0), 0);
        document.getElementById("card-total-recebido").innerText = `R$ ${totalRecebido.toFixed(2).replace('.', ',')}`;

        document.getElementById("card-conversas-ativas-prestador").innerText = conversasAtivasPrestador;
        document.getElementById("card-servicos-publicados").innerText = meusServicos.length;
        document.getElementById("card-servico-popular").innerText = servicoPopular;
        document.getElementById("card-clientes-atendidos").innerText = new Set(meusPedidosComoPrestador.filter(s => s.status === 'CONCLUIDO').map(s => s.clienteEmail)).size;
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
        activityList.innerHTML = `
            <div class="empty-state fade-up-animation" style="padding: 20px;">
                <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 5px;">📭</div>
                <p>Nenhuma atividade registrada ainda.</p>
            </div>`;
    } else {
        activityList.innerHTML = todasMinhasSolicitacoes.slice(0, 5).map(pedido => {
            const euSouCliente = (pedido.clienteEmail || pedido.cliente_email) === emailLogado;
            const outraPessoaEmail = euSouCliente ? (pedido.prestadorEmail || pedido.prestador_email) : (pedido.clienteEmail || pedido.cliente_email);
            const outraPessoa = usuarios.find(u => u.email === outraPessoaEmail);
            const nomeOutraPessoa = outraPessoa ? outraPessoa.nome.split(' ')[0] : 'Usuário';
            
            const textoPessoa = euSouCliente ? `Prestador: ${nomeOutraPessoa}` : `Cliente: ${nomeOutraPessoa}`;
            const dataFormatada = new Date(pedido.dataSolicitacao).toLocaleDateString('pt-BR');
            
            const statusFormatado = formatarStatus(pedido.status, pedido.valorStatus, !euSouCliente);
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

async function getTransacoesFiltradas(emailLogado) {
    const filtroPeriodo = document.getElementById("filtroPeriodoTransacoes").value;
    const todasTransacoes = await API.getTransacoes();
    let minhasTransacoes = todasTransacoes.filter(t => t.clienteEmail === emailLogado || t.prestadorEmail === emailLogado);

    const agora = new Date();
    if (filtroPeriodo === 'mes_atual') {
        minhasTransacoes = minhasTransacoes.filter(t => {
            const dataTransacao = new Date(t.data);
            return dataTransacao.getMonth() === agora.getMonth() && dataTransacao.getFullYear() === agora.getFullYear();
        });
    } else if (filtroPeriodo === 'ultimos_3_meses') {
        const tresMesesAtras = new Date();
        tresMesesAtras.setMonth(agora.getMonth() - 3);
        minhasTransacoes = minhasTransacoes.filter(t => new Date(t.data) >= tresMesesAtras);
    } else if (filtroPeriodo === 'ultimos_6_meses') {
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(agora.getMonth() - 6);
        minhasTransacoes = minhasTransacoes.filter(t => new Date(t.data) >= seisMesesAtras);
    } else if (filtroPeriodo === 'ano_atual') {
        minhasTransacoes = minhasTransacoes.filter(t => new Date(t.data).getFullYear() === agora.getFullYear());
    }
    
    minhasTransacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    return minhasTransacoes;
}

async function renderizarHistoricoFinanceiro(emailLogado) {
    const minhasTransacoes = await getTransacoesFiltradas(emailLogado);
    
    const list = document.getElementById("transactionList");
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
                detalhesHtml = `<div class="tx-details">Valor do Serviço: R$ ${parseFloat(t.valorServico || 0).toFixed(2).replace('.', ',')} | Taxa da Plataforma: R$ ${parseFloat(t.taxaPlataforma || 0).toFixed(2).replace('.', ',')}</div>`;
            }

            return `
                <div class="transaction-item ${classe}">
                    <div class="tx-info">
                        <h4>${descricao} ${statusTag}</h4>
                        <p>${dataFormatada}</p>
                        ${detalhesHtml}
                    </div>
                    <div class="tx-valor">
                        ${sinal} R$ ${parseFloat(valorExibicao || 0).toFixed(2).replace('.', ',')}
                    </div>
                </div>
            `;
        }).join('');
    }
}

async function exportarParaPDF() {
    const emailLogado = API.getSessaoAtual();
    const usuarios = await API.getUsuarios();
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    const minhasTransacoes = await getTransacoesFiltradas(emailLogado);

    if (minhasTransacoes.length === 0) {
        mostrarToast("Não há transações para exportar.", "error");
        return;
    }

    // Desestrutura o jsPDF do objeto window, onde ele é carregado pelo CDN
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adiciona o cabeçalho do documento
    doc.setFontSize(18);
    doc.setTextColor('#00ADB5');
    doc.text("Extrato Financeiro - AjudaAí", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Usuário: ${usuarioAtual.nome}`, 14, 30);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 36);

    // Prepara os dados para a tabela
    const head = [['Data', 'Descrição', 'Tipo', 'Valor (R$)']];
    const body = minhasTransacoes.map(t => {
        const isCliente = t.clienteEmail === emailLogado;
        const isEntrada = !isCliente;
        const sinal = isEntrada ? '+' : '-';
        const valorExibicao = isCliente ? t.valorServico : t.valorPrestador;
        const valorFormatado = `${sinal} ${parseFloat(valorExibicao || 0).toFixed(2).replace('.', ',')}`;
        const dataFormatada = new Date(t.data).toLocaleString('pt-BR', { timeZone: 'UTC' });
        const descricao = isCliente ? `Pagamento de Serviço` : `Recebimento de Serviço`;
        const tipo = isEntrada ? 'Entrada' : 'Saída';

        return [dataFormatada, descricao, tipo, valorFormatado];
    });

    // Gera a tabela usando o plugin autoTable
    doc.autoTable({
        head: head,
        body: body,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [0, 173, 181] }, // Cor #00ADB5 em RGB
        styles: { font: 'helvetica', cellPadding: 3, fontSize: 9 },
        columnStyles: { 3: { halign: 'right' } } // Alinha a coluna de valor à direita
    });

    // Salva o arquivo PDF
    doc.save(`extrato-ajudaai-${new Date().toISOString().slice(0,10)}.pdf`);
}

async function renderEvolucaoFinanceiraChart(emailLogado) {
    const todasTransacoes = await API.getTransacoes();
    const transacoesConcluidas = todasTransacoes.filter(t => 
        ((t.clienteEmail || t.cliente_email) === emailLogado || (t.prestadorEmail || t.prestador_email) === emailLogado) && t.status === 'CONCLUIDO'
    );

    const dataPorMes = {};

    // 1. Preenche previamente os últimos 6 meses para o gráfico nunca ficar "invisível"
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mesAno = d.toISOString().slice(0, 7);
        dataPorMes[mesAno] = { ganhos: 0, gastos: 0 };
    }

    // Agrupa ganhos e gastos por mês
    transacoesConcluidas.forEach(t => {
        const dataVal = t.data || t.criado_em;
        if (!dataVal) return;
        
        const mesAno = new Date(dataVal).toISOString().slice(0, 7); 
        
        if (dataPorMes[mesAno]) { // Só soma se a transação estiver dentro dos últimos 6 meses
            const pEmail = t.prestadorEmail || t.prestador_email;
            const cEmail = t.clienteEmail || t.cliente_email;
            
            if (pEmail === emailLogado) {
                dataPorMes[mesAno].ganhos += parseFloat(t.valorPrestador || t.valor_prestador || 0);
            } else if (cEmail === emailLogado) {
                dataPorMes[mesAno].gastos += parseFloat(t.valorServico || t.valor_total || 0);
            }
        }
    });

    const ultimos6Meses = Object.keys(dataPorMes).sort();

    const labels = ultimos6Meses.map(mes => {
        const [ano, mesNum] = mes.split('-');
        return new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    const ganhosData = ultimos6Meses.map(mes => dataPorMes[mes].ganhos);
    const gastosData = ultimos6Meses.map(mes => dataPorMes[mes].gastos);

    const ctx = document.getElementById('evolucaoFinanceiraChart');
    if (!ctx) return;

    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const gridColor = isLightTheme ? '#E2E8F0' : '#4F5B66';
    const fontColor = isLightTheme ? '#4A5568' : '#EEEEEE';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ganhos (Líquido)',
                    data: ganhosData,
                    borderColor: '#5cb85c',
                    backgroundColor: 'rgba(92, 184, 92, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Gastos',
                    data: gastosData,
                    borderColor: '#d9534f',
                    backgroundColor: 'rgba(217, 83, 79, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top', labels: { color: fontColor, font: { size: 14, family: "'Poppins', sans-serif" } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: fontColor, callback: (value) => 'R$ ' + value }, grid: { color: gridColor } },
                x: { ticks: { color: fontColor }, grid: { color: gridColor } }
            }
        }
    });
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

function formatarStatus(status, valorStatus, isPrestador = false) {
    if (status === 'PENDENTE') {
        if (valorStatus === 'PROPOSTO') return isPrestador ? 'Orçamento Enviado' : 'Orçamento Recebido';
        return 'Aguardando Resposta';
    }
    if (status === 'ACEITO') {
        if (valorStatus === 'ACEITO') return 'Em Andamento';
        return 'Serviço Aceito';
    }
    if (status === 'AGUARDANDO_CONFIRMACAO') return 'Aguard. Confirmação';
    if (status === 'CONCLUIDO') return 'Serviço Concluído';
    if (status === 'CANCELADO') return 'Cancelado';
    return status;
}

// ================= HEADER E LOGOUT =================
function setupHeader(usuarioAtual, usuarios) {
    const menu = document.getElementById("menu");
    if (!menu) return;

    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) return;

    const usuarioLogado = usuarios.find(u => u.email === emailLogado);
    if (!usuarioLogado) {
        // Fallback caso o usuário não seja encontrado na lista principal
        menu.innerHTML = `
            <a href="index.html">Início</a>
            <a href="servicos.html">Serviços</a>
            <a href="login.html">Entrar</a>
            <a href="register.html">Cadastrar</a>
        `;
        return;
    }

    const fotoPerfil = usuarioLogado.fotoPerfil || 'img/avatar_padrao.png';
    const primeiroNome = usuarioAtual.nome.split(' ')[0];
    const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
    
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
                <a href="dashboard.html" class="active-nav">Dashboard</a>
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

function logout(e) {
    if (e) e.preventDefault();
    API.fazerLogout();
    window.location.href = "login.html";
}