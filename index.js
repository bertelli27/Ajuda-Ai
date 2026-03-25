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

    if(!validarEmail(usuario)){
        alert("Por favor, insira um endereço de e-mail válido!");
        return;
    }

    // Valida se o usuário existe no LocalStorage e confere a senha
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioEncontrado = usuarios.find(u => u.email === usuario && u.senha === senha);

    if(!usuarioEncontrado){
        alert("E-mail ou senha incorretos!");
        return;
    }

    if(lembrar){
        localStorage.setItem("usuarioLogado", usuario);
    } else {
        sessionStorage.setItem("usuarioLogado", usuario);
    }

    // Redireciona para a home
    window.location.href = "home.html";
});

// ESQUECI SENHA
document.getElementById("esqueciSenha").addEventListener("click", function(){
    window.location.href = "forgot.html";
});
