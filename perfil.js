document.addEventListener("DOMContentLoaded", function() {
    // ================= VARIÁVEIS GLOBAIS E VERIFICAÇÃO DE CONTEXTO =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const perfilEmail = params.get("usuario");
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let usuarioAlvo; // O usuário cujo perfil está sendo exibido
    let isOwnProfile = false; // Flag para verificar se o usuário está vendo seu próprio perfil
    let novaFotoBase64 = null; // Para armazenar a nova foto antes de salvar

    // Elementos do DOM
    const btnEditar = document.getElementById("btnEditar");
    const btnSalvar = document.getElementById("btnSalvar");

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

        configurarPerfilPublico();

    } else {
        // --- MODO MEU PERFIL (EDITÁVEL) ---
        if (!emailLogado) {
            mostrarToast("Você precisa fazer login para acessar esta página!", "error");
            setTimeout(() => { window.location.href = "index.html"; }, 1500);
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

        // Esconde dados pessoais sensíveis na visão pública
        document.getElementById('view-email').style.display = 'none';
        document.getElementById('view-telefone').style.display = 'none';
        document.querySelector('#view-email').parentElement.style.display = 'none';
        document.querySelector('#view-telefone').parentElement.style.display = 'none';

        // Esconde e-mail da sidebar também
        const sidebarEmail = document.getElementById('sidebar-user-email');
        if (sidebarEmail) sidebarEmail.style.display = 'none';
    }

    function configurarMeuPerfil() {
        // Adiciona os event listeners para edição, salvamento, etc.
        btnEditar.addEventListener("click", () => alternarModoEdicao(true));
        btnSalvar.addEventListener("click", salvarAlteracoes);
        document.getElementById("btnTornarPrestador")?.addEventListener("click", tornarPrestador);
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
        profilePic.src = usuario.fotoPerfil || "img/avatar_padrao.png";

        // Se não for o próprio perfil, não mostra o botão de editar foto
        if (!isOwnProfile) document.getElementById("editPicLabel").style.display = "none";

        // Preenche a sidebar com nome e email
        document.getElementById("sidebar-user-name").innerText = usuario.nome;
        document.getElementById("sidebar-user-email").innerText = usuario.email;

        // Preenche os campos de visualização
        document.getElementById("view-nome").innerText = usuario.nome;
        document.getElementById("view-email").innerText = usuario.email;
        document.getElementById("view-telefone").innerText = usuario.telefone;
        const end = usuario.endereco;
        document.getElementById("view-endereco").innerText = `${end.rua}, ${end.numero} ${end.complemento ? '- ' + end.complemento : ''}`;
        document.getElementById("view-cidade-estado").innerText = `${end.cidade} - ${end.estado}, CEP: ${end.cep}`;

        // Preenche as estatísticas da Sidebar
        const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
        if (usuario.tipo === "prestador") {
            document.getElementById("sidebar-tipo-perfil").innerText = "Profissional";
            document.getElementById("sidebar-label-servicos").innerText = "Serviços Concluídos";
            const concluidos = solicitacoes.filter(s => s.prestadorEmail === usuario.email && s.status === 'CONCLUIDO').length;
            document.getElementById("sidebar-servicos-count").innerText = concluidos;
        } else {
            document.getElementById("sidebar-tipo-perfil").innerText = "Cliente";
            document.getElementById("sidebar-label-servicos").innerText = "Serviços Solicitados";
            const solicitados = solicitacoes.filter(s => s.clienteEmail === usuario.email).length;
            document.getElementById("sidebar-servicos-count").innerText = solicitados;
        }
        
        // Exibe "Ativa e Verificada" apenas para o próprio perfil, se for visitante mostra "Perfil Verificado"
        const statusConta = document.getElementById("sidebar-status-conta");
        if (!isOwnProfile && statusConta) statusConta.innerHTML = `<span style="display: inline-block; width: 10px; height: 10px; background-color: #5cb85c; border-radius: 50%;"></span> Perfil Verificado`;

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
            const p = usuario.prestador;
            // Preenche visualização
            document.getElementById("view-categoria").innerText = p.categoria || '-';
            document.getElementById("view-servico").innerText = p.servico || '-';
            document.getElementById("view-descricao").innerText = p.descricao || '-';
            document.getElementById("view-valor").innerText = formatarMoedaParaMascara(p.valor) || '-';
            document.getElementById("view-disponibilidade").innerText = p.disponibilidade || '-';
            // Preenche edição
            if (p.categoria) document.getElementById("categoria").value = p.categoria;
            document.getElementById("servico").value = p.servico;
            document.getElementById("descricao").value = p.descricao;
            document.getElementById("valor").value = formatarMoedaParaMascara(p.valor);
            document.getElementById("disponibilidade").value = p.disponibilidade;
            
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
        if (viewPrestador && formPrestador) {
            viewPrestador.style.display = editar ? "none" : "block";
            formPrestador.style.display = editar ? "block" : "none";
        }

        btnEditar.style.display = editar ? "none" : "block";
        btnSalvar.style.display = editar ? "block" : "none";
        
        // Esconde o botão de copiar link durante a edição para manter a tela limpa
        const btnCopiarLink = document.getElementById("btnCopiarLink");
        if (btnCopiarLink && usuarioAlvo.tipo === "prestador") {
            btnCopiarLink.style.display = editar ? "none" : "block";
        }

        if (isOwnProfile) document.getElementById("editPicLabel").style.display = editar ? "flex" : "none";
        if (isOwnProfile) document.getElementById("btn-add-portfolio").style.display = editar ? "inline-flex" : "none";
    }

    function tornarPrestador() {
        document.getElementById("areaTornarPrestador").style.display = "none";
        document.getElementById("secao-prestador").style.display = "block";
        usuarioAlvo.tipo = "prestador"; // Marca temporariamente para salvar
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

    function salvarAlteracoes(e) {
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

        if (usuarios[userIndex].tipo === "prestador") {
            const categoria = document.getElementById("categoria").value.trim();
            const servico = document.getElementById("servico").value.trim();
            const descricao = document.getElementById("descricao").value.trim();
            const valor = document.getElementById("valor").value.trim();
            const disponibilidade = document.getElementById("disponibilidade").value.trim();

            if (!categoria || !servico || !descricao || !valor || !disponibilidade) {
                mostrarToast("Por favor, preencha todos os dados de prestador, incluindo a categoria!", "error");
                removeButtonLoading(btnSalvar);
                return;
            }

            if (!usuarioEditado.prestador) usuarioEditado.prestador = {};
            usuarioEditado.prestador.categoria = categoria;
            usuarioEditado.prestador.servico = servico;
            usuarioEditado.prestador.descricao = descricao;
            usuarioEditado.prestador.valor = limparMascaraDinheiro(valor);
            usuarioEditado.prestador.disponibilidade = disponibilidade;
        }

        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        // Adiciona um delay para o usuário perceber o loading
        setTimeout(() => {
            mostrarToast("Dados atualizados com sucesso!", "success");
            novaFotoBase64 = null; // Limpa a foto temporária
            preencherDados(usuarioEditado); // Re-renderiza os dados no modo de visualização
            alternarModoEdicao(false); // Volta para o modo de visualização
            removeButtonLoading(btnSalvar);
        }, 800);
    }

    function carregarAvaliacoes(usuario) {
        const containerAvaliacoes = document.getElementById("avaliacoesRecebidas");
        const dashboard = document.getElementById("avaliacoesDashboard");
        const listaAvaliacoes = document.getElementById("listaAvaliacoes");
        const summaryContainer = document.getElementById("avaliacoes-summary");
        const btnVerTodas = document.getElementById("btnVerTodasAvaliacoes");
        
        const todasAvaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];
        const avaliacoesDoPrestador = todasAvaliacoes.filter(a => a.prestadorEmail === usuario.email);

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
                 const fotoCliente = cliente?.fotoPerfil || 'img/avatar_padrao.png';
                 const nomeCliente = cliente ? cliente.nome.split(' ')[0] : 'Anônimo';
                 const estrelas = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
                 const dataAvaliacao = new Date(avaliacao.data_avaliacao || new Date()).toLocaleDateString('pt-BR');
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
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            renderizarPortfolio(usuarios[userIndex]);
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
                    localStorage.setItem("usuarios", JSON.stringify(usuarios));
                    renderizarPortfolio(usuarios[userIndex]);
                } catch (error) {
                    mostrarToast("Erro ao processar a imagem.", "error");
                }
            } else if (file) {
                mostrarToast("Por favor, solte apenas arquivos de imagem.", "error");
            }
        });
    }

    // Fecha o modal de portfólio se clicar fora dele
    window.addEventListener('click', e => { 
        const pModal = document.getElementById('portfolioModal');
        if(pModal && e.target === pModal) {
            pModal.style.display = 'none'; 
        }
    });

    // ================= FUNÇÕES AUXILIARES =================

    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;

        if (emailLogado) {
            const usuarioLogado = usuarios.find(u => u.email === emailLogado);
            const fotoPerfil = usuarioLogado?.fotoPerfil || 'img/avatar_padrao.png';
            const primeiroNome = usuarioLogado.nome.split(' ')[0];
            const textoPedidos = usuarioLogado.tipo === 'prestador' ? 'Meus Serviços' : 'Meus Pedidos';

            // Usuário Logado
            menu.innerHTML = `
                <a href="home.html">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="pedidos.html">${textoPedidos}</a>
                <div class="profile-menu-container">
                    <a href="#" id="avatarMenuBtn" class="menu-avatar-link" data-tooltip="Opções da Conta" data-tooltip-dir="down">
                        <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar">
                        <span>${primeiroNome}</span>
                    </a>
                    <div class="profile-dropdown" id="profileDropdown">
                        <a href="dashboard.html">Dashboard</a>
                        <a href="perfil.html" class="active-nav">Meu Perfil</a>
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
                <a href="home.html">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="index.html">Entrar</a>
                <a href="register.html">Cadastrar</a>
            `;
        }
    }

    function logout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    }
});