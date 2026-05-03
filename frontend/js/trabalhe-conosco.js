document.addEventListener("DOMContentLoaded", function() {
    // Verifica se o usuário já está logado
    const emailLogado = (typeof API !== 'undefined') ? API.getSessaoAtual() : null;
    
    // Pega todos os botões da landing page que levavam para o Cadastro
    const botoesComecar = document.querySelectorAll("button[onclick*='register.html']");

    if (emailLogado && botoesComecar.length > 0) {
        botoesComecar.forEach(btn => {
            // Joga ele direto pra tela mágica de virar prestador
            btn.setAttribute('onclick', "window.location.href='perfil.html?action=become_provider'");
            if (btn.innerText.toLowerCase().includes('conta') || btn.innerText.toLowerCase().includes('começar')) {
                btn.innerText = "Tornar-se Profissional";
            }
        });
    }
});