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
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    if (!usuarios.some(u => u.email === email)) {
        setInputError(emailInput, "Este e-mail não está cadastrado no sistema.");
        return false;
    }
    clearInputError(emailInput);
    return true;
};

emailInput.addEventListener('blur', validateForgotEmail);

forgotForm.addEventListener("submit", function(e){
    e.preventDefault();

    if (!validateForgotEmail()) {
        mostrarToast("Por favor, corrija o campo em vermelho.", "error");
        return;
    }

    const email = emailInput.value.trim();
    // Simular a geração de um Token de Recuperação Seguro (15 minutos de validade)
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetData = {
        token: token,
        email: email,
        expires: Date.now() + 15 * 60 * 1000 // 15 minutos
    };
    localStorage.setItem("resetTokenData", JSON.stringify(resetData));

    mostrarToast(`Link de recuperação gerado! Redirecionando (simulação)...`, "success");
    setTimeout(() => {
        window.location.href = `redefinir-senha.html?token=${token}`;
    }, 2000);
});
