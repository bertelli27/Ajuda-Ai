document.addEventListener("DOMContentLoaded", function() {
    // Verifica se o usuário já está logado
    const emailLogado = API.getSessaoAtual();
    const btnComecar = document.querySelector("button[onclick=\"window.location.href='register.html'\"]");

    if (emailLogado && btnComecar) {
        // Se o usuário está logado, ele não deve se cadastrar de novo.
        // Vamos levá-lo para a página de perfil para ele adicionar os dados de prestador.
        btnComecar.setAttribute('onclick', "window.location.href='perfil.html?action=become_provider'");
    }
});