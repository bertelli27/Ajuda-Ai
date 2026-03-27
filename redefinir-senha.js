document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get("token");
    const resetData = JSON.parse(localStorage.getItem("resetTokenData"));

    // Validações de segurança e integridade do token
    if (!tokenUrl || !resetData || tokenUrl !== resetData.token) {
        mostrarToast("Link de recuperação inválido ou inexistente.", "error");
        setTimeout(() => {
            window.location.href = "forgot.html";
        }, 2000);
        return;
    }

    // Validar expiração (15 minutos)
    if (Date.now() > resetData.expires) {
        localStorage.removeItem("resetTokenData");
        mostrarToast("O link de recuperação expirou. Solicite um novo.", "error");
        setTimeout(() => {
            window.location.href = "forgot.html";
        }, 2000);
        return;
    }

    document.getElementById("resetPasswordForm").addEventListener("submit", function(e) {
        e.preventDefault();

        const novaSenha = document.getElementById("novaSenha").value.trim();
        const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

        if (novaSenha !== confirmarSenha) {
            mostrarToast("As senhas não coincidem!", "error");
            return;
        }

        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const userIndex = usuarios.findIndex(u => u.email === resetData.email);

        if (userIndex === -1) {
            mostrarToast("Erro ao localizar o usuário do token.", "error");
            return;
        }

        usuarios[userIndex].senha = novaSenha;
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        localStorage.removeItem("resetTokenData"); // Limpa o token por segurança (uso único)

        mostrarToast("Senha redefinida com sucesso!", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    });
});