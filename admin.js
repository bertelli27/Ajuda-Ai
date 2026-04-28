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
        const tbody = document.getElementById("tabela-logs-body");
        try {
            const dados = await API.getLogsAdmin();
            const logs = dados.logsAdministradores;
            const logsSrv = dados.logsServicos;

            if ((!logs || logs.length === 0) && (!logsSrv || logsSrv.length === 0)) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum log de auditoria registrado.</td></tr>`;
                return;
            }

            let html = '';

            if (logs && logs.length > 0) {
                html += `<tr><td colspan="5" style="background-color: #2A343D; color: #d9534f; font-weight: bold; text-align: center;">--- AÇÕES DE ADMINISTRADORES ---</td></tr>`;
                html += logs.map(log => {
                    const dataCriacao = new Date(log.criado_em).toLocaleString('pt-BR');
                    return `
                        <tr>
                            <td style="white-space: nowrap;">${dataCriacao}</td>
                            <td>${log.admin_nome || 'Sistema'}</td>
                            <td><strong style="color: #d9534f;">${log.acao}</strong></td>
                            <td>${log.alvo_tipo.toUpperCase()} #${log.alvo_id}</td>
                            <td style="color: #AAAAAA; font-size: 12px;">${log.justificativa}</td>
                        </tr>
                    `;
                }).join('');
            }

            if (logsSrv && logsSrv.length > 0) {
                html += `<tr><td colspan="5" style="background-color: #2A343D; color: #f0ad4e; font-weight: bold; text-align: center;">--- CICLO DE VIDA DOS SERVIÇOS ---</td></tr>`;
                html += logsSrv.map(log => {
                    const dataCriacao = new Date(log.criado_em).toLocaleString('pt-BR');
                    return `
                        <tr>
                            <td style="white-space: nowrap;">${dataCriacao}</td>
                            <td>${log.usuario_nome || 'Sistema'} (${log.usuario_tipo || 'N/A'})</td>
                            <td><strong style="color: #f0ad4e;">${log.acao}</strong></td>
                            <td>PEDIDO #${log.solicitacao_id}</td>
                            <td style="color: #AAAAAA; font-size: 12px;">${log.detalhes}</td>
                        </tr>
                    `;
                }).join('');
            }

            tbody.innerHTML = html;
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #d9534f;">Erro ao carregar logs: ${error.message}</td></tr>`;
        }
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