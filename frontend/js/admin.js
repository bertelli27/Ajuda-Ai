document.addEventListener("DOMContentLoaded", async function() {
    
    // ================= 1. PROTEÇÃO DE ROTA (FRONT-END) =================
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        window.location.href = "login.html";
        return;
    }

    // Pega os dados básicos para montar o Header
    const usuariosIniciais = await API.getUsuarios();
    const usuarioAtual = usuariosIniciais.find(u => u.email === emailLogado);
    
    if (!usuarioAtual || usuarioAtual.tipo !== 'admin') {
        mostrarToast("Acesso Restrito: Você não tem privilégios administrativos.", "error");
        setTimeout(() => window.location.href = "dashboard.html", 2000);
        return;
    }

    setupAdminHeader(usuarioAtual);

    // ================= 2. LÓGICA DAS ABAS =================
    const btnTabUsuarios = document.getElementById("btnTabUsuarios");
    const btnTabLogs = document.getElementById("btnTabLogs");
    const sectionUsuarios = document.getElementById("usuarios-section");
    const sectionLogs = document.getElementById("logs-section");

    // 🚀 INJEÇÃO DINÂMICA: Criar aba de Dashboard (Visão Geral)
    const tabsContainer = btnTabUsuarios.parentElement;
    if (!document.getElementById("btnTabDashboard")) {
        tabsContainer.insertAdjacentHTML('afterbegin', `<button id="btnTabDashboard" class="tab-btn active" style="margin-right: 10px;">📊 Visão Geral</button>`);
        sectionUsuarios.parentElement.insertAdjacentHTML('afterbegin', `
            <div id="dashboard-section" class="aba-conteudo" style="display: block;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; margin-bottom: 30px; margin-top: 20px;">
                    <div style="background: #393E46; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <h3 style="color: #00ADB5; margin-bottom: 20px; font-size: 16px; text-align: center;">📈 GMV e Receita Líquida (6 Meses)</h3>
                        <canvas id="chartFinanceiroAdmin"></canvas>
                    </div>
                    <div style="background: #393E46; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <h3 style="color: #00ADB5; margin-bottom: 20px; font-size: 16px; text-align: center;">👥 Novos Usuários Registrados</h3>
                        <canvas id="chartUsuariosAdmin"></canvas>
                    </div>
                    <div style="background: #393E46; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <h3 style="color: #00ADB5; margin-bottom: 20px; font-size: 16px; text-align: center;">🛠️ Serviços por Categoria</h3>
                        <canvas id="chartCategoriasAdmin"></canvas>
                    </div>
                    <div style="background: #393E46; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <h3 style="color: #00ADB5; margin-bottom: 20px; font-size: 16px; text-align: center;">🎯 Status Global dos Pedidos</h3>
                        <canvas id="chartPedidosAdmin"></canvas>
                    </div>
                </div>
            </div>
        `);
        btnTabUsuarios.classList.remove("active");
        sectionUsuarios.style.display = "none";
    }

    const btnTabDashboard = document.getElementById("btnTabDashboard");
    const sectionDashboard = document.getElementById("dashboard-section");

    btnTabDashboard?.addEventListener("click", () => {
        btnTabDashboard.classList.add("active");
        btnTabUsuarios.classList.remove("active");
        btnTabLogs.classList.remove("active");
        sectionDashboard.style.display = "block";
        sectionUsuarios.style.display = "none";
        sectionLogs.style.display = "none";
    });

    btnTabUsuarios.addEventListener("click", () => {
        btnTabUsuarios.classList.add("active");
        btnTabLogs.classList.remove("active");
        btnTabDashboard?.classList.remove("active");
        sectionUsuarios.style.display = "block";
        sectionLogs.style.display = "none";
        if (sectionDashboard) sectionDashboard.style.display = "none";
    });

    btnTabLogs.addEventListener("click", () => {
        btnTabLogs.classList.add("active");
        btnTabUsuarios.classList.remove("active");
        btnTabDashboard?.classList.remove("active");
        sectionLogs.style.display = "block";
        sectionUsuarios.style.display = "none";
        if (sectionDashboard) sectionDashboard.style.display = "none";
        carregarLogs(); // Carrega os logs ao clicar na aba
    });

    // ================= LÓGICA DAS SUB-ABAS DE LOGS E MODAL =================
    const btnSubTabServicos = document.getElementById("btnSubTabServicos");
    const btnSubTabContas = document.getElementById("btnSubTabContas");
    const btnAuditoriaAvancada = document.getElementById("btnAuditoriaAvancada");
    const adminLogsModal = document.getElementById("adminLogsModal");

    btnSubTabServicos?.addEventListener("click", () => {
        btnSubTabServicos.classList.add("active");
        btnSubTabContas.classList.remove("active");
        renderizarAbaAtivaLogs();
    });

    btnSubTabContas?.addEventListener("click", () => {
        btnSubTabContas.classList.add("active");
        btnSubTabServicos.classList.remove("active");
        renderizarAbaAtivaLogs();
    });

    btnAuditoriaAvancada?.addEventListener("click", () => {
        adminLogsModal.style.display = "flex";
        renderizarModalLogsAdmin();
    });

    document.getElementById("closeAdminLogsModal")?.addEventListener("click", () => adminLogsModal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === adminLogsModal) adminLogsModal.style.display = "none"; });

    // Variável para guardar os logs sem precisar ficar chamando a API toda hora
    let cacheLogsData = null;
    let cacheUsuariosData = null;

    // ================= 2.5 INJEÇÃO DINÂMICA DA INTERFACE DE FILTROS =================
    const tabelaUsuarios = document.getElementById("tabela-usuarios-body")?.closest('table');
    if (tabelaUsuarios && !document.getElementById("filtroTipoUsuario")) {
        tabelaUsuarios.insertAdjacentHTML('beforebegin', `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; gap: 15px;">
                    <select id="filtroTipoUsuario" style="background: #2A343D; border: 1px solid #4F5B66; color: #EEE; padding: 10px; border-radius: 8px;">
                        <option value="todos">Todos os Tipos</option>
                        <option value="cliente">Apenas Clientes</option>
                        <option value="prestador">Apenas Prestadores</option>
                        <option value="admin">Apenas Administradores</option>
                    </select>
                    <select id="filtroStatusUsuario" style="background: #2A343D; border: 1px solid #4F5B66; color: #EEE; padding: 10px; border-radius: 8px;">
                        <option value="todos">Todos os Status</option>
                        <option value="ativos">Apenas Ativos</option>
                        <option value="inativos">Inativos / Banidos</option>
                    </select>
                </div>
                <button id="btnExportarUsuarios" class="btn-login" style="width: auto; background: #5cb85c; padding: 10px 20px; box-shadow: none;">📥 Exportar Usuários (CSV)</button>
            </div>
        `);
    }

    const tabelaLogs = document.getElementById("tabela-logs-body")?.closest('table');
    if (tabelaLogs && !document.getElementById("filtroAcaoLog")) {
        tabelaLogs.insertAdjacentHTML('beforebegin', `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; margin-top: 20px; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; gap: 15px;">
                    <select id="filtroAcaoLog" style="background: #2A343D; border: 1px solid #4F5B66; color: #EEE; padding: 10px; border-radius: 8px;">
                        <option value="todas">Todas as Ações</option>
                        <option value="CRIACAO_SERVICO">Criação de Serviço</option>
                        <option value="NOVO_PEDIDO">Novos Pedidos</option>
                        <option value="STATUS_ATUALIZADO">Atualização de Status</option>
                        <option value="LOGIN">Logins</option>
                        <option value="ATUALIZAR_PERFIL">Atualizações de Perfil</option>
                        <option value="EXCLUSAO_LOGICA">Exclusões de Conta</option>
                    </select>
                </div>
                <button id="btnExportarLogs" class="btn-login" style="width: auto; background: #5cb85c; padding: 10px 20px; box-shadow: none;">📥 Exportar Auditoria (CSV)</button>
            </div>
        `);
    }

    // ================= 3. CARREGAR DADOS =================
    carregarUsuarios();
    carregarDashboardAdmin();

    async function carregarUsuarios() {
        const tbody = document.getElementById("tabela-usuarios-body");
        try {
            const resposta = await API.getTodosUsuariosAdmin();
            cacheUsuariosData = resposta.usuarios;
            const kpis = resposta.kpis;
            
            // 🚀 Preenche os Cards de KPIs no topo da página
            document.getElementById("kpi-usuarios").innerText = kpis.totalUsuarios;
            document.getElementById("kpi-servicos").innerText = kpis.servicosAndamento;
            document.getElementById("kpi-gmv").innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.gmv);
            document.getElementById("kpi-receita").innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.receita);
            renderizarUsuarios();
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #d9534f;">Erro ao carregar usuários: ${error.message}</td></tr>`;
        }
    }

    function renderizarUsuarios() {
        const tbody = document.getElementById("tabela-usuarios-body");
        if (!cacheUsuariosData) return;
        
        let listaUsuarios = [...cacheUsuariosData];
        const filtroTipo = document.getElementById("filtroTipoUsuario")?.value || 'todos';
        const filtroStatus = document.getElementById("filtroStatusUsuario")?.value || 'todos';

        if (filtroTipo !== 'todos') listaUsuarios = listaUsuarios.filter(u => u.tipo === filtroTipo);
        if (filtroStatus !== 'todos') listaUsuarios = listaUsuarios.filter(u => !!u.ativo === (filtroStatus === 'ativos'));

        if (listaUsuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Nenhum usuário encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = listaUsuarios.map(u => {
                const badgeTipo = u.tipo === 'admin' ? 'badge-admin' : (u.tipo === 'cliente' ? 'badge-cliente' : 'badge-prestador');
                const badgeStatus = u.ativo ? 'badge-ativo' : 'badge-inativo';
                const statusTexto = u.ativo ? 'Ativo' : 'Inativo';
                const dataCriacao = new Date(u.criado_em).toLocaleDateString('pt-BR');
                
                // Botão de banir só aparece se o usuário estiver ativo E não for admin
                let btnBanir = '';
                if (u.ativo && u.tipo !== 'admin') {
                    btnBanir = `<button class="btn-danger-small" onclick="abrirModalBanir('${u.id}', '${u.nome}')">Banir</button>`;
                } else if (!u.ativo) {
                    if (u.exclusao_logica > 0) {
                        btnBanir = `<span style="font-size: 12px; color: #AAAAAA;" data-tooltip="Conta desativada pelo próprio usuário." data-tooltip-dir="left">Auto-excluído</span>`;
                    } else {
                        btnBanir = `<span style="font-size: 12px; color: #d9534f;" data-tooltip="Conta banida por um Administrador." data-tooltip-dir="left">Banido</span>`;
                    }
                }

                return `
                    <tr>
                        <td>#${u.id}</td>
                        <td>
                            <strong style="color: #EEEEEE;">${u.nome}</strong><br>
                            <span style="color: #AAAAAA; font-size: 12px;">${u.email}</span>
                        </td>
                        <td><span class="badge ${badgeTipo}">${u.tipo}</span></td>
                        <td><span class="badge ${badgeStatus}">${statusTexto}</span></td>
                        <td>${dataCriacao}</td>
                        <td>${btnBanir}</td>
                    </tr>
                `;
            }).join('');
    }

    async function carregarLogs() {
        try {
            // Busca da API só na primeira vez ou se estiver forçando recarregamento
            if (!cacheLogsData) {
                cacheLogsData = await API.getLogsAdmin();
            }
            renderizarAbaAtivaLogs();
        } catch (error) {
            document.getElementById("tabela-logs-body").innerHTML = `<tr><td colspan="5" style="text-align: center; color: #d9534f;">Erro ao carregar logs: ${error.message}</td></tr>`;
        }
    }

    function renderizarAbaAtivaLogs() {
        const tbody = document.getElementById("tabela-logs-body");
        if (!cacheLogsData) return;

        const isTabServicos = document.getElementById("btnSubTabServicos").classList.contains("active");
        let logsParaMostrar = isTabServicos ? [...cacheLogsData.logsServicos] : [...cacheLogsData.logsUsuarios];
        const corDestaque = isTabServicos ? '#f0ad4e' : '#00ADB5';

        const filtroAcao = document.getElementById("filtroAcaoLog")?.value || 'todas';
        if (filtroAcao !== 'todas') {
            logsParaMostrar = logsParaMostrar.filter(l => l.acao === filtroAcao);
        }

        if (!logsParaMostrar || logsParaMostrar.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado nesta categoria.</td></tr>`;
            return;
        }

        tbody.innerHTML = logsParaMostrar.map(log => {
            const dataCriacao = new Date(log.criado_em).toLocaleString('pt-BR');
            const nomeUser = log.usuario_nome || 'Desconhecido';
            const emailUser = log.usuario_email || 'Sistema';
            const tipoUser = log.usuario_tipo || 'N/A';
            
            // Cria a badge visual para o tipo
            const badgeClass = tipoUser === 'prestador' ? 'badge-prestador' : (tipoUser === 'cliente' ? 'badge-cliente' : '');
            const badgeHTML = tipoUser !== 'N/A' ? `<span class="badge ${badgeClass}">${tipoUser}</span>` : `<span style="color: #888;">${tipoUser}</span>`;
            
            let alvoInfo = isTabServicos ? `<strong>Pedido #${log.solicitacao_id}</strong><br>${log.detalhes}` : log.detalhes;

            return `
                <tr>
                    <td style="white-space: nowrap;">${dataCriacao}</td>
                    <td><strong>${nomeUser}</strong><br><span style="font-size: 11px; color: #AAAAAA;">${emailUser}</span></td>
                    <td>${badgeHTML}</td>
                    <td><strong style="color: ${corDestaque}; font-size: 13px;">${log.acao}</strong></td>
                    <td style="color: #CCCCCC; font-size: 13px;">${alvoInfo}</td>
                    <td style="font-size: 11px; color: #888888;">${log.ip_endereco || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    }

    function renderizarModalLogsAdmin() {
        const tbody = document.getElementById("tabela-admin-logs-body");
        const logsAdmin = cacheLogsData?.logsAdministradores;

        if (!logsAdmin || logsAdmin.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">O Livro Preto está vazio.</td></tr>`;
            return;
        }

        tbody.innerHTML = logsAdmin.map(log => {
            const dataCriacao = new Date(log.criado_em).toLocaleString('pt-BR');
            return `
                <tr>
                    <td style="white-space: nowrap; font-size: 13px;">${dataCriacao}</td>
                    <td><strong style="color: #EEEEEE;">${log.admin_nome || 'Sistema'}</strong></td>
                    <td><span style="background: rgba(217, 83, 79, 0.2); color: #d9534f; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${log.acao}</span></td>
                    <td style="color: #00ADB5; font-size: 13px;">${log.alvo_tipo.toUpperCase()} #${log.alvo_id}</td>
                    <td style="color: #AAAAAA; font-size: 13px; font-style: italic;">"${log.justificativa}"</td>
                </tr>
            `;
        }).join('');
    }

    // ================= 4. AÇÕES DO MODAL DE BANIMENTO =================
    let idParaBanir = null;
    const modal = document.getElementById("banirModal");
    
    window.abrirModalBanir = function(id, nome) {
        idParaBanir = id;
        document.getElementById("banNomeUsuario").innerText = nome;
        document.getElementById("motivoBan").value = "";
        modal.style.display = "block";
    };

    document.getElementById("closeBanirModal").addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    document.getElementById("btnConfirmarBan").addEventListener("click", async function() {
        const motivo = document.getElementById("motivoBan").value.trim();
        if (!motivo) {
            mostrarToast("A justificativa é obrigatória para a auditoria.", "error");
            return;
        }

        setButtonLoading(this);
        try {
            await API.banirUsuarioAdmin(idParaBanir, motivo);
            mostrarToast("Usuário banido com sucesso!", "success");
            modal.style.display = "none";
            carregarUsuarios(); // Recarrega a tabela
        } catch (error) {
            mostrarToast(error.message, "error");
        } finally {
            removeButtonLoading(this);
        }
    });

    // ================= EVENT LISTENERS DOS FILTROS E EXPORTAÇÃO =================
    document.getElementById("filtroTipoUsuario")?.addEventListener("change", renderizarUsuarios);
    document.getElementById("filtroStatusUsuario")?.addEventListener("change", renderizarUsuarios);
    document.getElementById("filtroAcaoLog")?.addEventListener("change", renderizarAbaAtivaLogs);

    document.getElementById("btnExportarUsuarios")?.addEventListener("click", () => {
        if (!cacheUsuariosData) return;
        
        let listaUsuarios = [...cacheUsuariosData];
        const filtroTipo = document.getElementById("filtroTipoUsuario")?.value || 'todos';
        const filtroStatus = document.getElementById("filtroStatusUsuario")?.value || 'todos';

        if (filtroTipo !== 'todos') listaUsuarios = listaUsuarios.filter(u => u.tipo === filtroTipo);
        if (filtroStatus !== 'todos') listaUsuarios = listaUsuarios.filter(u => !!u.ativo === (filtroStatus === 'ativos'));

        const dadosLimpos = listaUsuarios.map(u => ({
            ID: u.id,
            Nome: u.nome,
            Email: u.email,
            Telefone: u.telefone || 'N/A',
            Tipo: u.tipo.toUpperCase(),
            Status: u.ativo ? 'Ativo' : 'Inativo',
            Data_Cadastro: new Date(u.criado_em).toLocaleDateString('pt-BR')
        }));

        exportarDadosParaCSV(dadosLimpos, `usuarios_${filtroTipo}_${filtroStatus}.csv`);
    });

    document.getElementById("btnExportarLogs")?.addEventListener("click", () => {
        if (!cacheLogsData) return;
        
        const isTabServicos = document.getElementById("btnSubTabServicos").classList.contains("active");
        let logsParaMostrar = isTabServicos ? [...cacheLogsData.logsServicos] : [...cacheLogsData.logsUsuarios];
        
        const filtroAcao = document.getElementById("filtroAcaoLog")?.value || 'todas';
        if (filtroAcao !== 'todas') logsParaMostrar = logsParaMostrar.filter(l => l.acao === filtroAcao);

        const dadosLimpos = logsParaMostrar.map(log => ({
            Data_Hora: new Date(log.criado_em).toLocaleString('pt-BR'),
            Usuario: log.usuario_nome || 'Sistema',
            Email: log.usuario_email || 'N/A',
            Tipo_Conta: (log.usuario_tipo || 'N/A').toUpperCase(),
            Acao: log.acao,
            Alvo: isTabServicos ? `Pedido #${log.solicitacao_id}` : 'Conta/Usuário',
            Detalhes: log.detalhes,
            IP: log.ip_endereco || 'N/A'
        }));

        exportarDadosParaCSV(dadosLimpos, `auditoria_${isTabServicos ? 'servicos' : 'usuarios'}_${filtroAcao}.csv`);
    });
});

