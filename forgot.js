function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

document.getElementById("forgotForm").addEventListener("submit", function(e){
    e.preventDefault();
    const email = document.getElementById("emailForgot").value.trim();

    if(!email){
        mostrarToast("Digite seu e-mail!", "error");
        return;
    }

    if(!validarEmail(email)){
        mostrarToast("E-mail inválido!", "error");
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioExistente = usuarios.find(u => u.email === email);

    if (!usuarioExistente) {
        mostrarToast("E-mail não encontrado no sistema.", "error");
        return;
    }

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
