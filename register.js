// Array simulado de usuários
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

// Função para validar email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Formulário de cadastro
document.getElementById("registerForm").addEventListener("submit", function(e){
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const confirmSenha = document.getElementById("confirmSenha").value.trim();
    const lembrar = document.getElementById("lembrarContaRegister").checked;

    // Valida campos
    if(!nome || !email || !senha || !confirmSenha){
        alert("Preencha todos os campos!");
        return;
    }

    if(!validarEmail(email)){
        alert("E-mail inválido!");
        return;
    }

    if(senha !== confirmSenha){
        alert("As senhas não conferem!");
        return;
    }

    // Verifica se o usuário já existe
    const usuarioExistente = usuarios.find(u => u.email === email);
    if(usuarioExistente){
        alert("Usuário já cadastrado com este e-mail!");
        return;
    }

    // Adiciona usuário ao array
    const novoUsuario = { nome, email, senha };
    usuarios.push(novoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // Salva login se marcar lembrar
    if(lembrar){
        localStorage.setItem("usuarioLogado", email);
    } else {
        sessionStorage.setItem("usuarioLogado", email);
    }

    alert("Cadastro realizado com sucesso!");
    window.location.href = "home.html";
});
