document.addEventListener("DOMContentLoaded", function() {
    // ================= AUTENTICAÇÃO E CARREGAMENTO DE DADOS =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    
    if (!emailLogado) {
        alert("Você precisa fazer login para acessar esta página!");
        window.location.href = "index.html";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);

    if (!usuarioAtual) {
        alert("Erro ao carregar dados do usuário. Faça login novamente.");
        logout();
        return;
    }

    // ================= PREENCHIMENTO DO FORMULÁRIO =================
    function preencherFormulario() {
        document.getElementById("nome").value = usuarioAtual.nome;
        document.getElementById("cpf").value = usuarioAtual.cpf;
        document.getElementById("email").value = usuarioAtual.email;
        document.getElementById("telefone").value = usuarioAtual.telefone;
        document.getElementById("cep").value = usuarioAtual.endereco.cep;
        document.getElementById("rua").value = usuarioAtual.endereco.rua;
        document.getElementById("numero").value = usuarioAtual.endereco.numero;
        document.getElementById("complemento").value = usuarioAtual.endereco.complemento || '';
        document.getElementById("bairro").value = usuarioAtual.endereco.bairro;
        document.getElementById("cidade").value = usuarioAtual.endereco.cidade;
        document.getElementById("estado").value = usuarioAtual.endereco.estado;

        // Preenche campos de prestador, se existirem
        if (usuarioAtual.tipo === "prestador" && usuarioAtual.prestador) {
            document.getElementById("camposPrestadorPerfil").style.display = "grid";
            document.getElementById("servico").value = usuarioAtual.prestador.servico;
            document.getElementById("descricao").value = usuarioAtual.prestador.descricao;
            document.getElementById("valor").value = usuarioAtual.prestador.valor;
            document.getElementById("disponibilidade").value = usuarioAtual.prestador.disponibilidade;
        } else {
            // Se for apenas cliente, exibe a opção de se tornar prestador
            document.getElementById("areaTornarPrestador").style.display = "block";
        }
    }

    preencherFormulario();

    // ================= TORNAR-SE PRESTADOR =================
    document.getElementById("btnTornarPrestador")?.addEventListener("click", () => {
        document.getElementById("areaTornarPrestador").style.display = "none";
        document.getElementById("camposPrestadorPerfil").style.display = "grid";
        
        // Marca o usuário temporariamente como prestador e ativa a edição obrigatória
        usuarioAtual.tipo = "prestador";
        alternarModoEdicao(true);
    });

    // ================= CONTROLE DE EDIÇÃO =================
    const btnEditar = document.getElementById("btnEditar");
    const btnSalvar = document.getElementById("btnSalvar");
    const formInputs = document.querySelectorAll("#perfilForm input");

    function alternarModoEdicao(editar) {
        formInputs.forEach(input => {
            // CPF e E-mail nunca são editáveis
            if (input.id !== 'cpf' && input.id !== 'email') {
                input.disabled = !editar;
            }
        });

        btnEditar.style.display = editar ? "none" : "block";
        btnSalvar.style.display = editar ? "block" : "none";
    }

    btnEditar.addEventListener("click", () => {
        alternarModoEdicao(true);
    });

    // ================= SALVAR ALTERAÇÕES =================
    document.getElementById("perfilForm").addEventListener("submit", function(e) {
        e.preventDefault();

        // Encontrar o índice do usuário no array original
        const userIndex = usuarios.findIndex(u => u.email === emailLogado);
        if (userIndex === -1) {
            alert("Ocorreu um erro ao salvar. Tente novamente.");
            return;
        }

        // Atualizar os dados do objeto do usuário
        usuarios[userIndex].nome = document.getElementById("nome").value.trim();
        usuarios[userIndex].telefone = document.getElementById("telefone").value.trim();
        usuarios[userIndex].endereco.cep = document.getElementById("cep").value.trim();
        usuarios[userIndex].endereco.rua = document.getElementById("rua").value.trim();
        usuarios[userIndex].endereco.numero = document.getElementById("numero").value.trim();
        usuarios[userIndex].endereco.complemento = document.getElementById("complemento").value.trim();
        usuarios[userIndex].endereco.bairro = document.getElementById("bairro").value.trim();
        usuarios[userIndex].endereco.cidade = document.getElementById("cidade").value.trim();
        usuarios[userIndex].endereco.estado = document.getElementById("estado").value.trim();

        // Atualiza o tipo do usuário (pode ter mudado de cliente para prestador nesta sessão)
        usuarios[userIndex].tipo = usuarioAtual.tipo;

        // Atualiza dados do prestador se for o caso
        if (usuarios[userIndex].tipo === "prestador") {
            const servico = document.getElementById("servico").value.trim();
            const descricao = document.getElementById("descricao").value.trim();
            const valor = document.getElementById("valor").value.trim();
            const disponibilidade = document.getElementById("disponibilidade").value.trim();

            // Validação simples: exigir que os campos sejam preenchidos ao se tornar prestador
            if (!servico || !descricao || !valor || !disponibilidade) {
                alert("Por favor, preencha todos os dados de prestador antes de salvar as alterações!");
                return; // Impede o salvamento se estiver incompleto
            }

            if (!usuarios[userIndex].prestador) usuarios[userIndex].prestador = {};
            usuarios[userIndex].prestador.servico = servico;
            usuarios[userIndex].prestador.descricao = descricao;
            usuarios[userIndex].prestador.valor = valor;
            usuarios[userIndex].prestador.disponibilidade = disponibilidade;
        }

        // Salvar o array de usuários atualizado no LocalStorage
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        alert("Dados atualizados com sucesso!");
        
        // Retornar ao modo de visualização
        alternarModoEdicao(false);
    });


    // ================= LOGOUT =================
    function logout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    }

    document.getElementById("btnLogout").addEventListener("click", logout);
});