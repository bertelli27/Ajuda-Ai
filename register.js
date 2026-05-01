document.addEventListener("DOMContentLoaded", function() {

    // ================= MÁSCARAS E INTEGRAÇÕES =================
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const cepInput = document.getElementById('cep');
    const valorInput = document.getElementById('valor');

    if(cepInput) aplicarMascaraCEP(cepInput);
    if(valorInput) aplicarMascaraDinheiro(valorInput);

    cpfInput?.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, ''); 
        value = value.replace(/(\d{3})(\d)/, '$1.$2'); 
        value = value.replace(/(\d{3})(\d)/, '$1.$2'); 
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });

    telefoneInput?.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, ''); 
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); 
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');    
        e.target.value = value;
    });

    cepInput?.addEventListener('blur', async function() {
        const cep = this.value.replace(/\D/g, '');
        if (cep.length === 8) {
            document.getElementById("rua").value = 'Buscando...';
            document.getElementById("bairro").value = 'Buscando...';
            document.getElementById("cidade").value = 'Buscando...';
            document.getElementById("estado").value = '...';
            
            const dadosEndereco = await buscarCEP(cep);
            
            if (dadosEndereco) {
                document.getElementById("rua").value = dadosEndereco.logradouro;
                document.getElementById("bairro").value = dadosEndereco.bairro;
                document.getElementById("cidade").value = dadosEndereco.localidade;
                document.getElementById("estado").value = dadosEndereco.uf;
                clearInputError(document.getElementById("rua"));
                document.getElementById("numero").focus();
            } else {
                mostrarToast("CEP não encontrado.", "error");
                document.getElementById("rua").value = ''; 
                document.getElementById("bairro").value = ''; 
                document.getElementById("cidade").value = ''; 
                document.getElementById("estado").value = '';
            }
        }
    });

    // ================= LÓGICA DO WIZARD (MULTI-STEP) =================
    let passoAtual = 1;
    const totalPassos = 4;
    
    const btnProximo = document.getElementById("btnProximo");
    const btnVoltar = document.getElementById("btnVoltar");
    const btnFinalizar = document.getElementById("btnFinalizar");

    function atualizarVisorWizard() {
        // Esconde todos os passos e mostra só o atual
        for (let i = 1; i <= totalPassos; i++) {
            const stepDiv = document.getElementById(`step-${i}`);
            if (stepDiv) {
                stepDiv.classList.remove('active');
                if (i === passoAtual) stepDiv.classList.add('active');
            }
            
            // Atualiza bolinhas (dots)
            const dot = document.getElementById(`dot${i}`);
            if (dot) {
                if (i <= passoAtual) dot.classList.add('active');
                else dot.classList.remove('active');
            }
        }

        // Atualiza Barra de Progresso Verde
        document.getElementById('wizardProgressFill').style.width = `${(passoAtual / totalPassos) * 100}%`;

        // Controle de Botões (Voltar/Próximo/Finalizar)
        btnVoltar.style.display = passoAtual === 1 ? 'none' : 'block';
        
        if (passoAtual === totalPassos) {
            btnProximo.style.display = 'none';
            btnFinalizar.style.display = 'block';
            // Alarga o botão voltar para manter o design bonito
            btnVoltar.style.flex = "0 0 30%";
        } else {
            btnProximo.style.display = 'block';
            btnFinalizar.style.display = 'none';
            btnVoltar.style.flex = "none";
            
            // Muda o texto do "Próximo" para dar previsibilidade
            if (passoAtual === 1) btnProximo.innerText = "Avançar para Endereço";
            else if (passoAtual === 2) {
                const ehPrestador = document.querySelector('input[name="tipoUsuario"]:checked').value === 'prestador';
                btnProximo.innerText = ehPrestador ? "Avançar para Perfil Profissional" : "Avançar para Segurança";
            }
            else if (passoAtual === 3) btnProximo.innerText = "Avançar para Segurança";
        }
    }

    // ================= VALIDAÇÕES POR ETAPA =================
    function validarPasso1() {
        let valido = true;
        const nome = document.getElementById('nome');
        const cpf = document.getElementById('cpf');
        const telefone = document.getElementById('telefone');
        const email = document.getElementById('email');
        
        if (!nome.value.trim()) { setInputError(nome, "O nome é obrigatório."); valido = false; } else { clearInputError(nome); }
        if (cpf.value.replace(/\D/g, '').length !== 11) { setInputError(cpf, "CPF inválido."); valido = false; } else { clearInputError(cpf); }
        if (telefone.value.replace(/\D/g, '').length < 10) { setInputError(telefone, "Telefone inválido."); valido = false; } else { clearInputError(telefone); }
        
        const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!reEmail.test(email.value.trim())) { setInputError(email, "E-mail inválido."); valido = false; } else { clearInputError(email); }
        
        return valido;
    }
    function validarPasso2() {
        let valido = true;
        const cep = document.getElementById('cep');
        const numero = document.getElementById('numero');
        
        if (cep.value.replace(/\D/g, '').length !== 8) { setInputError(cep, "CEP obrigatório."); valido = false; } else { clearInputError(cep); }
        if (!numero.value.trim()) { setInputError(numero, "Número obrigatório."); valido = false; } else { clearInputError(numero); }
        
        return valido;
    }

    function validarPasso3() {
        let valido = true;
        const categoria = document.getElementById('categoria');
        const servico = document.getElementById('servico');
        
        if (!categoria.value) { setInputError(categoria, "Selecione uma categoria."); valido = false; } else { clearInputError(categoria); }
        if (!servico.value.trim()) { setInputError(servico, "O serviço é obrigatório."); valido = false; } else { clearInputError(servico); }
        
        return valido;
    }

    function validarPasso4() {
        const confirmSenha = document.getElementById('confirmSenha');
        const senha = document.getElementById('senha');
        let valido = document.querySelectorAll('.checklist-item:not(.valid)').length === 0;
        
        if (!valido) {
            setInputError(senha, "A senha não cumpre todos os requisitos.");
        } else if (senha.value !== confirmSenha.value) {
            clearInputError(senha);
            setInputError(confirmSenha, "As senhas não coincidem.");
            valido = false;
        } else {
            clearInputError(senha);
            clearInputError(confirmSenha);
        }
        
        return valido;
    }

    // ================= GAMIFICAÇÃO DA SENHA (REGEX) =================
    document.getElementById('senha').addEventListener('input', function(e) {
        const pwd = e.target.value;
        
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
    });

    // ================= EVENTOS DOS BOTÕES =================
    btnProximo.addEventListener('click', () => {
        if (passoAtual === 1 && !validarPasso1()) { mostrarToast("Preencha os campos obrigatórios.", "error"); return; }
        if (passoAtual === 2 && !validarPasso2()) { mostrarToast("Preencha os campos obrigatórios.", "error"); return; }
        if (passoAtual === 3 && !validarPasso3()) { mostrarToast("Preencha os dados profissionais.", "error"); return; }

        const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;
        
        // Magia do Pulo: Se for Cliente, pula do Passo 2 direto para o Passo 4 (Segurança)
        if (passoAtual === 2 && tipoUsuario === 'cliente') {
            passoAtual = 4;
        } else {
            passoAtual++;
        }
        
        atualizarVisorWizard();
    });

    btnVoltar.addEventListener('click', () => {
        const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;
        
        // Magia do Pulo Reverso
        if (passoAtual === 4 && tipoUsuario === 'cliente') {
            passoAtual = 2;
        } else {
            passoAtual--;
        }
        
        atualizarVisorWizard();
    });

    // ================= SUBMIT FINAL (COM LGPD) =================
    document.getElementById("registerForm").addEventListener("submit", async function(e) {
        e.preventDefault();

        if (!validarPasso4()) {
            mostrarToast("Por favor, garanta que a senha seja forte e as senhas coincidam.", "error");
            return;
        }

        // ⚖️ TRAVA DA LGPD E TERMOS
        if (!document.getElementById("aceiteLGPD").checked) {
            mostrarToast("Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.", "error");
            document.querySelector('.lgpd-consent-box').style.borderColor = "#d9534f";
            return;
        }

        setButtonLoading(btnFinalizar);
        const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;

        const dadosBack = {
            nome: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            senha: document.getElementById('senha').value.trim(),
            telefone: document.getElementById('telefone').value.trim(),
            tipo: tipoUsuario,
            descricao_perfil: tipoUsuario === 'prestador' ? document.getElementById('descricao').value.trim() : null,
            categoria: tipoUsuario === 'prestador' ? document.getElementById('categoria').value : null,
            titulo_servico: tipoUsuario === 'prestador' ? document.getElementById('servico').value.trim() : null,
            preco_base: tipoUsuario === 'prestador' ? limparMascaraDinheiro(document.getElementById('valor').value.trim()) : null,
            cpf: document.getElementById('cpf').value.trim(),
            cep: document.getElementById('cep').value.trim(),
            rua: document.getElementById('rua').value.trim(),
            numero: document.getElementById('numero').value.trim(),
            complemento: document.getElementById('complemento').value.trim(),
            bairro: document.getElementById('bairro').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            estado: document.getElementById('estado').value.trim()
        };

        try {
            await API.cadastrar(dadosBack);
            mostrarToast("Conta criada com sucesso! Faça o login.", "success");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
        } catch (error) {
            mostrarToast(error.message, "error");
            removeButtonLoading(btnFinalizar);
        }
    });

    // Inicializa o Wizard na tela certa
    atualizarVisorWizard();
});
