// Array simulado de usuários
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

// Função para validar email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

// Máscara de CPF
document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
    value = value.replace(/(\d{3})(\d)/, '$1.$2'); 
    value = value.replace(/(\d{3})(\d)/, '$1.$2'); 
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// Máscara de Telefone (Fixo ou Celular Padrão BR)
document.getElementById('telefone').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca os parênteses do DDD
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');    // Coloca o hífen na parte correta
    e.target.value = value;
});

// Alternar campos de prestador
const radiosUsuario = document.getElementsByName("tipoUsuario");
radiosUsuario.forEach(radio => {
    radio.addEventListener("change", function() {
        const camposPrestador = document.getElementById("camposPrestador");
        if(this.value === "prestador"){
            camposPrestador.style.display = "block";
        } else {
            camposPrestador.style.display = "none";
        }
    });
});

// ================= VALIDAÇÕES COM FEEDBACK VISUAL =================
const registerForm = document.getElementById("registerForm");
const nomeInput = document.getElementById("nome");
const cpfInput = document.getElementById("cpf");
const emailInput = document.getElementById("email");
const telefoneInput = document.getElementById("telefone");
const cepInput = document.getElementById("cep");
const ruaInput = document.getElementById("rua");
const numeroInput = document.getElementById("numero");
const complementoInput = document.getElementById("complemento");
const bairroInput = document.getElementById("bairro");
const cidadeInput = document.getElementById("cidade");
const estadoInput = document.getElementById("estado");
const senhaInput = document.getElementById("senha");
const confirmSenhaInput = document.getElementById("confirmSenha");

const categoriaInput = document.getElementById("categoria");
const servicoInput = document.getElementById("servico");
const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const disponibilidadeInput = document.getElementById("disponibilidade");

const passwordStrengthContainer = document.getElementById("passwordStrengthContainer");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

const checkRequired = (input, message) => {
    if (!input || !input.value.trim()) {
        if (input) setInputError(input, message);
        return false;
    }
    clearInputError(input);
    return true;
};

const validateNome = () => checkRequired(nomeInput, "O nome é obrigatório.");
const validateCpf = () => {
    if (!validarCPF(cpfInput.value)) {
        setInputError(cpfInput, "CPF inválido.");
        return false;
    }
    clearInputError(cpfInput);
    return true;
};
const validateEmail = () => {
    if (!validarEmail(emailInput.value.trim())) {
        setInputError(emailInput, "E-mail inválido.");
        return false;
    }
    clearInputError(emailInput);
    return true;
};
const validateTelefone = () => checkRequired(telefoneInput, "O telefone é obrigatório.");
const validateCep = () => checkRequired(cepInput, "O CEP é obrigatório.");
const validateRua = () => checkRequired(ruaInput, "A rua é obrigatória.");
const validateNumero = () => checkRequired(numeroInput, "O número é obrigatório.");
const validateBairro = () => checkRequired(bairroInput, "O bairro é obrigatório.");
const validateCidade = () => checkRequired(cidadeInput, "A cidade é obrigatória.");
const validateEstado = () => checkRequired(estadoInput, "O estado é obrigatório.");

const validateSenha = () => {
    if (senhaInput.value.trim().length < 6) {
        setInputError(senhaInput, "A senha deve ter no mínimo 6 caracteres.");
        return false;
    }
    clearInputError(senhaInput);
    if (confirmSenhaInput.value) validateConfirmSenha();
    return true;
};
const validateConfirmSenha = () => {
    if (senhaInput.value !== confirmSenhaInput.value) {
        setInputError(confirmSenhaInput, "As senhas não coincidem.");
        return false;
    }
    if (!confirmSenhaInput.value.trim()) {
        setInputError(confirmSenhaInput, "Confirme sua senha.");
        return false;
    }
    clearInputError(confirmSenhaInput);
    return true;
};

const checkPasswordStrength = () => {
    const pwd = senhaInput.value;
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
        strengthBar.style.width = '33%';
        strengthBar.style.backgroundColor = '#d9534f'; // Vermelho (Fraca)
        strengthText.style.color = '#d9534f';
        strengthText.innerText = 'Força: Fraca';
    } else if (strength >= 3 && strength <= 4) {
        strengthBar.style.width = '66%';
        strengthBar.style.backgroundColor = '#f0ad4e'; // Laranja (Média)
        strengthText.style.color = '#f0ad4e';
        strengthText.innerText = 'Força: Média';
    } else {
        strengthBar.style.width = '100%';
        strengthBar.style.backgroundColor = '#5cb85c'; // Verde (Forte)
        strengthText.style.color = '#5cb85c';
        strengthText.innerText = 'Força: Forte';
    }
};

