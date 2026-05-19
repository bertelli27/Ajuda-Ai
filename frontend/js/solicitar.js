document.addEventListener("DOMContentLoaded", async function() {
    // ================= VALIDAÇÃO DE USUÁRIO LOGADO =================
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        mostrarToast("Você precisa fazer login para solicitar um serviço!", "error");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
        return;
    }

    // ================= CARREGAMENTO DE DADOS =================
    const params = new URLSearchParams(window.location.search);
    const servicoId = parseInt(params.get("servicoId"), 10);

    if (!servicoId) {
        mostrarToast("ID do serviço não fornecido.", "error");
        setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
        return;
    }

    try {
        // Busca todos os dados necessários da API
        // Usamos o mock de getUsuarios por enquanto para pegar os dados do cliente
        const [usuarios, servicoSolicitado] = await Promise.all([
            API.getUsuarios(), 
            API.getServicoById(servicoId)
        ]);

        const clienteAtual = usuarios.find(u => u.email === emailLogado);

        if (servicoSolicitado.prestador_email === emailLogado) {
            mostrarToast("Você não pode solicitar um serviço a si mesmo.", "error");
            setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
            return;
        }

        // Se tudo estiver OK, preenche a tela e configura o formulário
        preencherDadosTela(servicoSolicitado, clienteAtual);
        configurarFormulario(servicoId);

    } catch (error) {
        mostrarToast(error.message, "error");
        setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
    }

    // ================= FUNÇÕES DE UI E LÓGICA =================
    
    window.mudarAbaServico = function(abaId, btnElement) {
        document.querySelectorAll('.aba-conteudo').forEach(aba => aba.style.display = 'none');
        document.getElementById('aba-' + abaId).style.display = 'block';
        
        document.querySelectorAll('.micro-perfil-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    };

    function gerarPortfolioHTML(portfolio) {
        if (!portfolio || portfolio.length === 0) {
            return `<p style="color: #AAAAAA; font-style: italic; text-align: center; padding: 20px;">Este serviço ainda não possui fotos no portfólio.</p>`;
        }
        let html = '<div class="portfolio-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">';
        portfolio.forEach(img => {
            let selo = img.verificado ? `<div style="position: absolute; bottom: 8px; left: 8px; background: #5cb85c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; z-index: 5; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">✅ Verificado</div>` : '';
            let dataAttrs = `data-descricao="${img.descricao || ''}"`;
            if (img.verificado) {
                dataAttrs += ` data-verificado="true" data-nota="${img.nota || ''}" data-comentario="${img.comentario || ''}"`;
            }
            html += `
                <div class="portfolio-item" style="position: relative; border-radius: 8px; overflow: hidden; padding-top: 100%;">
                    ${selo}
                    <img src="${img.imagem_url}" ${dataAttrs} alt="Trabalho" onclick="abrirLightbox(this)" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function gerarAvaliacoesHTML(avaliacoes) {
        if (!avaliacoes || avaliacoes.length === 0) {
            return `<p style="color: #AAAAAA; font-style: italic; text-align: center; padding: 20px;">Este serviço ainda não possui avaliações.</p>`;
        }
        let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        avaliacoes.forEach(a => {
            const estrelas = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);
            const data = new Date(a.criado_em).toLocaleDateString('pt-BR');
            const foto = a.cliente_foto || '../img/avatar_padrao.png';
            html += `
                <div class="avaliacao-card fade-up-animation" style="background: #2A343D; padding: 15px; border-radius: 12px; border: 1px solid #4F5B66;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${foto}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                            <strong style="color: #EEEEEE;">${a.cliente_nome.split(' ')[0]}</strong>
                        </div>
                        <span style="font-size: 12px; color: #AAAAAA;">${data}</span>
                    </div>
                    <div style="color: #ffc107; font-size: 16px; margin-bottom: 8px;">${estrelas}</div>
                    ${a.comentario ? `<p style="color: #CCCCCC; font-size: 14px; font-style: italic; line-height: 1.5;">"${a.comentario}"</p>` : ''}
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function preencherDadosTela(servico, cliente) {
        const numProjetosVerificados = servico.portfolio ? servico.portfolio.filter(p => p.verificado).length : 0;

        document.getElementById("infoPrestador").innerHTML = `
            <div class="micro-perfil-header" style="display: flex; gap: 20px; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #4F5B66; padding-bottom: 20px; flex-wrap: wrap;">
                <img src="${servico.prestador_foto || '../img/avatar_padrao.png'}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #00ADB5;">
                <div style="flex-grow: 1;">
                    <span style="font-size: 12px; background: #00ADB5; color: #222A31; padding: 3px 8px; border-radius: 10px; font-weight: bold;">${servico.categoria}</span>
                    <h2 style="color: #EEEEEE; margin: 5px 0; font-size: 22px;">${servico.titulo}</h2>
                    <p style="color: #AAAAAA; font-size: 14px; margin-bottom: 5px;">Oferecido por: <strong>${servico.prestador_nome}</strong></p>
                    <div style="display: flex; gap: 15px; margin-top: 8px; flex-wrap: wrap;">
                        <span style="color: #ffc107; font-size: 14px; font-weight: bold;">★ ${parseFloat(servico.mediaAvaliacao).toFixed(1)} (${servico.totalAvaliacoes})</span>
                        ${numProjetosVerificados > 0 ? `<span style="color: #5cb85c; font-size: 14px; font-weight: bold;">✅ ${numProjetosVerificados} verificados</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="micro-perfil-tabs" style="margin-bottom: 20px;">
                <div class="tabs-container" style="border-bottom: 1px solid #4F5B66; padding-bottom: 0; margin-bottom: 0;">
                    <button type="button" class="tab-btn active" onclick="window.mudarAbaServico('detalhes', this)">Detalhes</button>
                    <button type="button" class="tab-btn" onclick="window.mudarAbaServico('portfolio', this)">Portfólio (${servico.portfolio ? servico.portfolio.length : 0})</button>
                    <button type="button" class="tab-btn" onclick="window.mudarAbaServico('avaliacoes', this)">Avaliações (${servico.totalAvaliacoes})</button>
                </div>
            </div>

            <div id="aba-detalhes" class="aba-conteudo fade-up-animation" style="display: block; padding-top: 20px;">
                <h4 style="color: #00ADB5; margin-bottom: 10px; font-size: 18px;">Sobre o Serviço</h4>
                <p style="color: #CCCCCC; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${servico.descricao || 'O prestador ainda não adicionou uma descrição detalhada para este serviço.'}</p>
                <div style="margin-top: 20px; padding: 15px; background: #2A343D; border-radius: 8px; border: 1px solid #4F5B66; display: inline-block;">
                    <span style="color: #AAAAAA; font-size: 13px; display: block;">Preço Base Sugerido</span>
                    <strong style="color: #00ADB5; font-size: 24px;">${servico.preco_base ? 'R$ ' + parseFloat(servico.preco_base).toFixed(2).replace('.', ',') : 'A combinar'}</strong>
                </div>
            </div>

            <div id="aba-portfolio" class="aba-conteudo fade-up-animation" style="display: none; padding-top: 20px;">
                ${gerarPortfolioHTML(servico.portfolio)}
            </div>

            <div id="aba-avaliacoes" class="aba-conteudo fade-up-animation" style="display: none; padding-top: 20px;">
                ${gerarAvaliacoesHTML(servico.avaliacoes)}
            </div>
        `;

        if (cliente && cliente.endereco) {
            const end = cliente.endereco;
            const enderecoFormatado = `${end.rua}, ${end.numero} ${end.complemento ? '- ' + end.complemento : ''} - ${end.bairro}, ${end.cidade} - ${end.estado}`;
            document.getElementById("enderecoLocal").value = enderecoFormatado;
        }
        setupHeader(cliente);
    }

    function configurarFormulario(idServico) {
        document.getElementById("formSolicitacao").addEventListener("submit", async function(e) {
            e.preventDefault();
            const btnSubmit = e.submitter;
            setButtonLoading(btnSubmit);

            const dadosSolicitacao = {
                servicoId: idServico,
                descricaoProblema: document.getElementById("descricaoProblema").value.trim(),
                dataDesejada: document.getElementById("dataDesejada").value,
                enderecoRealizacao: document.getElementById("enderecoLocal").value.trim()
            };

            try {
                await API.criarSolicitacao(dadosSolicitacao);
                mostrarToast("Solicitação enviada com sucesso! Acompanhe em 'Meus Pedidos'.", "success");
                setTimeout(() => { window.location.href = "pedidos.html"; }, 2000);
            } catch (error) {
                mostrarToast(error.message, "error");
                removeButtonLoading(btnSubmit);
            }
        });
    }

    // ================= HEADER E LOGOUT =================
    function logout(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "login.html";
    }

    function setupHeader(usuarioAtual) {
        const menu = document.getElementById("menu");
        if (!menu) return;
        const fotoPerfil = usuarioAtual?.fotoPerfil || '../img/avatar_padrao.png';
        const primeiroNome = usuarioAtual.nome.split(' ')[0];
        const textoPedidos = usuarioAtual.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';
        menu.innerHTML = `
            <a href="index.html">Início</a>
            <a href="servicos.html" class="active-nav">Serviços</a>
            <a href="pedidos.html">${textoPedidos}</a>
            <div class="profile-menu-container">
                <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                    <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                    <span>${primeiroNome}</span>
                </a>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="dashboard.html">Dashboard</a>
                    <a href="perfil.html">Meu Perfil</a>
                    <a href="configuracoes.html">Configurações</a>
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