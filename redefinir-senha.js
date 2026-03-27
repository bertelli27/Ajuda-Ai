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

    const form = document.getElementById("resetPasswordForm");
    const novaSenhaInput = document.getElementById("novaSenha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");

    const passwordStrengthContainer = document.getElementById("passwordStrengthContainer");
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");

    const validateNovaSenha = () => {
        if (novaSenhaInput.value.trim().length < 6) {
            setInputError(novaSenhaInput, "A senha deve ter no mínimo 6 caracteres.");
            return false;
        }
        clearInputError(novaSenhaInput);
        if (confirmarSenhaInput.value) validateConfirmarNovaSenha();
        return true;
    };

    const validateConfirmarNovaSenha = () => {
        if (novaSenhaInput.value.trim() !== confirmarSenhaInput.value.trim()) {
            setInputError(confirmarSenhaInput, "As senhas não coincidem.");
            return false;
        }
        if (confirmarSenhaInput.value.trim() === '') {
            setInputError(confirmarSenhaInput, "A confirmação de senha é obrigatória.");
            return false;
        }
        clearInputError(confirmarSenhaInput);
        return true;
    };

    const checkPasswordStrength = () => {
        const pwd = novaSenhaInput.value;
        if (pwd.length === 0) {
            if(passwordStrengthContainer) passwordStrengthContainer.style.display = 'none';
            return;
        }
        if(passwordStrengthContainer) passwordStrengthContainer.style.display = 'flex';

        let strength = 0;
        if (pwd.length >= 6) strength += 1;
        if (pwd.length >= 8) strength += 1;
        if (/[A-Z]/.test(pwd)) strength += 1;
        if (/[a-z]/.test(pwd)) strength += 1;
        if (/[0-9]/.test(pwd)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;

        if (strength <= 2) {
            if(strengthBar) { strengthBar.style.width = '33%'; strengthBar.style.backgroundColor = '#d9534f'; }
            if(strengthText) { strengthText.style.color = '#d9534f'; strengthText.innerText = 'Força: Fraca'; }
        } else if (strength >= 3 && strength <= 4) {
            if(strengthBar) { strengthBar.style.width = '66%'; strengthBar.style.backgroundColor = '#f0ad4e'; }
            if(strengthText) { strengthText.style.color = '#f0ad4e'; strengthText.innerText = 'Força: Média'; }
        } else {
            if(strengthBar) { strengthBar.style.width = '100%'; strengthBar.style.backgroundColor = '#5cb85c'; }
            if(strengthText) { strengthText.style.color = '#5cb85c'; strengthText.innerText = 'Força: Forte'; }
        }
    };

    novaSenhaInput.addEventListener('blur', validateNovaSenha);
    confirmarSenhaInput.addEventListener('blur', validateConfirmarNovaSenha);
    confirmarSenhaInput.addEventListener('input', validateConfirmarNovaSenha);
    novaSenhaInput.addEventListener('input', () => {
        if (confirmarSenhaInput.value) validateConfirmarNovaSenha();
        checkPasswordStrength();
    });

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const isNovaSenhaValid = validateNovaSenha();
        const isConfirmarSenhaValid = validateConfirmarNovaSenha();

        if (!isNovaSenhaValid || !isConfirmarSenhaValid) {
            mostrarToast("Por favor, corrija os campos em vermelho.", "error");
            return;
        }

        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const userIndex = usuarios.findIndex(u => u.email === resetData.email);

        if (userIndex === -1) {
            mostrarToast("Erro ao localizar o usuário do token.", "error");
            return;
        }

        usuarios[userIndex].senha = novaSenhaInput.value.trim();
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        localStorage.removeItem("resetTokenData"); // Limpa o token por segurança (uso único)

        mostrarToast("Senha redefinida com sucesso!", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    });
});