const validateCategoria = () => checkRequired(categoriaInput, "Selecione uma categoria.");
const validateServico = () => checkRequired(servicoInput, "O serviço é obrigatório.");
const validateDescricao = () => checkRequired(descricaoInput, "A descrição é obrigatória.");
const validateValor = () => checkRequired(valorInput, "O valor é obrigatório.");
const validateDisponibilidade = () => checkRequired(disponibilidadeInput, "A disponibilidade é obrigatória.");

// Eventos de validação em tempo real (onblur e oninput)
nomeInput?.addEventListener('blur', validateNome);
cpfInput?.addEventListener('blur', validateCpf);
emailInput?.addEventListener('blur', validateEmail);
telefoneInput?.addEventListener('blur', validateTelefone);
cepInput?.addEventListener('blur', validateCep);
ruaInput?.addEventListener('blur', validateRua);
numeroInput?.addEventListener('blur', validateNumero);
bairroInput?.addEventListener('blur', validateBairro);
cidadeInput?.addEventListener('blur', validateCidade);
estadoInput?.addEventListener('blur', validateEstado);
senhaInput?.addEventListener('blur', validateSenha);
confirmSenhaInput?.addEventListener('blur', validateConfirmSenha);
confirmSenhaInput?.addEventListener('input', validateConfirmSenha);
senhaInput?.addEventListener('input', () => { 
    if(confirmSenhaInput.value) validateConfirmSenha(); 
    checkPasswordStrength();
});

categoriaInput?.addEventListener('blur', validateCategoria);
categoriaInput?.addEventListener('change', validateCategoria);
servicoInput?.addEventListener('blur', validateServico);
descricaoInput?.addEventListener('blur', validateDescricao);
valorInput?.addEventListener('blur', validateValor);
disponibilidadeInput?.addEventListener('blur', validateDisponibilidade);

// Submissão do Formulário
registerForm?.addEventListener("submit", function(e){
    e.preventDefault();

    const basicValidations = [
        validateNome(), validateCpf(), validateEmail(), validateTelefone(), 
        validateCep(), validateRua(), validateNumero(), validateBairro(), 
        validateCidade(), validateEstado(), validateSenha(), validateConfirmSenha()
    ];
    
    let isValid = !basicValidations.includes(false);
    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;

    if (tipoUsuario === "prestador") {
        const prestadorValidations = [
            validateCategoria(), validateServico(), validateDescricao(), 
            validateValor(), validateDisponibilidade()
        ];
        if (prestadorValidations.includes(false)) isValid = false;
    }

    if (!isValid) {
        mostrarToast("Por favor, corrija os campos em vermelho.", "error");
        return;
    }

    const email = emailInput.value.trim();
    const usuarioExistente = usuarios.find(u => u.email === email);
    if(usuarioExistente){
        mostrarToast("Usuário já cadastrado com este e-mail!", "error");
        setInputError(emailInput, "Este e-mail já está em uso.");
        return;
    }

    const novoUsuario = { 
        nome: nomeInput.value.trim(), 
        cpf: cpfInput.value.trim(), 
        email: email, 
        telefone: telefoneInput.value.trim(), 
        endereco: { 
            cep: cepInput.value.trim(), 
            rua: ruaInput.value.trim(), 
            numero: numeroInput.value.trim(), 
            complemento: complementoInput.value.trim(), 
            bairro: bairroInput.value.trim(), 
            cidade: cidadeInput.value.trim(), 
            estado: estadoInput.value.trim() 
        },
        fotoPerfil: null, 
        senha: senhaInput.value.trim(), 
        tipo: tipoUsuario 
    };
    
    if (tipoUsuario === "prestador") {
        novoUsuario.prestador = { 
            categoria: categoriaInput.value, 
            servico: servicoInput.value.trim(), 
            descricao: descricaoInput.value.trim(), 
            valor: valorInput.value.trim(), 
            disponibilidade: disponibilidadeInput.value.trim() 
        };
    }

    usuarios.push(novoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    const lembrar = document.getElementById("lembrarContaRegister").checked;
    if(lembrar){
        localStorage.setItem("usuarioLogado", email);
    } else {
        sessionStorage.setItem("usuarioLogado", email);
    }

    mostrarToast("Cadastro realizado com sucesso!", "success");
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1500);
});
