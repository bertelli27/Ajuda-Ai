document.addEventListener("DOMContentLoaded", async function() {
    // ================= VARIÁVEIS GLOBAIS E VERIFICAÇÃO DE CONTEXTO =================
    const emailLogado = API.getSessaoAtual();
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const perfilEmail = params.get("usuario");
    
    // 🚀 Busca dados REAIS da API!
    const usuarios = await API.getUsuarios();
    const solicitacoes = await API.getSolicitacoes();
    const avaliacoes = await API.getAvaliacoes();

    let usuarioAlvo; // O usuário cujo perfil está sendo exibido
    let isOwnProfile = false; // Flag para verificar se o usuário está vendo seu próprio perfil
    let novaFotoBase64 = null; // Para armazenar a nova foto antes de salvar

    // Elementos do DOM
    const btnEditar = document.getElementById("btnEditar");
    const btnSalvar = document.getElementById("btnSalvar");
    const btnAddServico = document.getElementById("btn-add-servico");
    const servicoModal = document.getElementById("servicoModal");
    const closeServicoModal = document.getElementById("closeServicoModal");
    const formServico = document.getElementById("formServico");
    const servicoModalTitle = document.getElementById("servicoModalTitle");

    // Determina qual perfil carregar (público ou próprio)
    if (perfilEmail) {
        // --- MODO PERFIL PÚBLICO ---
        isOwnProfile = (emailLogado === perfilEmail);
        if (isOwnProfile) {
            // Se o usuário logado acessa seu próprio link público, redireciona para a página de edição padrão
            window.location.href = "perfil.html";
            return;
        }

        usuarioAlvo = usuarios.find(u => u.email === perfilEmail);

        if (!usuarioAlvo || usuarioAlvo.tipo !== 'prestador') {
            mostrarToast("Perfil de prestador não encontrado.", "error");
            setTimeout(() => { window.location.href = "servicos.html"; }, 1500);
            return;
        }

        document.body.classList.add('public-view'); // ATIVA O LAYOUT PÚBLICO
        configurarPerfilPublico(); // Apenas para ajustar títulos e botões

    } else {
        // --- MODO MEU PERFIL (EDITÁVEL) ---
        if (!emailLogado) {
            mostrarToast("Você precisa fazer login para acessar esta página!", "error");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            return;
        }
        isOwnProfile = true;
        usuarioAlvo = usuarios.find(u => u.email === emailLogado);

        if (!usuarioAlvo) {
            mostrarToast("Erro ao carregar dados do usuário. Faça login novamente.", "error");
            logout();
            return;
        }

        configurarMeuPerfil();
    }

    // Preenche os dados na tela e configura o cabeçalho, seja qual for o modo
    preencherDados(usuarioAlvo);
    setupHeader();

    // --- Ação direta para se tornar prestador vindo de outra página ---
    if (isOwnProfile && action === 'become_provider' && usuarioAlvo.tipo === 'cliente') {
        // Atraso mínimo para garantir que a UI está pronta antes de simular o clique
        setTimeout(() => {
            tornarPrestador();
        }, 100);
    }

    // ================= FUNÇÕES DE CONFIGURAÇÃO DE MODO =================

    function configurarPerfilPublico() {
        // Esconde todos os controles de edição do card
        btnEditar.style.display = "none";
        btnSalvar.style.display = "none";
        document.getElementById("editPicLabel").style.display = "none";
        const areaTornar = document.getElementById("areaTornarPrestador");
        if (areaTornar) areaTornar.style.display = "none";

        // Altera o título da página e do card
        document.title = `Perfil de ${usuarioAlvo.nome.split(' ')[0]} | AjudaAí`;
        const pageTitle = document.getElementById("perfil-page-title");
        if (pageTitle) pageTitle.innerText = `Perfil de Prestador`;

        // A ocultação dos dados privados agora é feita via CSS com a classe .public-view no body
    }

    function configurarMeuPerfil() {
        // Adiciona os event listeners para edição, salvamento, etc.
        btnEditar.addEventListener("click", () => alternarModoEdicao(true));
        btnSalvar.addEventListener("click", salvarAlteracoes);
        document.getElementById("btnTornarPrestador")?.addEventListener("click", tornarPrestador);
        btnAddServico?.addEventListener("click", () => abrirModalServico());
        closeServicoModal?.addEventListener("click", () => servicoModal.style.display = "none");
        window.addEventListener('click', (e) => { if (e.target == servicoModal) servicoModal.style.display = "none"; });
        formServico?.addEventListener("submit", salvarServico);
        document.getElementById("profilePicInput").addEventListener("change", préVisualizarFoto);
        
        aplicarMascaraCEP(document.getElementById("cep"));
        aplicarMascaraDinheiro(document.getElementById("valor"));
        
        document.getElementById("cep")?.addEventListener("blur", async function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                const dadosEndereco = await buscarCEP(cep);
                if (dadosEndereco) {
                    document.getElementById("rua").value = dadosEndereco.logradouro;
                    document.getElementById("bairro").value = dadosEndereco.bairro;
                    document.getElementById("cidade").value = dadosEndereco.localidade;
                    document.getElementById("estado").value = dadosEndereco.uf;
                    document.getElementById("numero").focus();
                } else {
                    mostrarToast("CEP não encontrado.", "error");
                }
            }
        });
    }

    // ================= FUNÇÕES PRINCIPAIS =================

    function preencherDados(usuario) {
        const usuarioLogadoObj = usuarios.find(u => u.email === emailLogado);
        const isAdmin = usuarioLogadoObj && usuarioLogadoObj.tipo === 'admin';

        // Preenche a foto de perfil
        const profilePic = document.getElementById("profilePicPreview");
        profilePic.src = usuario.fotoPerfil || "../img/avatar_padrao.png";

        // Se não for o próprio perfil, não mostra o botão de editar foto
        if (!isOwnProfile) document.getElementById("editPicLabel").style.display = "none";

        // Preenche a sidebar com nome e email
        document.getElementById("sidebar-user-name").innerText = usuario.nome;
        document.getElementById("sidebar-user-email").innerText = usuario.email;

        // Preenche o novo header público
        document.getElementById("publicProfilePic").src = profilePic.src;
        document.getElementById("public-sidebar-user-name").innerText = usuario.nome;
        document.getElementById("public-sidebar-user-email").style.display = 'none'; // Oculta o email na visão pública
        const btnContratar = document.getElementById("public-btnContratar");
        if(btnContratar) {
            if (isAdmin) {
                btnContratar.style.display = 'none';
            } else {
                btnContratar.onclick = () => {
                    const servicesSection = document.getElementById("secao-prestador");
                    if (servicesSection) {
                        servicesSection.scrollIntoView({ behavior: 'smooth' });
                        mostrarToast("Escolha um dos serviços abaixo para solicitar.", "success");
                    }
                };
            }
        }
        
        // ================= PERFIL TRANSPARENTE (MODO ADMIN) =================
        if (isAdmin && !isOwnProfile) {
            const emailPub = document.getElementById("public-sidebar-user-email");
            if (emailPub) {
                emailPub.style.display = 'block';
                emailPub.style.color = '#d9534f';
                emailPub.style.fontWeight = 'bold';
                emailPub.innerText = `📧 ${usuario.email} | CPF: ${usuario.cpf || 'N/A'}`;
            }
            const containerAvaliacao = document.getElementById("public-sidebar-rating-container");
            if (containerAvaliacao && !document.getElementById("adminActionsContainer")) {
                let infoAdmin = document.createElement("div");
                infoAdmin.id = "adminActionsContainer";
                infoAdmin.style.marginTop = "15px";
                infoAdmin.style.paddingTop = "15px";
                infoAdmin.style.borderTop = "1px dashed #d9534f";
                infoAdmin.innerHTML = `<button class="btn-acao recusar" style="width: 100%; font-size: 13px;" onclick="window.banirEsteUsuario('${usuario.id}', '${usuario.nome}')">🚫 Banir Conta</button>`;
                containerAvaliacao.parentNode.insertBefore(infoAdmin, containerAvaliacao.nextSibling);
            }
        }

        // Preenche os campos de visualização
        document.getElementById("view-nome").innerText = usuario.nome;
        document.getElementById("view-email").innerText = usuario.email;
        document.getElementById("view-telefone").innerText = usuario.telefone;
        const end = usuario.endereco;
        document.getElementById("view-endereco").innerText = `${end.rua}, ${end.numero} ${end.complemento ? '- ' + end.complemento : ''}`;
        document.getElementById("view-cidade-estado").innerText = `${end.cidade} - ${end.estado}, CEP: ${end.cep}`;

        // Preenche as estatísticas da Sidebar
        
        // Calcula a Avaliação Média para exibir no Header Público
        const avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === usuario.email);
        let mediaEstrelas = 'Novo';
        if (avaliacoesDoPrestador.length > 0) {
            const soma = avaliacoesDoPrestador.reduce((acc, a) => acc + a.nota, 0);
            const media = (soma / avaliacoesDoPrestador.length).toFixed(1);
            mediaEstrelas = `★ ${media}`;
        }
        const ratingContainer = document.getElementById("public-sidebar-rating-container");
        const ratingElement = document.getElementById("public-sidebar-rating");
        if (ratingElement) ratingElement.innerText = mediaEstrelas;
        if (usuario.tipo !== "prestador" && ratingContainer) {
            ratingContainer.style.display = "none"; // Oculta se for cliente
        }

        if (usuario.tipo === "prestador") {
            document.getElementById("sidebar-tipo-perfil").innerText = "Profissional";
            document.getElementById("sidebar-label-servicos").innerText = "Serviços Concluídos";
            const concluidos = solicitacoes.filter(s => s.prestadorEmail === usuario.email && s.status === 'CONCLUIDO').length;
            document.getElementById("sidebar-servicos-count").innerText = concluidos;
            // Preenche header público
            document.getElementById("public-sidebar-tipo-perfil").innerText = "Profissional";
            document.getElementById("public-sidebar-label-servicos").innerText = "Serviços Concluídos";
            document.getElementById("public-sidebar-servicos-count").innerText = concluidos;
        } else {
            document.getElementById("sidebar-tipo-perfil").innerText = "Cliente";
            document.getElementById("sidebar-label-servicos").innerText = "Serviços Solicitados";
            const solicitados = solicitacoes.filter(s => s.clienteEmail === usuario.email).length;
            document.getElementById("sidebar-servicos-count").innerText = solicitados;
            // Preenche header público
            document.getElementById("public-sidebar-tipo-perfil").innerText = "Cliente";
            document.getElementById("public-sidebar-label-servicos").innerText = "Serviços Solicitados";
            document.getElementById("public-sidebar-servicos-count").innerText = solicitados;
        }
        
        // Exibe "Ativa e Verificada" apenas para o próprio perfil, se for visitante mostra "Perfil Verificado"
        const statusConta = document.getElementById("sidebar-status-conta");
        const statusContaPublico = document.getElementById("public-sidebar-status-conta");
        const statusHTML = `<span style="display: inline-block; width: 10px; height: 10px; background-color: #5cb85c; border-radius: 50%;"></span> Perfil Verificado`;
        if (!isOwnProfile && statusConta) {
            statusConta.innerHTML = statusHTML;
        }
        if (statusContaPublico) statusContaPublico.innerHTML = statusHTML;

        // Preenche os inputs do formulário de edição (que está escondido)
        document.getElementById("nome").value = usuario.nome;
        document.getElementById("cpf").value = usuario.cpf;
        document.getElementById("email").value = usuario.email;
        document.getElementById("telefone").value = usuario.telefone;
        document.getElementById("cep").value = end.cep;
        document.getElementById("rua").value = end.rua;
        document.getElementById("numero").value = end.numero;
        document.getElementById("complemento").value = end.complemento || '';
        document.getElementById("bairro").value = end.bairro;
        document.getElementById("cidade").value = end.cidade;
        document.getElementById("estado").value = end.estado;

        if (usuario.tipo === "prestador" && usuario.prestador) {
            document.getElementById("secao-prestador").style.display = "block";
            renderizarMeusServicos(usuario.email); // Passa o email do prestador alvo
            
            renderizarPortfolio(usuario);
            carregarAvaliacoes(usuario); // Carrega as avaliações para o prestador
        } else if (isOwnProfile && usuario.tipo === 'cliente') {
            // Se o usuário é um cliente vendo o próprio perfil, mostra o botão para virar prestador
            let areaTornarPrestador = document.getElementById("areaTornarPrestador");
            if (areaTornarPrestador) {
                areaTornarPrestador.style.display = "block";
            } else {
                const viewMode = document.getElementById("view-mode");
                if (viewMode) {
                    viewMode.insertAdjacentHTML('beforeend', `
                        <div id="areaTornarPrestador" class="become-provider-banner fade-up-animation" style="margin-top: 30px;">
                            <h3>Quer oferecer seus serviços no AjudaAí?</h3>
                            <p>Torne-se um profissional da plataforma e comece a receber pedidos de milhares de clientes.</p>
                            <button id="btnTornarPrestadorDin" class="btn-login" style="max-width: 300px; margin: 0 auto; background: #222A31; color: #00ADB5;">Tornar-se Prestador</button>
                        </div>
                    `);
                    document.getElementById("btnTornarPrestadorDin").addEventListener("click", tornarPrestador);
                }
            }
        }

        // Configura o botão de Copiar Link (apenas para prestadores)
        const btnCopiarLink = document.getElementById("btnCopiarLink");
        if (usuario.tipo === "prestador" && btnCopiarLink) {
            btnCopiarLink.style.display = "block";
            btnCopiarLink.onclick = () => {
                const baseUrl = window.location.href.split('?')[0]; // Pega a URL pura sem parâmetros
                const finalUrl = `${baseUrl}?usuario=${encodeURIComponent(usuario.email)}`;
                
                navigator.clipboard.writeText(finalUrl).then(() => {
                    mostrarToast("Link copiado para a área de transferência!", "success");
                }).catch(err => {
                    // Fallback caso a API clipboard falhe
                    prompt("Copie seu link abaixo:", finalUrl);
                    mostrarToast("Copie o link gerado acima.", "success");
                });
            };
        } else if (btnCopiarLink) {
            btnCopiarLink.style.display = "none";
        }
        verificarModoCliente();
    }

    function alternarModoEdicao(editar) {
        // Alterna a visibilidade dos blocos
        document.getElementById("view-mode").style.display = editar ? "none" : "block";
        document.getElementById("perfilForm").style.display = editar ? "block" : "none";
        
        // Lógica para a seção do prestador
        const viewPrestador = document.getElementById("view-prestador");
        const formPrestador = document.getElementById("form-prestador-edit");
        const secaoPrestador = document.getElementById("secao-prestador");

        if (viewPrestador && formPrestador) {
            viewPrestador.style.display = editar ? "none" : "block";
            formPrestador.style.display = editar ? "block" : "none";
        }

        if (secaoPrestador) {
            if (editar) secaoPrestador.classList.add('edit-mode');
            else secaoPrestador.classList.remove('edit-mode');
        }

        btnEditar.style.display = editar ? "none" : "block";
        btnSalvar.style.display = editar ? "block" : "none";
        
        // Esconde o botão de copiar link durante a edição para manter a tela limpa
        const btnCopiarLink = document.getElementById("btnCopiarLink");
        if (btnCopiarLink && usuarioAlvo.tipo === "prestador") {
            btnCopiarLink.style.display = editar ? "none" : "block";
        }

        if (isOwnProfile) document.getElementById("editPicLabel").style.display = editar ? "flex" : "none";
        if (isOwnProfile && usuarioAlvo.tipo === "prestador") btnAddServico.style.display = editar ? "inline-flex" : "none";
        if (isOwnProfile) document.getElementById("btn-add-portfolio").style.display = editar ? "inline-flex" : "none";
    }

    function verificarModoCliente() {
        if (!isOwnProfile) return;
        const areaPrestador = document.getElementById("secao-prestador");
        let btnVoltarCliente = document.getElementById('btnVoltarCliente');
        
        if (usuarioAlvo.tipo === 'prestador') {
            if (!btnVoltarCliente && areaPrestador) {
                areaPrestador.insertAdjacentHTML('beforeend', `
                    <div id="containerVoltarCliente" style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #4F5B66;">
                        <button id="btnVoltarCliente" class="btn-forgot" style="width: auto; padding: 10px 20px; color: #AAAAAA; border-color: #4F5B66;">
                            Voltar para conta de cliente
                        </button>
                    </div>
                `);
                document.getElementById('btnVoltarCliente').addEventListener('click', reverterParaCliente);
            }
        } else {
            const container = document.getElementById('containerVoltarCliente');
            if (container) container.remove();
        }
    }

    function reverterParaCliente() {
        mostrarConfirmacao("Tem certeza que deseja voltar a ser cliente? Seus serviços ficarão inativos e não aparecerão nas buscas.", async () => {
            try {
                usuarioAlvo.tipo = "cliente";
                await API.atualizarPerfilApi(usuarioAlvo);
                document.getElementById("secao-prestador").style.display = "none";
                const areaTornar = document.getElementById("areaTornarPrestador");
                if (areaTornar) areaTornar.style.display = "block";
                
                verificarModoCliente();
                mostrarToast("Conta revertida para cliente.", "success");
                
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                mostrarToast("Erro ao reverter conta.", "error");
            }
        });
    }

    async function tornarPrestador() {
        const modalHtml = `
            <div id="modalTornarPrestador" class="modal" style="display: flex; align-items: center; justify-content: center; z-index: 10000; background-color: rgba(0,0,0,0.7);">
                <div class="modal-content fade-up-animation" style="max-width: 500px; height: auto; text-align: center; padding: 40px 30px; margin: 0;">
                    <div style="font-size: 50px; margin-bottom: 15px;">💼</div>
                    <h3 style="color: #00ADB5; margin-bottom: 15px; font-size: 24px;">Pronto para ganhar dinheiro no AjudaAí?</h3>
                    <p style="color: #CCCCCC; margin-bottom: 15px; font-size: 15px; line-height: 1.6;">
                        Ao se tornar um prestador, você terá uma vitrine para oferecer seus serviços para milhares de clientes.
                    </p>
                    <div style="text-align: left; background: #2A343D; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #4F5B66;">
                        <ul style="color: #AAAAAA; font-size: 14px; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px;">
                            <li>✅ <strong>Visibilidade:</strong> Seu perfil aparecerá nas buscas.</li>
                            <li>✅ <strong>Flexibilidade:</strong> Negocie orçamentos diretamente no chat.</li>
                            <li>✅ <strong>Segurança:</strong> Pagamento garantido e retido pela plataforma.</li>
                            <li>⚠️ <strong>Taxa da Plataforma:</strong> Será descontada uma pequena taxa sobre os serviços concluídos.</li>
                        </ul>
                    </div>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="btnCancelPrestador" class="btn-forgot" style="margin: 0; flex: 1;">Cancelar</button>
                        <button id="btnConfirmPrestador" class="btn-login" style="margin: 0; flex: 1.5; font-size: 14px;">Aceitar e Criar Meu Primeiro Serviço</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btnCancelPrestador').onclick = () => document.getElementById('modalTornarPrestador').remove();
        
        document.getElementById('btnConfirmPrestador').onclick = async () => {
            const btnTornar = document.getElementById("btnConfirmPrestador");
            setButtonLoading(btnTornar);

            usuarioAlvo.tipo = "prestador";
            if (!usuarioAlvo.prestador) {
                usuarioAlvo.prestador = {}; 
            }

            try {
                await API.atualizarPerfilApi(usuarioAlvo);
                document.getElementById('modalTornarPrestador').remove();
                const areaTornar = document.getElementById("areaTornarPrestador");
                if (areaTornar) areaTornar.style.display = "none";
                document.getElementById("secao-prestador").style.display = "block";
                
                mostrarToast("Parabéns! Você agora é um profissional.", "success");
                alternarModoEdicao(true);
                verificarModoCliente();
                
                // Abre o modal de serviço obrigatoriamente
                setTimeout(() => {
                    abrirModalServico();
                }, 500);
                
            } catch (error) {
                console.error("Erro ao converter para prestador:", error);
                mostrarToast("Erro ao ativar modo prestador.", "error");
                removeButtonLoading(btnTornar);
            }
        };
    }

    async function préVisualizarFoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            mostrarToast("Processando imagem da foto de perfil...", "success");
            // Foto de perfil precisa ser menor, 400x400 é suficiente
            const base64Comprimido = await comprimirImagem(file, 400, 400, 0.8);
            document.getElementById("profilePicPreview").src = base64Comprimido;
            novaFotoBase64 = base64Comprimido; // Armazena para salvar depois
        } catch (err) {
            mostrarToast("Erro ao processar a foto de perfil.", "error");
        }
    }

    async function salvarAlteracoes(e) {
        setButtonLoading(btnSalvar);

        const userIndex = usuarios.findIndex(u => u.email === emailLogado);
        if (userIndex === -1) {
            mostrarToast("Ocorreu um erro ao salvar. Tente novamente.", "error");
            removeButtonLoading(btnSalvar);
            return;
        }

        const usuarioEditado = usuarios[userIndex];

        // Salva a nova foto se houver uma
        if (novaFotoBase64) {
            usuarioEditado.fotoPerfil = novaFotoBase64;
        }
        usuarioEditado.nome = document.getElementById("nome").value.trim();
        usuarioEditado.telefone = document.getElementById("telefone").value.trim();
        usuarioEditado.endereco.cep = document.getElementById("cep").value.trim();
        usuarioEditado.endereco.rua = document.getElementById("rua").value.trim();
        usuarioEditado.endereco.numero = document.getElementById("numero").value.trim();
        usuarioEditado.endereco.complemento = document.getElementById("complemento").value.trim();
        usuarioEditado.endereco.bairro = document.getElementById("bairro").value.trim();
        usuarioEditado.endereco.cidade = document.getElementById("cidade").value.trim();
        usuarioEditado.endereco.estado = document.getElementById("estado").value.trim();
        usuarioEditado.tipo = usuarioAlvo.tipo;
        
        // Se o usuário se tornou prestador agora, inicializa o objeto
        if (usuarioEditado.tipo === "prestador" && !usuarioEditado.prestador) {
            usuarioEditado.prestador = {}; // Objeto de metadados do prestador
        }

        try {
            // 🚀 SALVA NO BANCO DE DADOS MYSQL
            await API.atualizarPerfilApi(usuarioEditado);
            
            setTimeout(() => {
                mostrarToast("Dados atualizados com sucesso!", "success");
                novaFotoBase64 = null; 
                preencherDados(usuarioEditado); 
                alternarModoEdicao(false); 
                removeButtonLoading(btnSalvar);
            }, 800);
        } catch (error) {
            mostrarToast(error.message || "Erro ao salvar no banco de dados.", "error");
            removeButtonLoading(btnSalvar);
        }
    }

    // ================= NOVAS FUNÇÕES DE GERENCIAMENTO DE SERVIÇOS =================

    async function renderizarMeusServicos(emailDoPrestador) {
        const listaContainer = document.getElementById("lista-meus-servicos");
        if (!listaContainer) return;

        const todosServicos = await API.getServicos();
        const meusServicos = todosServicos.filter(s => s.prestadorEmail === emailDoPrestador);

        if (meusServicos.length === 0 && isOwnProfile && usuarioAlvo.tipo === 'prestador') {
            listaContainer.innerHTML = `
                <div class="empty-state fade-up-animation" style="background: rgba(217, 83, 79, 0.05); border: 1px dashed #d9534f; padding: 25px; border-radius: 12px;">
                    <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
                    <p style="color: #d9534f; font-weight: bold; margin-bottom: 5px;">Atenção: Perfil Incompleto</p>
                    <p style="color: #AAAAAA; font-size: 14px; margin-bottom: 20px;">Cadastre seu primeiro serviço para começar a receber clientes e aparecer nas buscas.</p>
                    <button class="btn-service" onclick="abrirModalServico()" style="width: auto; padding: 12px 25px;">Cadastrar Primeiro Serviço</button>
                </div>`;
            return;
        }

        if (meusServicos.length === 0) {
            listaContainer.innerHTML = `<p style="color: #AAAAAA; font-style: italic; text-align: center;">Você ainda não cadastrou nenhum serviço.</p>`;
            return;
        }

        listaContainer.innerHTML = meusServicos.map(servico => {
            const precoFormatado = servico.preco_base ? `R$ ${parseFloat(servico.preco_base).toFixed(2).replace('.', ',')}` : 'A combinar';
            const mediaServico = servico.totalAvaliacoes > 0 ? `★ ${parseFloat(servico.mediaAvaliacao).toFixed(1)} (${servico.totalAvaliacoes})` : 'Novo';
            return `
            <div class="meu-servico-card">
                <div class="servico-info">
                    <h4>${servico.titulo}</h4>
                    <p style="font-size: 13px; color: #AAAAAA;">Categoria: ${servico.categoria} | Preço Base: <span style="color:#00ADB5;">${precoFormatado}</span> | Avaliação: <span style="color:#ffc107; font-weight:bold;">${mediaServico}</span></p>
                </div>
                <div class="botoes-acao" style="margin-top: 0;">
                    ${isOwnProfile 
                        ? `<button class="btn-ver-perfil" onclick="abrirModalServico('${servico.id}')" style="padding: 8px 15px;">Editar</button>
                           <button class="btn-acao recusar" onclick="excluirServico('${servico.id}')" style="padding: 8px 15px;">Excluir</button>`
                        : `<button class="btn-service" onclick="window.location.href='solicitar.html?servicoId=${servico.id}'" style="padding: 8px 15px;">Solicitar</button>`}
                </div>
            </div>
            `;
        }).join('');
    }

    async function abrirModalServico(servicoId = null) {
        // 🚀 TRAVA DE SEGURANÇA: Obriga o usuário a salvar a transição para prestador primeiro!
        const usuariosBD = await API.getUsuarios();
        const userDB = usuariosBD.find(u => u.email === emailLogado);
        if (!userDB || userDB.tipo !== 'prestador') {
            mostrarToast("Por favor, clique no botão azul 'Salvar Alterações' para confirmar seu perfil antes de adicionar serviços.", "error");
            return;
        }

        formServico.reset();
        document.getElementById("servicoId").value = "";

        let precoInput = document.getElementById("servicoPreco");
        if (!precoInput) {
            const descGroup = document.getElementById("servicoDescricao").closest('.form-group');
            descGroup.insertAdjacentHTML('afterend', `
                <div class="form-group">
                    <label for="servicoPreco" style="color:#AAAAAA; font-size:13px;">Preço Base (R$)</label>
                    <input type="text" id="servicoPreco" placeholder="R$ 0,00" required style="background:#2A343D; border:1px solid #4F5B66; color:#EEE;">
                </div>
            `);
            if (typeof aplicarMascaraDinheiro === 'function') {
                aplicarMascaraDinheiro(document.getElementById("servicoPreco"));
            }
        }

        const todosServicos = await API.getServicos();
        const meusServicos = todosServicos.filter(s => s.prestadorEmail === emailLogado);
        
        if (meusServicos.length === 0) {
            closeServicoModal.style.display = 'none'; // Bloqueia saída
        } else {
            closeServicoModal.style.display = 'block';
        }

        if (servicoId) {
            // Modo Edição
            servicoModalTitle.innerText = "Editar Serviço";
            const servico = todosServicos.find(s => String(s.id) === String(servicoId));
            if (servico) {
                document.getElementById("servicoId").value = servico.id;
                document.getElementById("servicoTitulo").value = servico.titulo;
                document.getElementById("servicoCategoria").value = servico.categoria;
                document.getElementById("servicoDescricao").value = servico.descricao;
                if (document.getElementById("servicoPreco") && typeof formatarMoedaParaMascara === 'function') {
                    document.getElementById("servicoPreco").value = servico.preco_base ? formatarMoedaParaMascara(servico.preco_base) : '';
                }
            }
        } else {
            // Modo Adição
            servicoModalTitle.innerText = "Adicionar Novo Serviço";
        }
        servicoModal.style.display = "block";
    }
    window.abrirModalServico = abrirModalServico; // Expondo para o onclick

    async function salvarServico(e) {
        e.preventDefault();
        // Fallback de segurança para garantir a captura do botão em todos os navegadores
        const submitButton = e.submitter || document.querySelector('#formServico button[type="submit"]');
        setButtonLoading(submitButton);

        const id = document.getElementById("servicoId").value;
        const titulo = document.getElementById("servicoTitulo").value.trim();
        const categoria = document.getElementById("servicoCategoria").value;
        const descricao = document.getElementById("servicoDescricao").value.trim();
        
        const precoInput = document.getElementById("servicoPreco");
        const preco_base = precoInput ? limparMascaraDinheiro(precoInput.value) : null;

        if (!titulo || !categoria || !descricao || !preco_base || parseFloat(preco_base) <= 0) {
            removeButtonLoading(submitButton);
            mostrarToast("Todos os campos, incluindo o Preço Base, são obrigatórios.", "error");
            return;
        }

        try {
            if (id) { // Editando
                // 🚀 Edita direto no Banco de Dados MySQL
                await API.editarServico(id, { titulo, categoria, descricao, preco_base });
            } else { // Criando
                // 🚀 Envia direto para o Banco de Dados MySQL via Node.js
                await API.criarServico({ titulo, categoria, descricao, preco_base });
            }
    
            mostrarToast("Serviço salvo no Banco de Dados com sucesso!", "success");
            servicoModal.style.display = "none";
            if (closeServicoModal) closeServicoModal.style.display = 'block';
            renderizarMeusServicos(emailLogado);
            removeButtonLoading(submitButton);
        } catch (error) {
            console.error("Erro interno:", error);
            mostrarToast(error.message || "Ocorreu um erro ao tentar salvar.", "error");
            removeButtonLoading(submitButton);
        }
    }

    function excluirServico(servicoId) {
        mostrarConfirmacao("Tem certeza que deseja excluir este serviço?", async () => {
            try {
                await API.excluirServico(servicoId);
                mostrarToast("Serviço excluído com sucesso!", "success");
                renderizarMeusServicos(emailLogado);
            } catch (error) {
                mostrarToast(error.message || "Erro ao tentar excluir serviço.", "error");
            }
        });
    }
    window.excluirServico = excluirServico; // Expondo para o onclick

    async function carregarAvaliacoes(usuario, servicoIdFiltro = 'todos') {
        const containerAvaliacoes = document.getElementById("avaliacoesRecebidas");
        const dashboard = document.getElementById("avaliacoesDashboard");
        const listaAvaliacoes = document.getElementById("listaAvaliacoes");
        const summaryContainer = document.getElementById("avaliacoes-summary");
        const btnVerTodas = document.getElementById("btnVerTodasAvaliacoes");
        
        // 🚀 Busca serviços para montar o filtro e as tags
        const todosServicos = await API.getServicos();
        const servicosDoPrestador = todosServicos.filter(s => s.prestadorEmail === usuario.email);

        // 🚀 Injeta o dropdown de filtro dinamicamente
        let filtroContainer = document.getElementById('filtroAvaliacoesContainer');
        if (!filtroContainer && containerAvaliacoes) {
            filtroContainer = document.createElement('div');
            filtroContainer.id = 'filtroAvaliacoesContainer';
            filtroContainer.style.marginBottom = '20px';
            filtroContainer.style.display = 'flex';
            filtroContainer.style.alignItems = 'center';
            filtroContainer.style.justifyContent = 'flex-end';
            if (dashboard) dashboard.parentNode.insertBefore(filtroContainer, dashboard);
        }

        if (filtroContainer) {
            filtroContainer.innerHTML = `
                <label style="color: #AAAAAA; font-size: 13px; margin-right: 10px;">Filtrar por Serviço:</label>
                <select id="selectFiltroAvaliacoes" style="background: #2A343D; border: 1px solid #4F5B66; color: #EEE; padding: 8px 15px; border-radius: 8px; outline: none; cursor: pointer; font-size: 13px;">
                    <option value="todos" ${servicoIdFiltro === 'todos' ? 'selected' : ''}>Todos os Serviços</option>
                    ${servicosDoPrestador.map(s => `<option value="${s.id}" ${String(servicoIdFiltro) === String(s.id) ? 'selected' : ''}>${s.titulo}</option>`).join('')}
                </select>
            `;
            
            document.getElementById("selectFiltroAvaliacoes").addEventListener("change", (e) => {
                carregarAvaliacoes(usuario, e.target.value);
            });
        }
        
        let avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === usuario.email);
        
        // Aplica o filtro
        if (servicoIdFiltro !== 'todos') {
            avaliacoesDoPrestador = avaliacoesDoPrestador.filter(a => String(a.servico_id) === String(servicoIdFiltro));
        }

        if (avaliacoesDoPrestador.length > 0) {
            containerAvaliacoes.style.display = "block";
            dashboard.style.display = "grid"; // Volta a grade normal
            
            // 1. Cálculos Estatísticos
            const total = avaliacoesDoPrestador.length;
            const soma = avaliacoesDoPrestador.reduce((acc, a) => acc + a.nota, 0);
            const media = (soma / total).toFixed(1);
            
            const contagem = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
            avaliacoesDoPrestador.forEach(a => contagem[a.nota]++);
            
            // 2. Renderiza Resumo de Barras
            const estrelasMedia = '★'.repeat(Math.round(media)) + '☆'.repeat(5 - Math.round(media));
            let barrasHTML = '';
            for(let i = 5; i >= 1; i--) {
                const pct = total > 0 ? (contagem[i] / total) * 100 : 0;
                barrasHTML += `
                    <div class="rating-bar-container">
                        <span class="rating-bar-label">${i} ★</span>
                        <div class="rating-bar-bg"><div class="rating-bar-fill" style="width: ${pct}%"></div></div>
                        <span class="rating-bar-count">${contagem[i]}</span>
                    </div>
                `;
            }
            
            if (summaryContainer) {
                summaryContainer.innerHTML = `
                    <div class="average-rating">${media}</div>
                    <div class="stars">${estrelasMedia}</div>
                    <div class="total-reviews">${total} avaliação(ões)</div>
                    <div style="width: 100%; margin-top: 10px;">${barrasHTML}</div>
                `;
            }
            
            // 3. Renderização de Cards Reutilizável
            const renderReview = (avaliacao) => {
                 const cliente = usuarios.find(u => u.email === avaliacao.clienteEmail);
                 const fotoCliente = cliente?.fotoPerfil || '../img/avatar_padrao.png';
                 const nomeCliente = cliente ? cliente.nome.split(' ')[0] : 'Anônimo';
                 const estrelas = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
                 // 🚀 Pega a data de criação do Banco de Dados (criado_em)
                 const dataAvaliacao = new Date(avaliacao.criado_em || avaliacao.data_avaliacao || new Date()).toLocaleDateString('pt-BR');
                 
                 // 🚀 Busca o nome do serviço para a TAG
                 const servicoAvaliado = servicosDoPrestador.find(s => String(s.id) === String(avaliacao.servico_id));
                 const nomeServicoTag = servicoAvaliado ? servicoAvaliado.titulo : 'Serviço Excluído';

                 return `
                     <div class="avaliacao-card fade-up-animation">
                         <div class="avaliacao-header" style="justify-content: space-between;">
                             <div style="display: flex; align-items: center; gap: 10px;">
                                 <img src="${fotoCliente}" alt="Avatar" class="menu-avatar">
                                 <strong>${nomeCliente}</strong>
                             </div>
                             <span style="font-size: 12px; color: #AAAAAA;">${dataAvaliacao}</span>
                         </div>
                         <div style="margin-bottom: 10px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <span class="rating-display">${estrelas}</span>
                            <span style="font-size: 11px; background: rgba(0, 173, 181, 0.1); color: #00ADB5; padding: 3px 8px; border-radius: 12px; border: 1px solid rgba(0, 173, 181, 0.3);">🔧 ${nomeServicoTag}</span>
                         </div>
                         ${avaliacao.comentario ? `<p class="avaliacao-comentario">"${avaliacao.comentario}"</p>` : ''}
                     </div>
                 `;
            };

            const avaliacoesInvertidas = [...avaliacoesDoPrestador].reverse(); // Mais recentes primeiro
            const visiveis = avaliacoesInvertidas.slice(0, 3);
            listaAvaliacoes.innerHTML = visiveis.map(renderReview).join('');
            
            if (avaliacoesDoPrestador.length > 3 && btnVerTodas) {
                btnVerTodas.style.display = 'block';
                btnVerTodas.innerText = `Ver todas as ${total} avaliações`;
                btnVerTodas.onclick = () => abrirModalAvaliacoes(avaliacoesInvertidas, renderReview);
            } else if (btnVerTodas) {
                btnVerTodas.style.display = 'none';
            }
        } else {
            containerAvaliacoes.style.display = "block";
            dashboard.style.display = "none"; // Esconde a grade se não houver avaliações
            if (btnVerTodas) btnVerTodas.style.display = 'none';
            listaAvaliacoes.innerHTML = `
                <div class="empty-state fade-up-animation avaliacao-card" style="text-align: center;">
                    <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 10px;">⭐</div>
                    <p style="color: #AAAAAA; font-style: italic;">Nenhuma avaliação encontrada para este filtro.</p>
                </div>`;
        }
    }

    function abrirModalAvaliacoes(avaliacoes, renderFn) {
        const modal = document.getElementById('avaliacoesModal');
        const listaModal = document.getElementById('modalListaAvaliacoes');
        if(!modal || !listaModal) return;
        
        listaModal.innerHTML = avaliacoes.map(renderFn).join('');
        modal.style.display = 'block';
        
        const closeBtn = document.getElementById('closeAvaliacoesModal');
        if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        window.addEventListener('click', e => { if(e.target === modal) modal.style.display = 'none'; });
    }

    function renderizarPortfolio(usuario) {
        const galeria = document.getElementById("portfolio-gallery");
        if (!galeria) return;

        const portfolio = usuario.prestador?.portfolio || [];

        if (portfolio.length === 0) {
            galeria.innerHTML = `<p style="color: #AAAAAA; font-style: italic; grid-column: 1 / -1; text-align: center;">Nenhuma foto no portfólio ainda.</p>`;
        } else {
            const MAX_VISIVEIS = 6;
            let html = '';
            
            const usuarioLogado = usuarios.find(u => u.email === emailLogado);
            const isAdmin = usuarioLogado && usuarioLogado.tipo === 'admin';
            const podeExcluir = isOwnProfile || isAdmin;

            portfolio.slice(0, MAX_VISIVEIS).forEach((imgObj, index) => {
                const imgBase64 = typeof imgObj === 'string' ? imgObj : imgObj.imagem_url;
                const imgId = typeof imgObj === 'string' ? index : imgObj.id; // Fallback se for string (legado)

                let dataAttrs = '';
                if (typeof imgObj === 'object') {
                    dataAttrs += ` data-descricao="${imgObj.descricao || ''}"`;
                    if (imgObj.verificado) {
                        const aval = avaliacoes.find(a => a.solicitacao_id === imgObj.solicitacao_id);
                        if (aval) {
                            dataAttrs += ` data-verificado="true" data-nota="${aval.nota}" data-comentario="${aval.comentario || ''}"`;
                        } else {
                            dataAttrs += ` data-verificado="true"`;
                        }
                    }
                }

                const btnExcluirHtml = podeExcluir ? `
                    <button class="delete-portfolio-btn" data-id="${imgId}" data-index="${index}" title="Excluir foto" aria-label="Excluir foto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
                    </button>` : '';

                // Se for a última imagem permitida na grade E existirem mais imagens no array
                if (index === MAX_VISIVEIS - 1 && portfolio.length > MAX_VISIVEIS) {
                    const restantes = portfolio.length - MAX_VISIVEIS + 1;
                    html += `
                        <div class="portfolio-item">
                            ${btnExcluirHtml}
                            <img src="${imgBase64}" ${dataAttrs} alt="Foto do portfólio">
                            <div class="portfolio-more" id="btn-open-full-portfolio">
                                +${restantes}
                            </div>
                        </div>
                    `;
                } else {
                    // Selo de Verificado
                    let seloVerificado = '';
                    if (typeof imgObj === 'object' && imgObj.verificado) {
                        seloVerificado = `<div style="position: absolute; bottom: 8px; left: 8px; background: #5cb85c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; z-index: 5; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">✅ Verificado</div>`;
                    }
                    // Imagem normal
                    html += `
                        <div class="portfolio-item">
                            ${btnExcluirHtml}
                            ${seloVerificado}
                            <img src="${imgBase64}" ${dataAttrs} alt="Foto do portfólio" onclick="abrirLightbox(this)">
                        </div>
                    `;
                }
            });
            
            galeria.innerHTML = html;

            // Adiciona o evento de clique no card "+X" se ele existir
            const btnMore = document.getElementById("btn-open-full-portfolio");
            if (btnMore) {
                btnMore.addEventListener('click', () => abrirModalPortfolio(portfolio));
            }
        }
    }

    function abrirModalPortfolio(portfolioArray) {
        const modal = document.getElementById('portfolioModal');
        const listaModal = document.getElementById('modalListaPortfolio');
        if(!modal || !listaModal) return;
        
        const usuarioLogado = usuarios.find(u => u.email === emailLogado);
        const isAdmin = usuarioLogado && usuarioLogado.tipo === 'admin';
        const podeExcluir = isOwnProfile || isAdmin;
        
        listaModal.innerHTML = portfolioArray.map((imgObj, index) => {
            const imgBase64 = typeof imgObj === 'string' ? imgObj : imgObj.imagem_url;
            const imgId = typeof imgObj === 'string' ? index : imgObj.id;
            
            let dataAttrs = '';
            let seloVerificado = '';
            if (typeof imgObj === 'object' && imgObj.verificado) {
                seloVerificado = `<div style="position: absolute; bottom: 8px; left: 8px; background: #5cb85c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; z-index: 5; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">✅ Verificado</div>`;
            }
            
            if (typeof imgObj === 'object') {
                dataAttrs += ` data-descricao="${imgObj.descricao || ''}"`;
                if (imgObj.verificado) {
                    const aval = avaliacoes.find(a => a.solicitacao_id === imgObj.solicitacao_id);
                    if (aval) {
                        dataAttrs += ` data-verificado="true" data-nota="${aval.nota}" data-comentario="${aval.comentario || ''}"`;
                    } else {
                        dataAttrs += ` data-verificado="true"`;
                    }
                }
            }
            
            const btnExcluirHtml = podeExcluir ? `<button class="delete-portfolio-btn" data-id="${imgId}" data-index="${index}" title="Excluir foto" aria-label="Excluir foto"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg></button>` : '';
            return `<div class="portfolio-item">${btnExcluirHtml}${seloVerificado}<img src="${imgBase64}" ${dataAttrs} alt="Foto do portfólio" onclick="abrirLightbox(this)"></div>`;
        }).join('');
        
        modal.style.display = 'block';
        
        const closeBtn = document.getElementById('closePortfolioModal');
        if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    }

    function excluirFotoPortfolio(idDaImagem) {
        mostrarConfirmacao("Tem certeza que deseja excluir esta foto do seu portfólio? Esta ação não pode ser desfeita.", async () => {
            try {
                // 1. Chama a API dedicada para excluir a imagem do banco de dados
                await API.excluirPortfolio(idDaImagem);

                // 2. Busca os dados mais recentes do usuário para garantir que a tela fique sincronizada
                const usuariosAtualizados = await API.getUsuarios();
                const usuarioAtualizado = usuariosAtualizados.find(u => u.email === usuarioAlvo.email);

                if (usuarioAtualizado) {
                    // 3. Atualiza o cache local e renderiza o perfil com os dados novos
                    const userIndex = usuarios.findIndex(u => u.email === usuarioAlvo.email);
                    if (userIndex !== -1) {
                        usuarios[userIndex] = usuarioAtualizado;
                    }
                    usuarioAlvo = usuarioAtualizado; // Atualiza a variável global

                    renderizarPortfolio(usuarioAlvo);

                    // Se o modal de "ver todas" estiver aberto, atualiza ele também
                    const modal = document.getElementById('portfolioModal');
                    if (modal && modal.style.display === 'block') {
                        abrirModalPortfolio(usuarioAlvo.prestador.portfolio);
                    }
                }
                mostrarToast("Foto excluída com sucesso!", "success");
            } catch (err) {
                mostrarToast(err.message || "Erro ao excluir a imagem do banco de dados.", "error");
            }
        });
    }

    // ================= MODAL INTELIGENTE DE PORTFÓLIO (LIVRE X VERIFICADO) =================
    let arquivoPortfolioTemp = null;

    function abrirModalAddPortfolio(arquivoInicial = null) {
        let modal = document.getElementById("modalAddPortfolio");
        if (!modal) {
            const html = `
                <div id="modalAddPortfolio" class="modal" style="display: flex; align-items: center; justify-content: center; z-index: 10000; background-color: rgba(0,0,0,0.7);">
                    <div class="modal-content fade-up-animation" style="max-width: 500px; height: auto; text-align: left; padding: 30px; margin: 0; position: relative;">
                        <span class="close-button" id="closeModalAddPortfolio" style="position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer;">&times;</span>
                        <h3 style="color: #00ADB5; margin-bottom: 20px; font-size: 22px;">Adicionar ao Portfólio</h3>

                        <div class="form-group">
                            <label style="color:#AAAAAA; font-size:13px;">Selecione a Imagem</label>
                            <input type="file" id="novaFotoPortfolio" accept="image/*" style="background: #2A343D; color: #EEE; padding: 10px; border: 1px dashed #4F5B66; border-radius: 8px; width: 100%; cursor: pointer;">
                            <img id="previewNovaFoto" style="width: 100%; max-height: 200px; object-fit: contain; margin-top: 10px; display: none; border-radius: 8px; border: 1px solid #4F5B66; background: #222A31;">
                        </div>

                        <div class="form-group" style="margin-top: 15px;">
                            <label style="color:#AAAAAA; font-size:13px;">Tipo de Projeto</label>
                            <div style="display: flex; gap: 15px; margin-top: 5px; background: #2A343D; padding: 15px; border-radius: 8px; border: 1px solid #4F5B66;">
                                <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; color: #EEE; font-size: 14px;">
                                    <input type="radio" name="tipoPortfolio" value="livre" checked style="width: 18px; height: 18px; cursor: pointer;"> 
                                    Trabalho Livre
                                </label>
                                <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; color: #EEE; font-size: 14px;" id="labelVerificado">
                                    <input type="radio" name="tipoPortfolio" value="verificado" style="width: 18px; height: 18px; cursor: pointer;"> 
                                    Projeto Verificado ✅
                                </label>
                            </div>
                            <small id="avisoSemConcluidos" style="color: #d9534f; display: none; margin-top: 5px;">Você precisa de pelo menos 1 serviço concluído no AjudaAí para verificar um projeto.</small>
                        </div>

                        <div class="form-group" id="containerSolicitacaoVerificada" style="display: none; margin-top: 15px;">
                            <label style="color:#AAAAAA; font-size:13px;">Vincular ao Serviço Concluído</label>
                            <select id="solicitacaoVinculada" style="background: #222A31; border: 1px solid #4F5B66; color: #EEE; width: 100%; padding: 12px; border-radius: 8px; outline: none; cursor: pointer;">
                            </select>
                        </div>

                        <div class="form-group" style="margin-top: 15px;">
                            <label style="color:#AAAAAA; font-size:13px;">Descrição (Opcional)</label>
                            <textarea id="descricaoPortfolio" rows="2" placeholder="Descreva os detalhes..." style="background: #222A31; border: 1px solid #4F5B66; color: #EEE; width: 100%; padding: 12px; border-radius: 8px; resize: vertical;"></textarea>
                        </div>

                        <button id="btnSalvarPortfolio" class="btn-login" style="margin-top: 25px;">Salvar no Portfólio</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
            modal = document.getElementById("modalAddPortfolio");

            // Eventos do novo Modal
            document.getElementById("closeModalAddPortfolio").onclick = () => modal.style.display = "none";
            
            document.querySelectorAll('input[name="tipoPortfolio"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    document.getElementById("containerSolicitacaoVerificada").style.display = e.target.value === 'verificado' ? 'block' : 'none';
                });
            });

            document.getElementById("novaFotoPortfolio").addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    arquivoPortfolioTemp = file;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const img = document.getElementById("previewNovaFoto");
                        img.src = ev.target.result;
                        img.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });

            document.getElementById("btnSalvarPortfolio").addEventListener('click', async function() {
                if (!arquivoPortfolioTemp) {
                    mostrarToast("Por favor, selecione uma imagem.", "error");
                    return;
                }

                const tipo = document.querySelector('input[name="tipoPortfolio"]:checked').value;
                const solicitacaoId = document.getElementById("solicitacaoVinculada").value;
                const descricao = document.getElementById("descricaoPortfolio").value.trim();

                if (tipo === 'verificado' && !solicitacaoId) {
                    mostrarToast("Selecione o serviço concluído para verificar o projeto.", "error");
                    return;
                }

                setButtonLoading(this);
                try {
                    mostrarToast("Processando imagem, aguarde...", "success");
                    const base64Comprimido = await comprimirImagem(arquivoPortfolioTemp, 800, 800, 0.7);
                    
                    const payload = {
                        imagemBase64: base64Comprimido,
                        tipo_portfolio: tipo,
                        solicitacao_id: tipo === 'verificado' ? parseInt(solicitacaoId) : null,
                        descricao: descricao
                    };

                    await API.adicionarPortfolio(payload);
                    
                    const novosUsuarios = await API.getUsuarios();
                    const userAtualizado = novosUsuarios.find(u => u.email === emailLogado);
                    
                    const userIndex = usuarios.findIndex(u => u.email === emailLogado);
                    if (userIndex !== -1 && userAtualizado) {
                        usuarios[userIndex] = userAtualizado;
                        if (isOwnProfile) usuarioAlvo = userAtualizado;
                    }
                    
                    renderizarPortfolio(userAtualizado);
                    mostrarToast("Projeto adicionado ao portfólio!", "success");
                    modal.style.display = "none";
                } catch (error) {
                    console.error("Erro no upload:", error);
                    mostrarToast(error.message || "Erro ao salvar imagem.", "error");
                } finally {
                    removeButtonLoading(this);
                }
            });
        }

        // Reseta o modal ao abrir
        arquivoPortfolioTemp = arquivoInicial;
        document.getElementById("novaFotoPortfolio").value = "";
        document.getElementById("descricaoPortfolio").value = "";
        document.querySelector('input[name="tipoPortfolio"][value="livre"]').checked = true;
        document.getElementById("containerSolicitacaoVerificada").style.display = "none";
        
        const preview = document.getElementById("previewNovaFoto");
        if (arquivoInicial) {
            const reader = new FileReader();
            reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
            reader.readAsDataURL(arquivoInicial);
        } else {
            preview.src = "";
            preview.style.display = "none";
        }

        // Busca e Popula as solicitações concluídas mais recentes na API
        API.getSolicitacoes().then(sols => {
            const concluidas = sols.filter(s => 
                (s.prestadorEmail === emailLogado || s.prestador_email === emailLogado) && s.status === 'CONCLUIDO'
            );

            const select = document.getElementById("solicitacaoVinculada");
            if (concluidas.length === 0) {
                document.getElementById("labelVerificado").style.opacity = '0.5';
                document.querySelector('input[name="tipoPortfolio"][value="verificado"]').disabled = true;
                document.getElementById("avisoSemConcluidos").style.display = 'block';
                select.innerHTML = '<option value="">Nenhum serviço concluído ainda</option>';
            } else {
                document.getElementById("labelVerificado").style.opacity = '1';
                document.querySelector('input[name="tipoPortfolio"][value="verificado"]').disabled = false;
                document.getElementById("avisoSemConcluidos").style.display = 'none';
                select.innerHTML = concluidas.map(s => {
                    const data = new Date(s.dataSolicitacao || s.criado_em).toLocaleDateString('pt-BR');
                    const clienteNome = s.cliente_nome || 'Cliente';
                    return `<option value="${s.id}">${s.servico} (para ${clienteNome} - ${data})</option>`;
                }).join('');
            }
        });

        modal.style.display = "flex";
    }

    // 🚀 Intercepta o clique no botão antigo para abrir o modal
    const btnAddPortfolioOriginal = document.getElementById('btn-add-portfolio');
    if (btnAddPortfolioOriginal) {
        btnAddPortfolioOriginal.addEventListener('click', function(e) {
            e.preventDefault(); 
            abrirModalAddPortfolio();
        });
    }

    // --- NOVO: Drag & Drop para Portfólio ---
    const portfolioContainer = document.getElementById("portfolio-gallery");
    if (portfolioContainer) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            portfolioContainer.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            portfolioContainer.addEventListener(eventName, () => {
                const inEditMode = document.getElementById("perfilForm").style.display === "block";
                if (isOwnProfile && inEditMode) portfolioContainer.classList.add('drag-active');
            }, false);
        });

        portfolioContainer.addEventListener('dragleave', e => {
            if (!portfolioContainer.contains(e.relatedTarget)) portfolioContainer.classList.remove('drag-active');
        }, false);

        portfolioContainer.addEventListener('drop', async (e) => {
            portfolioContainer.classList.remove('drag-active');
            const inEditMode = document.getElementById("perfilForm").style.display === "block";
            if (!isOwnProfile || !inEditMode) return;
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                abrirModalAddPortfolio(file);
            } else if (file) {
                mostrarToast("Por favor, solte apenas arquivos de imagem.", "error");
            }
        });
    }

    // Event Delegation para o botão de excluir foto
    portfolioContainer?.addEventListener('click', function(e) {
        const btn = e.target.closest('.delete-portfolio-btn');
        if (btn) {
            const idImg = parseInt(btn.dataset.id, 10);
            if (!isNaN(idImg)) {
                excluirFotoPortfolio(idImg);
            }
        }
    });
    
    const modalListaPortfolio = document.getElementById('modalListaPortfolio');
    if (modalListaPortfolio) {
        modalListaPortfolio.addEventListener('click', function(e) {
            const btn = e.target.closest('.delete-portfolio-btn');
            if (btn) {
                const idImg = parseInt(btn.dataset.id, 10);
                if (!isNaN(idImg)) {
                    excluirFotoPortfolio(idImg);
                }
            }
        });
    }

    // Fecha o modal de portfólio se clicar fora dele
    window.addEventListener('click', e => { 
        const pModal = document.getElementById('portfolioModal');
        if(pModal && e.target === pModal) {
            pModal.style.display = 'none'; 
        }
        const pAddModal = document.getElementById('modalAddPortfolio');
        if(pAddModal && e.target === pAddModal) {
            pAddModal.style.display = 'none'; 
        }
    });

    // ================= FUNÇÕES AUXILIARES =================

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
                        <button id="btnConfirmOk" class="btn-login" style="background-color: #d9534f; color: white; margin: 0; flex: 1; box-shadow: none;">Excluir</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('customConfirmModal');
        document.getElementById('btnConfirmCancel').onclick = () => modal.remove();
        document.getElementById('btnConfirmOk').onclick = () => { modal.remove(); callbackConfirmar(); };
    }

    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;

        if (emailLogado) {
            const usuarioLogado = usuarios.find(u => u.email === emailLogado);
            const fotoPerfil = usuarioLogado?.fotoPerfil || '../img/avatar_padrao.png';
            const primeiroNome = usuarioLogado.nome.split(' ')[0];
            const textoPedidos = usuarioLogado.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';

            // Usuário Logado
            menu.innerHTML = `
                <a href="index.html">Início</a>
                <a href="servicos.html">Serviços</a>
                ${usuarioLogado.tipo !== 'admin' ? `<a href="pedidos.html">${textoPedidos}</a>` : ''}
                <div class="profile-menu-container">
                    <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                        <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                        <span>${primeiroNome}</span>
                    </a>
                    <div class="profile-dropdown" id="profileDropdown">
                        ${usuarioLogado.tipo === 'admin' ? '<a href="admin.html" style="color: #d9534f; font-weight: bold;">👑 Painel Admin</a>' : ''}
                        ${usuarioLogado.tipo !== 'admin' ? `<a href="dashboard.html">Dashboard</a>` : ''}
                        <a href="perfil.html" class="active-nav">Meu Perfil</a>
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
        } else {
            // Usuário Deslogado (só pode acontecer vendo um perfil público)
            menu.innerHTML = `
                <a href="index.html">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="login.html">Entrar</a>
                <a href="register.html">Cadastrar</a>
            `;
        }
    }

    function logout(e) {
        if (e) e.preventDefault();
        API.fazerLogout();
        window.location.href = "login.html";
    }

    // ================= FUNÇÃO ADMINISTRATIVA =================
    window.banirEsteUsuario = function(id, nome) {
        const motivo = prompt(`👑 MODO ADMIN:\nInforme o motivo para banir ${nome} (Ficará registrado na auditoria):`);
        if (motivo) {
            API.banirUsuarioAdmin(id, motivo).then(() => {
                mostrarToast("Usuário banido com sucesso e registrado no log.", "success");
                setTimeout(() => window.location.href = "servicos.html", 1500);
            }).catch(e => mostrarToast(e.message, "error"));
        }
    };
});