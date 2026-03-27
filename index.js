function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// LOGIN
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("usuario");
const senhaInput = document.getElementById("senha");

const validateLoginEmail = () => {
    if (!validarEmail(emailInput.value.trim())) {
        setInputError(emailInput, "Por favor, insira um e-mail válido.");
        return false;
    }
    clearInputError(emailInput);
    return true;
};

const validateLoginSenha = () => {
    if (senhaInput.value.trim() === '') {
        setInputError(senhaInput, "A senha é obrigatória.");
        return false;
    }
    clearInputError(senhaInput);
    return true;
};

emailInput.addEventListener('blur', validateLoginEmail);
senhaInput.addEventListener('blur', validateLoginSenha);

loginForm.addEventListener("submit", function(e){
    e.preventDefault();

    const isEmailValid = validateLoginEmail();
    const isSenhaValid = validateLoginSenha();

    if (!isEmailValid || !isSenhaValid) {
        mostrarToast("Por favor, corrija os campos em vermelho.", "error");
        return;
    }

    const usuario = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    const lembrar = document.getElementById("lembrarConta").checked;

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioEncontrado = usuarios.find(u => u.email === usuario && u.senha === senha);

    if(!usuarioEncontrado){
        mostrarToast("E-mail ou senha incorretos!", "error");
        setInputError(emailInput, " "); // Marca os campos para indicar o erro
        setInputError(senhaInput, "E-mail ou senha incorretos.");
        return;
    }

    if(lembrar){
        localStorage.setItem("usuarioLogado", usuario);
    } else {
        sessionStorage.setItem("usuarioLogado", usuario);
    }

    // Redireciona para a home
    mostrarToast("Login bem-sucedido!", "success");
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1000);
});

// ESQUECI SENHA
document.getElementById("esqueciSenha").addEventListener("click", function(){
    window.location.href = "forgot.html";
});
