document.addEventListener("DOMContentLoaded", function() {
    // ================= VARIÁVEIS GLOBAIS E VERIFICAÇÃO DE CONTEXTO =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    const params = new URLSearchParams(window.location.search);
    const perfilEmail = params.get("usuario");
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let usuarioAlvo; // O usuário cujo perfil está sendo exibido
    let isOwnProfile = false; // Flag para verificar se o usuário está vendo seu próprio perfil
    let novaFotoBase64 = null; // Para armazenar a nova foto antes de salvar

    // Elementos do DOM
    const btnEditar = document.getElementById("btnEditar");
    const btnSalvar = document.getElementById("btnSalvar");
    const formInputs = document.querySelectorAll("#perfilForm input, #perfilForm textarea, #perfilForm select");

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
    preencherFormulario(usuarioAlvo);
    setupHeader();

    // ================= FUNÇÕES DE CONFIGURAÇÃO DE MODO =================

    function configurarPerfilPublico() {
        // Esconde todos os controles de edição do card
        btnEditar.style.display = "none";
        btnSalvar.style.display = "none";
        document.getElementById("editPicLabel").style.display = "none";
        document.getElementById("areaTornarPrestador").style.display = "none";

        // Altera o título da página e do card
        document.title = `Perfil de ${usuarioAlvo.nome.split(' ')[0]} | AjudaAí`;
        document.querySelector('.login-card h2').innerText = `Perfil de Prestador`;

        // Oculta os campos de dados pessoais para visitantes (mostra apenas nome e serviços)
        const camposPrivados = ['cpf', 'email', 'telefone', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado'];
        camposPrivados.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.style.display = "none";
        });

        // Desabilita todos os campos do formulário
        formInputs.forEach(input => { input.disabled = true; });
    }

    function configurarMeuPerfil() {
        // Adiciona os event listeners para edição, salvamento, etc.
        btnEditar.addEventListener("click", () => alternarModoEdicao(true));
        document.getElementById("perfilForm").addEventListener("submit", salvarAlteracoes);
        document.getElementById("btnTornarPrestador")?.addEventListener("click", tornarPrestador);
        document.getElementById("profilePicInput").addEventListener("change", préVisualizarFoto);
    }

    // ================= FUNÇÕES PRINCIPAIS =================

    function preencherFormulario(usuario) {
        // Preenche a foto de perfil
        const profilePic = document.getElementById("profilePicPreview");
        if (usuario.fotoPerfil) {
            profilePic.src = usuario.fotoPerfil;
        } else {
            profilePic.src = "img/avatar_padrao.png";
        }

        // Se não for o próprio perfil, não mostra o botão de editar foto
        if (!isOwnProfile) {
            document.getElementById("editPicLabel").style.display = "none";
        }

        document.getElementById("nome").value = usuario.nome;
        document.getElementById("cpf").value = usuario.cpf;
        document.getElementById("email").value = usuario.email;
        document.getElementById("telefone").value = usuario.telefone;
        document.getElementById("cep").value = usuario.endereco.cep;
        document.getElementById("rua").value = usuario.endereco.rua;
        document.getElementById("numero").value = usuario.endereco.numero;
        document.getElementById("complemento").value = usuario.endereco.complemento || '';
        document.getElementById("bairro").value = usuario.endereco.bairro;
        document.getElementById("cidade").value = usuario.endereco.cidade;
        document.getElementById("estado").value = usuario.endereco.estado;

        if (usuario.tipo === "prestador" && usuario.prestador) {
            document.getElementById("camposPrestadorPerfil").style.display = "grid";
            if (usuario.prestador.categoria) document.getElementById("categoria").value = usuario.prestador.categoria;
            document.getElementById("servico").value = usuario.prestador.servico;
            document.getElementById("descricao").value = usuario.prestador.descricao;
            document.getElementById("valor").value = usuario.prestador.valor;
            document.getElementById("disponibilidade").value = usuario.prestador.disponibilidade;
            carregarAvaliacoes(usuario); // Carrega as avaliações para o prestador
        } else if (isOwnProfile) {
            // Mostra a opção de se tornar prestador apenas no próprio perfil
            document.getElementById("areaTornarPrestador").style.display = "block";
        }
    }

    function alternarModoEdicao(editar) {
        formInputs.forEach(input => {
            if (input.id !== 'cpf' && input.id !== 'email') {
                input.disabled = !editar;
            }
        });
        btnEditar.style.display = editar ? "none" : "block";
        btnSalvar.style.display = editar ? "block" : "none";
        if (isOwnProfile) document.getElementById("editPicLabel").style.display = editar ? "flex" : "none";
    }

    function tornarPrestador() {
        document.getElementById("areaTornarPrestador").style.display = "none";
        document.getElementById("camposPrestadorPerfil").style.display = "grid";
        usuarioAlvo.tipo = "prestador"; // Marca temporariamente para salvar
        alternarModoEdicao(true);
    }

    function préVisualizarFoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            document.getElementById("profilePicPreview").src = base64;
            novaFotoBase64 = base64; // Armazena para salvar depois
        };
        reader.readAsDataURL(file);
    }

    function salvarAlteracoes(e) {
        e.preventDefault();
        const userIndex = usuarios.findIndex(u => u.email === emailLogado);
        if (userIndex === -1) {
            mostrarToast("Ocorreu um erro ao salvar. Tente novamente.", "error");
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
            const categoria = document.getElementById("categoria").value;
            const servico = document.getElementById("servico").value.trim();
            const descricao = document.getElementById("descricao").value.trim();
            const valor = document.getElementById("valor").value.trim();
            const disponibilidade = document.getElementById("disponibilidade").value.trim();

            if (!categoria || !servico || !descricao || !valor || !disponibilidade) {
                mostrarToast("Por favor, preencha todos os dados de prestador, incluindo a categoria!", "error");
                return;
            }

            if (!usuarioEditado.prestador) usuarioEditado.prestador = {};
            usuarioEditado.prestador.categoria = categoria;
            usuarioEditado.prestador.servico = servico;
            usuarioEditado.prestador.descricao = descricao;
            usuarioEditado.prestador.valor = valor;
            usuarioEditado.prestador.disponibilidade = disponibilidade;
        }

        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        mostrarToast("Dados atualizados com sucesso!", "success");
        novaFotoBase64 = null; // Limpa a foto temporária
        alternarModoEdicao(false);
    }

    function carregarAvaliacoes(usuario) {
        const containerAvaliacoes = document.getElementById("avaliacoesRecebidas");
        const listaAvaliacoes = document.getElementById("listaAvaliacoes");
        const todasAvaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || [];
        const avaliacoesDoPrestador = todasAvaliacoes.filter(a => a.prestadorEmail === usuario.email);

        if (avaliacoesDoPrestador.length > 0) {
            containerAvaliacoes.style.display = "block";
            listaAvaliacoes.innerHTML = avaliacoesDoPrestador.map(avaliacao => {
                const cliente = usuarios.find(u => u.email === avaliacao.clienteEmail);
                const fotoCliente = cliente?.fotoPerfil || 'img/avatar_padrao.png';
                const nomeCliente = cliente ? cliente.nome.split(' ')[0] : 'Anônimo';
                const estrelas = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
                return `
                    <div class="avaliacao-card">
                        <div class="avaliacao-header">
                            <img src="${fotoCliente}" alt="Foto de ${nomeCliente}" class="menu-avatar">
                            <span class="rating-display">${estrelas}</span>
                            <strong>${nomeCliente}</strong>
                        </div>
                        ${avaliacao.comentario ? `<p class="avaliacao-comentario">"${avaliacao.comentario}"</p>` : ''}
                    </div>
                `;
            }).join('');
        } else {
            containerAvaliacoes.style.display = "block";
            listaAvaliacoes.innerHTML = '<p style="color: #AAAAAA; text-align: center;">Nenhuma avaliação recebida ainda.</p>';
        }
    }

    // ================= FUNÇÕES AUXILIARES =================

    function setupHeader() {
        const menu = document.getElementById("menu");
        if (!menu) return;

        if (emailLogado) {
            const usuarioLogado = usuarios.find(u => u.email === emailLogado);
            const fotoPerfil = usuarioLogado?.fotoPerfil || 'img/avatar_padrao.png';

            // Usuário Logado
            menu.innerHTML = `
                <a href="home.html">Início</a>
                <a href="servicos.html">Serviços</a>
                <a href="pedidos.html">Meus Pedidos</a>
                <div class="profile-menu-container">
                    <img src="${fotoPerfil}" alt="Avatar" class="menu-avatar" id="avatarMenuBtn" style="cursor: pointer;" title="Opções da Conta">
                    <div class="profile-dropdown" id="profileDropdown">
                        <a href="dashboard.html">Dashboard</a>
                        <a href="perfil.html">Meu Perfil</a>
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