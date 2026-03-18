function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

document.getElementById("forgotForm").addEventListener("submit", function(e){
    e.preventDefault();
    const email = document.getElementById("emailForgot").value.trim();

    if(!email){
        alert("Digite seu e-mail!");
        return;
    }

    if(!validarEmail(email)){
        alert("E-mail inválido!");
        return;
    }

    alert(`E-mail de recuperação enviado para ${email} (simulado).`);
    window.location.href = "index.html";
});