function renderChartError(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px 'Poppins', sans-serif";
    ctx.fillStyle = '#d9534f';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

async function carregarDashboardAdmin() {
    // Se a biblioteca Chart.js não existir, injeta dinamicamente via CDN
    if (!window.Chart) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    
    try {
        const stats = await API.getDashboardStatsAdmin();
        renderAdminCharts(stats);
    } catch(e) {
        console.error("Falha ao carregar estatísticas do dashboard:", e);
        renderChartError('chartFinanceiroAdmin', 'Erro ao carregar dados financeiros.');
        renderChartError('chartUsuariosAdmin', 'Erro ao carregar dados de usuários.');
        renderChartError('chartCategoriasAdmin', 'Erro ao carregar dados de categorias.');
        renderChartError('chartPedidosAdmin', 'Erro ao carregar dados de pedidos.');
    }
}

function renderAdminCharts(stats) {
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const fontColor = isLightTheme ? '#4A5568' : '#EEEEEE';
    const gridColor = isLightTheme ? '#E2E8F0' : '#4F5B66';

    // Gera os últimos 6 meses retroativos para o gráfico ter consistência temporal
    const ultimos6Meses = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        ultimos6Meses.push(d.toISOString().slice(0, 7));
    }
    const labelsMeses = ultimos6Meses.map(m => {
        const [ano, mes] = m.split('-');
        return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    // 1. Gráfico Financeiro (Linhas)
    const dataGMV = ultimos6Meses.map(m => { const item = stats.financeiro.find(f => f.mes === m); return item ? parseFloat(item.gmv) : 0; });
    const dataReceita = ultimos6Meses.map(m => { const item = stats.financeiro.find(f => f.mes === m); return item ? parseFloat(item.receita) : 0; });

    new Chart(document.getElementById('chartFinanceiroAdmin'), {
        type: 'line',
        data: {
            labels: labelsMeses,
            datasets: [
                { label: 'GMV (Transacionado)', data: dataGMV, borderColor: '#00ADB5', backgroundColor: 'rgba(0, 173, 181, 0.1)', fill: true, tension: 0.3 },
                { label: 'Receita (Taxas)', data: dataReceita, borderColor: '#5cb85c', backgroundColor: 'rgba(92, 184, 92, 0.1)', fill: true, tension: 0.3 }
            ]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: fontColor } } }, scales: { x: { ticks: { color: fontColor }, grid: { color: gridColor } }, y: { ticks: { color: fontColor }, grid: { color: gridColor } } } }
    });

    // 2. Gráfico de Usuários (Barras Empilhadas)
    const dataClientes = ultimos6Meses.map(m => { const item = stats.usuarios.find(u => u.mes === m && u.tipo === 'cliente'); return item ? parseInt(item.total) : 0; });
    const dataPrestadores = ultimos6Meses.map(m => { const item = stats.usuarios.find(u => u.mes === m && u.tipo === 'prestador'); return item ? parseInt(item.total) : 0; });

    new Chart(document.getElementById('chartUsuariosAdmin'), {
        type: 'bar',
        data: {
            labels: labelsMeses,
            datasets: [
                { label: 'Clientes', data: dataClientes, backgroundColor: '#007bff' },
                { label: 'Prestadores', data: dataPrestadores, backgroundColor: '#f0ad4e' }
            ]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: fontColor } } }, scales: { x: { stacked: true, ticks: { color: fontColor }, grid: { color: gridColor } }, y: { stacked: true, ticks: { color: fontColor }, grid: { color: gridColor } } } }
    });

    // 3. Gráfico de Categorias (Rosca)
    const catLabels = stats.categorias.map(c => c.nome);
    const catData = stats.categorias.map(c => parseInt(c.total));
    new Chart(document.getElementById('chartCategoriasAdmin'), {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: ['#00ADB5', '#f0ad4e', '#5cb85c', '#d9534f', '#9c27b0', '#17a2b8', '#fd7e14'], borderWidth: 2, borderColor: '#393E46' }] },
        options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: fontColor } } } }
    });

    // 4. Gráfico de Status de Pedidos (Barras Horizontais)
    const mapCores = { 'PENDENTE': '#f0ad4e', 'ACEITO': '#5cb85c', 'AGUARDANDO_CONFIRMACAO': '#17a2b8', 'CONCLUIDO': '#007bff', 'CANCELADO': '#d9534f' };
    const pedLabels = stats.pedidos.map(p => p.status.replace('_', ' '));
    const pedData = stats.pedidos.map(p => parseInt(p.total));
    const pedCores = stats.pedidos.map(p => mapCores[p.status] || '#AAAAAA');

    new Chart(document.getElementById('chartPedidosAdmin'), {
        type: 'bar',
        data: { labels: pedLabels, datasets: [{ label: 'Qtd de Pedidos', data: pedData, backgroundColor: pedCores }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: fontColor, stepSize: 1 }, grid: { color: gridColor } }, y: { ticks: { color: fontColor }, grid: { display: false } } } }
    });
}

function setupAdminHeader(usuarioAtual) {
    const menu = document.getElementById("menu");
    menu.innerHTML = `
        <a href="index.html">Sair do Painel Admin</a>
    `;
}