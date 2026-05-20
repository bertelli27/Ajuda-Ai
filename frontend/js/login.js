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

loginForm.addEventListener("submit", async function(e){
    e.preventDefault();
    const btnSubmit = e.submitter || document.querySelector('#loginForm button[type="submit"]');
    setButtonLoading(btnSubmit);

    const isEmailValid = validateLoginEmail();
    const isSenhaValid = validateLoginSenha();

    if (!isEmailValid || !isSenhaValid) {
        mostrarToast("Por favor, corrija os campos em vermelho.", "error");
        removeButtonLoading(btnSubmit);
        return;
    }

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    const lembrar = document.getElementById("lembrarConta").checked;

    try {
        // 🚀 FAZ O LOGIN REAL CHAMANDO A API EM NODE.JS!
        const resposta = await API.login(email, senha);
        
        // Se a API não deu erro, decidimos onde salvar (Local ou Session)
        const storage = lembrar ? localStorage : sessionStorage;
        
        // 1. Salva o Token de Segurança Verdadeiro
        storage.setItem("token", resposta.token);
        
        // 2. Mantém o e-mail logado para não quebrar o Front-end antigo por enquanto
        storage.setItem("usuarioLogado", resposta.usuario.email);

        mostrarToast("Login bem-sucedido! Redirecionando...", "success");
        setTimeout(() => {
            if (resposta.usuario.tipo === 'admin') {
                window.location.href = "index.html";
            } else {
                window.location.href = "dashboard.html";
            }
        }, 1000);
        
    } catch (error) {
        // Se a senha for errada, a API vai disparar o erro até aqui!
        mostrarToast(error.message, "error");
        removeButtonLoading(btnSubmit);
    }
});

// ESQUECI SENHA
document.getElementById("esqueciSenha").addEventListener("click", function(){
    window.location.href = "forgot.html";
});
