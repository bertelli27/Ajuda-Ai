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

    mostrarToast(`E-mail de recuperação enviado para ${email} (simulado).`, "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
});
