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

    btnTabUsuarios.addEventListener("click", () => {
        btnTabUsuarios.classList.add("active");
        btnTabLogs.classList.remove("active");
        sectionUsuarios.style.display = "block";
        sectionLogs.style.display = "none";
    });

    btnTabLogs.addEventListener("click", () => {
        btnTabLogs.classList.add("active");
        btnTabUsuarios.classList.remove("active");
        sectionLogs.style.display = "block";
        sectionUsuarios.style.display = "none";
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

    // ================= 3. CARREGAR DADOS =================
    carregarUsuarios();

    async function carregarUsuarios() {
        const tbody = document.getElementById("tabela-usuarios-body");
        try {
            const listaUsuarios = await API.getTodosUsuariosAdmin();
            
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
                    btnBanir = `<span style="font-size: 12px; color: #AAAAAA;">Banido</span>`;
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

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #d9534f;">Erro ao carregar usuários: ${error.message}</td></tr>`;
        }
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
        const logsParaMostrar = isTabServicos ? cacheLogsData.logsServicos : cacheLogsData.logsUsuarios;
        const corDestaque = isTabServicos ? '#f0ad4e' : '#00ADB5';

        if (!logsParaMostrar || logsParaMostrar.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado nesta categoria.</td></tr>`;
            return;
        }

        tbody.innerHTML = logsParaMostrar.map(log => {
            const dataCriacao = new Date(log.criado_em).toLocaleString('pt-BR');
            const nomeUser = log.usuario_nome || 'Desconhecido';
            const emailUser = log.usuario_email || 'Sistema';
            
            let alvoInfo = isTabServicos ? `<strong>Pedido #${log.solicitacao_id}</strong><br>${log.detalhes}` : log.detalhes;

            return `
                <tr>
                    <td style="white-space: nowrap;">${dataCriacao}</td>
                    <td><strong>${nomeUser}</strong><br><span style="font-size: 11px; color: #AAAAAA;">${emailUser}</span></td>
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
});

function setupAdminHeader(usuarioAtual) {
    const menu = document.getElementById("menu");
    menu.innerHTML = `
        <a href="index.html">Sair do Painel Admin</a>
    `;
}