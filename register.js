// Array simulado de usuários
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

// Função para validar email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

// Máscara de CPF
document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
    value = value.replace(/(\d{3})(\d)/, '$1.$2'); 
    value = value.replace(/(\d{3})(\d)/, '$1.$2'); 
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// Máscara de Telefone (Fixo ou Celular Padrão BR)
document.getElementById('telefone').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca os parênteses do DDD
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');    // Coloca o hífen na parte correta
    e.target.value = value;
});

// Alternar campos de prestador
const radiosUsuario = document.getElementsByName("tipoUsuario");
radiosUsuario.forEach(radio => {
    radio.addEventListener("change", function() {
        const camposPrestador = document.getElementById("camposPrestador");
        if(this.value === "prestador"){
            camposPrestador.style.display = "block";
        } else {
            camposPrestador.style.display = "none";
        }
    });
});

// Formulário de cadastro
document.getElementById("registerForm").addEventListener("submit", function(e){
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cep = document.getElementById("cep").value.trim();
    const rua = document.getElementById("rua").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const complemento = document.getElementById("complemento").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const confirmSenha = document.getElementById("confirmSenha").value.trim();
    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;
    const lembrar = document.getElementById("lembrarContaRegister").checked;

    let categoria = "", servico = "", descricao = "", valor = "", disponibilidade = "";
    if (tipoUsuario === "prestador") {
        categoria = document.getElementById("categoria").value;
        servico = document.getElementById("servico").value.trim();
        descricao = document.getElementById("descricao").value.trim();
        valor = document.getElementById("valor").value.trim();
        disponibilidade = document.getElementById("disponibilidade").value.trim();
    }

    // Valida campos
    if(!nome || !cpf || !email || !telefone || !cep || !rua || !numero || !bairro || !cidade || !estado || !senha || !confirmSenha){
        mostrarToast("Preencha todos os campos básicos obrigatórios!", "error");
        return;
    }

    if (tipoUsuario === "prestador" && (!categoria || !servico || !descricao || !valor || !disponibilidade)) {
        mostrarToast("Preencha todos os campos, incluindo a categoria!", "error");
        return;
    }

    if(!validarCPF(cpf)){
        mostrarToast("CPF inválido!", "error");
        return;
    }

    if(!validarEmail(email)){
        mostrarToast("E-mail inválido!", "error");
        return;
    }

    if(senha !== confirmSenha){
        mostrarToast("As senhas não conferem!", "error");
        return;
    }

    // Verifica se o usuário já existe
    const usuarioExistente = usuarios.find(u => u.email === email);
    if(usuarioExistente){
        mostrarToast("Usuário já cadastrado com este e-mail!", "error");
        return;
    }

    // Adiciona usuário ao array
    const novoUsuario = { 
        nome, cpf, email, telefone, 
        endereco: { cep, rua, numero, complemento, bairro, cidade, estado }, 
        senha, tipo: tipoUsuario 
    };
    
    if (tipoUsuario === "prestador") {
        novoUsuario.prestador = { categoria, servico, descricao, valor, disponibilidade };
    }

    usuarios.push(novoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // Salva login se marcar lembrar
    if(lembrar){
        localStorage.setItem("usuarioLogado", email);
    } else {
        sessionStorage.setItem("usuarioLogado", email);
    }

    mostrarToast("Cadastro realizado com sucesso!", "success");
    setTimeout(() => {
        window.location.href = "home.html";
    }, 1500);
});
