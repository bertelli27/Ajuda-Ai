function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

document.getElementById("loginForm").addEventListener("submit", function(e){
    e.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const lembrar = document.getElementById("lembrarConta").checked;

    if(!usuario || !senha){
        alert("Preencha todos os campos!");
        return;
    }

    if(usuario.includes("@") && !validarEmail(usuario)){
        alert("E-mail inválido!");
        return;
    }

    // Redireciona para home.html após login simulado
    window.location.href = "home.html";
});

document.getElementById("esqueciSenha").addEventListener("click", function(){
    window.location.href = "forgot.html";
});

//-----------------

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function(e){
    e.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const lembrar = document.getElementById("lembrarConta").checked;

    if(!usuario || !senha){
        alert("Preencha todos os campos!");
        return;
    }

    if(usuario.includes("@") && !validarEmail(usuario)){
        alert("E-mail inválido!");
        return;
    }

    // Simulando login bem-sucedido
    // Salvando no localStorage apenas se marcar "lembrar"
    if(lembrar){
        localStorage.setItem("usuarioLogado", usuario);
    } else {
        sessionStorage.setItem("usuarioLogado", usuario);
    }

    // Redireciona para home
    window.location.href = "home.html";
});

// ESQUECI SENHA
document.getElementById("esqueciSenha").addEventListener("click", function(){
    window.location.href = "forgot.html";
});
