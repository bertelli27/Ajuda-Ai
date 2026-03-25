document.addEventListener("DOMContentLoaded", function() {
    // ================= VALIDAÇÃO DE USUÁRIO LOGADO =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    
    if (!emailLogado) {
        alert("Você precisa fazer login para solicitar um serviço!");
        window.location.href = "index.html";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const clienteAtual = usuarios.find(u => u.email === emailLogado);

    // ================= PEGAR PRESTADOR DA URL =================
    const params = new URLSearchParams(window.location.search);
    const prestadorEmail = params.get("prestador");

    if (!prestadorEmail) {
        alert("Prestador não encontrado.");
        window.location.href = "servicos.html";
        return;
    }

    const prestador = usuarios.find(u => u.email === prestadorEmail && u.tipo === "prestador");

    if (!prestador) {
        alert("Este usuário não é um prestador válido.");
        window.location.href = "servicos.html";
        return;
    }

    // ================= EXIBIR DADOS =================
    const infoDiv = document.getElementById("infoPrestador");
    infoDiv.innerHTML = `
        <h3 style="color: #00ADB5; margin-bottom: 5px;">${prestador.prestador.servico}</h3>
        <p style="margin-bottom: 5px;"><strong>Profissional:</strong> ${prestador.nome}</p>
        <p style="margin-bottom: 5px;"><strong>Valor Médio:</strong> R$${parseFloat(prestador.prestador.valor || 0).toFixed(2).replace('.', ',')}</p>
        <p><strong>Disponibilidade:</strong> ${prestador.prestador.disponibilidade}</p>
    `;

    // Preenche o endereço do cliente como sugestão inicial
    if (clienteAtual && clienteAtual.endereco) {
        const end = clienteAtual.endereco;
        const enderecoFormatado = `${end.rua}, ${end.numero} ${end.complemento ? '- ' + end.complemento : ''} - ${end.bairro}, ${end.cidade} - ${end.estado}`;
        document.getElementById("enderecoLocal").value = enderecoFormatado;
    }

    // ================= SALVAR SOLICITAÇÃO =================
    document.getElementById("formSolicitacao").addEventListener("submit", function(e) {
        e.preventDefault();

        const descricao = document.getElementById("descricaoProblema").value.trim();
        const data = document.getElementById("dataDesejada").value;
        const endereco = document.getElementById("enderecoLocal").value.trim();

        const novaSolicitacao = {
            id: "SOL-" + Date.now(), // Gera um ID único simulado
            clienteEmail: clienteAtual.email,
            prestadorEmail: prestador.email,
            servico: prestador.prestador.servico,
            descricao: descricao,
            dataSelecionada: data,
            enderecoRealizacao: endereco,
            status: "PENDENTE", // Exatamente como na sua documentação de BD
            dataSolicitacao: new Date().toISOString()
        };

        // Salva na "Tabela" de solicitações no LocalStorage
        const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
        solicitacoes.push(novaSolicitacao);
        localStorage.setItem("solicitacoes", JSON.stringify(solicitacoes));

        alert("Solicitação enviada com sucesso! O prestador entrará em contato.");
        window.location.href = "home.html";
    });

    // Logout Header
    document.getElementById("btnLogout")?.addEventListener("click", function() {
        // Use a lógica padrão de logout
    });
});