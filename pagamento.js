document.addEventListener("DOMContentLoaded", function() {
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) {
        window.location.href = "index.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get("pedido");
    const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
    const pedido = solicitacoes.find(s => s.id === pedidoId);

    if (!pedido || pedido.clienteEmail !== emailLogado || pedido.status !== 'PENDENTE') {
        mostrarToast("Pedido inválido para pagamento.", "error");
        setTimeout(() => { window.location.href = "pedidos.html"; }, 1500);
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    const valorFloat = parseFloat(pedido.valorCombinado);
    
    const infoDiv = document.getElementById("infoPedidoPagamento");
    infoDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: #EEEEEE; margin:0;">${pedido.servico}</h3>
            <strong style="color: #00ADB5; font-size: 20px;">R$ ${valorFloat.toFixed(2).replace('.', ',')}</strong>
        </div>
    `;

    document.getElementById("formPagamento").addEventListener("submit", function(e) {
        e.preventDefault();
        
        const method = document.querySelector('input[name="paymentMethod"]:checked').value;
        let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

        // Registra a transação de saída (Simulação de cobrança no Cartão/Pix)
        transacoes.push({
            id: 'TX-' + Date.now(),
            userEmail: emailLogado,
            tipo: 'SAIDA',
            descricao: `Pagamento via ${method === 'cartao' ? 'Cartão' : 'Pix'} (Retido) - ${pedido.servico}`,
            valor: valorFloat,
            data: new Date().toISOString()
        });
        localStorage.setItem("transacoes", JSON.stringify(transacoes));

        // Atualiza o pedido
        pedido.status = 'ACEITO';
        pedido.valorStatus = 'ACEITO';
        pedido.statusPagamento = 'RETIDO';
        
        const index = solicitacoes.findIndex(s => s.id === pedido.id);
        solicitacoes[index] = pedido;
        localStorage.setItem("solicitacoes", JSON.stringify(solicitacoes));

        // Envia mensagem no chat avisando a retenção
        const todasMensagens = JSON.parse(localStorage.getItem("mensagens")) || [];
        todasMensagens.push({ id_mensagem: "MSG-" + Date.now(), id_solicitacao: pedido.id, remetenteEmail: "SISTEMA", mensagem: `✅ <strong>Orçamento Aceito e Pagamento Realizado.</strong> O valor (R$ ${valorFloat.toFixed(2).replace('.', ',')}) está retido na plataforma de forma segura. O serviço já pode ser iniciado.`, data_envio: new Date().toISOString(), lida: false });
        localStorage.setItem("mensagens", JSON.stringify(todasMensagens));

        mostrarToast("Pagamento confirmado com sucesso!", "success");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 1500);
    });
});