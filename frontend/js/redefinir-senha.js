document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get("token");

    if (!tokenUrl) {
        mostrarToast("Link de recuperação inválido ou inexistente.", "error");
        setTimeout(() => {
            window.location.href = "forgot.html";
        }, 2000);
        return;
    }

    const form = document.getElementById("resetPasswordForm");
    const novaSenhaInput = document.getElementById("novaSenha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");

    // Oculta a barra de força antiga se ela ainda existir no HTML
    const oldContainer = document.getElementById("passwordStrengthContainer");
    if (oldContainer) oldContainer.style.display = 'none';

    // Injeta o novo Checklist dinamicamente se não existir
    if (!document.getElementById("passwordChecklist")) {
        const checklistHTML = `
            <div class="password-checklist" id="passwordChecklist" style="display: none; margin-bottom: 16px;">
                <div class="checklist-item" id="rule-length">❌ Mínimo de 8 caracteres</div>
                <div class="checklist-item" id="rule-upper">❌ Pelo menos uma letra maiúscula</div>
                <div class="checklist-item" id="rule-number">❌ Pelo menos um número</div>
                <div class="checklist-item" id="rule-special">❌ Pelo menos um caractere especial</div>
            </div>
        `;
        novaSenhaInput.closest('.form-group').insertAdjacentHTML('afterend', checklistHTML);
    }

    const passwordChecklist = document.getElementById("passwordChecklist");

    const validateNovaSenha = () => {
        const numInvalidos = document.querySelectorAll('.checklist-item:not(.valid)').length;
        if (numInvalidos > 0 || novaSenhaInput.value.trim() === '') {
            setInputError(novaSenhaInput, "A senha não cumpre todos os requisitos.");
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

    novaSenhaInput.addEventListener('blur', validateNovaSenha);
    confirmarSenhaInput.addEventListener('blur', validateConfirmarNovaSenha);
    confirmarSenhaInput.addEventListener('input', validateConfirmarNovaSenha);
    
    novaSenhaInput.addEventListener('input', (e) => {
        const pwd = e.target.value;
        
        if (pwd.length > 0) {
            passwordChecklist.style.display = 'flex';
        } else {
            passwordChecklist.style.display = 'none';
        }

        const rules = [
            { id: 'rule-length', regex: /.{8,}/ },
            { id: 'rule-upper', regex: /[A-Z]/ },
            { id: 'rule-number', regex: /[0-9]/ },
            { id: 'rule-special', regex: /[^A-Za-z0-9]/ }
        ];

        rules.forEach(rule => {
            const el = document.getElementById(rule.id);
            if (rule.regex.test(pwd)) {
                el.classList.add('valid');
                el.innerHTML = el.innerHTML.replace('❌', '✅');
            } else {
                el.classList.remove('valid');
                el.innerHTML = el.innerHTML.replace('✅', '❌');
            }
        });

        if (confirmarSenhaInput.value) validateConfirmarNovaSenha();
    });

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        const isNovaSenhaValid = validateNovaSenha();
        const isConfirmarSenhaValid = validateConfirmarNovaSenha();

        if (!isNovaSenhaValid || !isConfirmarSenhaValid) {
            mostrarToast("Por favor, garanta que a senha seja forte e as senhas coincidam.", "error");
            return;
        }
        
        const btnSubmit = document.querySelector('#resetPasswordForm button[type="submit"]');
        setButtonLoading(btnSubmit);

        try {
            await API.redefinirSenhaApi(tokenUrl, novaSenhaInput.value.trim());
            mostrarToast("Senha redefinida com sucesso!", "success");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
        } catch (error) {
            mostrarToast(error.message, "error");
            removeButtonLoading(btnSubmit);
        }
    });
});