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
        document.getElementById("areaTornarPrestador").style.display = "none";

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
        if(btnContratar) btnContratar.onclick = () => window.location.href = `solicitar.html?prestador=${encodeURIComponent(usuario.email)}`;

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
        } else if (isOwnProfile) {
            // Se o usuário é um cliente vendo o próprio perfil, mostra o botão para virar prestador
            document.getElementById("areaTornarPrestador").style.display = "block";
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

    async function tornarPrestador() {
        document.getElementById("areaTornarPrestador").style.display = "none";
        document.getElementById("secao-prestador").style.display = "block";
        usuarioAlvo.tipo = "prestador"; // Marca a mudança
        
        if (!usuarioAlvo.prestador) {
            usuarioAlvo.prestador = {}; // Inicializa o objeto de metadados
        }

        // UX: Mostra que está processando a mudança para evitar impaciência
        const btnTornar = document.getElementById("btnTornarPrestador");
        if (btnTornar) {
            btnTornar.innerText = "Configurando seu perfil profissional...";
            btnTornar.disabled = true;
        }

        try {
            // 🚀 AUTO-SALVA NO BANCO: Transforma o cliente em prestador imediatamente nos bastidores!
            await API.atualizarPerfilApi(usuarioAlvo);
            mostrarToast("Parabéns! Você agora é um profissional. Já pode adicionar seus serviços abaixo.", "success");
        } catch (error) {
            console.error("Erro ao converter para prestador:", error);
            mostrarToast("Erro ao ativar modo prestador. Tente salvar manualmente no fim da página.", "error");
        }

        alternarModoEdicao(true);
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

        if (meusServicos.length === 0) {
            listaContainer.innerHTML = `<p style="color: #AAAAAA; font-style: italic; text-align: center;">Você ainda não cadastrou nenhum serviço.</p>`;
            return;
        }

        listaContainer.innerHTML = meusServicos.map(servico => `
            <div class="meu-servico-card">
                <div class="servico-info">
                    <h4>${servico.titulo}</h4>
                    <p style="font-size: 13px; color: #AAAAAA;">Categoria: ${servico.categoria}</p>
                </div>
                <div class="botoes-acao" style="margin-top: 0;">
                    ${isOwnProfile 
                        ? `<button class="btn-ver-perfil" onclick="abrirModalServico('${servico.id}')" style="padding: 8px 15px;">Editar</button>
                           <button class="btn-acao recusar" onclick="excluirServico('${servico.id}')" style="padding: 8px 15px;">Excluir</button>`
                        : `<button class="btn-service" onclick="window.location.href='solicitar.html?servicoId=${servico.id}'" style="padding: 8px 15px;">Solicitar</button>`}
                </div>
            </div>
        `).join('');
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

        if (servicoId) {
            // Modo Edição
            servicoModalTitle.innerText = "Editar Serviço";
            const todosServicos = await API.getServicos();
            const servico = todosServicos.find(s => String(s.id) === String(servicoId));
            if (servico) {
                document.getElementById("servicoId").value = servico.id;
                document.getElementById("servicoTitulo").value = servico.titulo;
                document.getElementById("servicoCategoria").value = servico.categoria;
                document.getElementById("servicoDescricao").value = servico.descricao;
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

        if (!titulo || !categoria) {
            removeButtonLoading(submitButton);
            mostrarToast("Título e Categoria são obrigatórios.", "error");
            return;
        }

        try {
            if (id) { // Editando
                // 🚀 Edita direto no Banco de Dados MySQL
                await API.editarServico(id, { titulo, categoria, descricao });
            } else { // Criando
                // 🚀 Envia direto para o Banco de Dados MySQL via Node.js
                await API.criarServico({ titulo, categoria, descricao });
            }
    
            mostrarToast("Serviço salvo no Banco de Dados com sucesso!", "success");
            servicoModal.style.display = "none";
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

    function carregarAvaliacoes(usuario) {
        const containerAvaliacoes = document.getElementById("avaliacoesRecebidas");
        const dashboard = document.getElementById("avaliacoesDashboard");
        const listaAvaliacoes = document.getElementById("listaAvaliacoes");
        const summaryContainer = document.getElementById("avaliacoes-summary");
        const btnVerTodas = document.getElementById("btnVerTodasAvaliacoes");
        
        const avaliacoesDoPrestador = avaliacoes.filter(a => a.prestadorEmail === usuario.email);

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
                 return `
                     <div class="avaliacao-card fade-up-animation">
                         <div class="avaliacao-header" style="justify-content: space-between;">
                             <div style="display: flex; align-items: center; gap: 10px;">
                                 <img src="${fotoCliente}" alt="Avatar" class="menu-avatar">
                                 <strong>${nomeCliente}</strong>
                             </div>
                             <span style="font-size: 12px; color: #AAAAAA;">${dataAvaliacao}</span>
                         </div>
                         <div style="margin-bottom: 10px;"><span class="rating-display">${estrelas}</span></div>
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
            }
        } else {
            containerAvaliacoes.style.display = "block";
            dashboard.style.display = "none"; // Esconde a grade se não houver avaliações
            listaAvaliacoes.innerHTML = `
                <div class="empty-state fade-up-animation avaliacao-card" style="text-align: center;">
                    <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 10px;">⭐</div>
                    <p style="color: #AAAAAA; font-style: italic;">Nenhuma avaliação recebida ainda.</p>
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

            portfolio.slice(0, MAX_VISIVEIS).forEach((imgBase64, index) => {
                // Se for a última imagem permitida na grade E existirem mais imagens no array
                if (index === MAX_VISIVEIS - 1 && portfolio.length > MAX_VISIVEIS) {
                    const restantes = portfolio.length - MAX_VISIVEIS + 1;
                    html += `
                        <div class="portfolio-item">
                            <button class="delete-portfolio-btn" data-index="${index}" title="Excluir foto">&times;</button>
                            <img src="${imgBase64}" alt="Foto do portfólio">
                            <div class="portfolio-more" id="btn-open-full-portfolio">
                                +${restantes}
                            </div>
                        </div>
                    `;
                } else {
                    // Imagem normal
                    html += `
                        <div class="portfolio-item">
                            <button class="delete-portfolio-btn" data-index="${index}" title="Excluir foto">&times;</button>
                            <img src="${imgBase64}" alt="Foto do portfólio" onclick="abrirLightbox(this)">
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
        
        listaModal.innerHTML = portfolioArray.map(img => `<div class="portfolio-item"><img src="${img}" alt="Foto do portfólio" onclick="abrirLightbox(this)"></div>`).join('');
        modal.style.display = 'block';
        
        const closeBtn = document.getElementById('closePortfolioModal');
        if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    }

    function excluirFotoPortfolio(indexParaExcluir) {
        mostrarConfirmacao("Tem certeza que deseja excluir esta foto do seu portfólio? Esta ação não pode ser desfeita.", async () => {
            const userIndex = usuarios.findIndex(u => u.email === emailLogado);
            if (userIndex === -1) {
                mostrarToast("Erro ao encontrar seu usuário.", "error");
                return;
            }

            const usuario = usuarios[userIndex];
            const portfolio = usuario.prestador?.portfolio;

            if (portfolio && portfolio[indexParaExcluir] !== undefined) {
                // Remove a imagem do array pelo índice
                portfolio.splice(indexParaExcluir, 1);

                try {
                    await API.atualizarPerfilApi(usuario);
                    renderizarPortfolio(usuario);
                    mostrarToast("Foto excluída com sucesso!", "success");
                } catch (err) {
                    mostrarToast("Erro ao excluir do banco.", "error");
                }
            }
        });
    }

    document.getElementById('portfolio-upload')?.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            mostrarToast("Processando imagem, aguarde...", "success");
            const base64Comprimido = await comprimirImagem(file, 800, 800, 0.7);
            
            const userIndex = usuarios.findIndex(u => u.email === emailLogado);
            if (userIndex === -1) return;

            if (!usuarios[userIndex].prestador.portfolio) usuarios[userIndex].prestador.portfolio = [];
            usuarios[userIndex].prestador.portfolio.push(base64Comprimido);
            
            try {
                await API.atualizarPerfilApi(usuarios[userIndex]);
                renderizarPortfolio(usuarios[userIndex]);
            } catch (err) { mostrarToast("Erro ao salvar a imagem no banco.", "error"); }
        } catch (error) {
            mostrarToast("Erro ao processar a imagem.", "error");
        }
    });

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
                try {
                    mostrarToast("Processando imagem, aguarde...", "success");
                    const base64Comprimido = await comprimirImagem(file, 800, 800, 0.7);
                    
                    const userIndex = usuarios.findIndex(u => u.email === emailLogado);
                    if (userIndex === -1) return;

                    if (!usuarios[userIndex].prestador.portfolio) usuarios[userIndex].prestador.portfolio = [];
                    usuarios[userIndex].prestador.portfolio.push(base64Comprimido);
                    
                    await API.atualizarPerfilApi(usuarios[userIndex]);
                    renderizarPortfolio(usuarios[userIndex]);
                } catch (error) {
                    mostrarToast("Erro ao processar a imagem.", "error");
                }
            } else if (file) {
                mostrarToast("Por favor, solte apenas arquivos de imagem.", "error");
            }
        });
    }

    // Event Delegation para o botão de excluir foto
    portfolioContainer?.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-portfolio-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            excluirFotoPortfolio(index);
        }
    });

    // Fecha o modal de portfólio se clicar fora dele
    window.addEventListener('click', e => { 
        const pModal = document.getElementById('portfolioModal');
        if(pModal && e.target === pModal) {
            pModal.style.display = 'none'; 
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
                <a href="pedidos.html">${textoPedidos}</a>
                <div class="profile-menu-container">
                    <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                        <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                        <span>${primeiroNome}</span>
                    </a>
                    <div class="profile-dropdown" id="profileDropdown">
                        ${usuarioLogado.tipo === 'admin' ? '<a href="admin.html" style="color: #d9534f; font-weight: bold;">👑 Painel Admin</a>' : ''}
                        <a href="dashboard.html">Dashboard</a>
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
});