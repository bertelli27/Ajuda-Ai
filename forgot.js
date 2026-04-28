function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

const forgotForm = document.getElementById("forgotForm");
const emailInput = document.getElementById("emailForgot");

const validateForgotEmail = () => {
    const email = emailInput.value.trim();
    if (!validarEmail(email)) {
        setInputError(emailInput, "Por favor, insira um e-mail válido.");
        return false;
    }
    clearInputError(emailInput);
    return true;
};

emailInput.addEventListener('blur', validateForgotEmail);

forgotForm.addEventListener("submit", async function(e){
    e.preventDefault();

    if (!validateForgotEmail()) {
        mostrarToast("Por favor, corrija o campo em vermelho.", "error");
        return;
    }
    
    const btnSubmit = document.querySelector('#forgotForm button[type="submit"]');
    setButtonLoading(btnSubmit);

    const email = emailInput.value.trim();
    const resetUrlBase = window.location.href.replace('forgot.html', 'redefinir-senha.html').split('?')[0];
    
    try {
        await API.solicitarRecuperacaoSenha(email, resetUrlBase);
        mostrarToast("E-mail enviado! Verifique sua caixa de entrada.", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 2500);
    } catch (error) {
        mostrarToast(error.message, "error");
        removeButtonLoading(btnSubmit);
    }
});
