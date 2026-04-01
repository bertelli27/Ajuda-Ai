document.addEventListener("DOMContentLoaded", async function() {
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) {
        window.location.href = "index.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get("pedido");
    const solicitacoes = await API.getSolicitacoes();
    const pedido = solicitacoes.find(s => s.id == pedidoId);

    if (!pedido || pedido.clienteEmail !== emailLogado || pedido.status !== 'PENDENTE') {
        mostrarToast("Pedido inválido para pagamento.", "error");
        setTimeout(() => { window.location.href = "pedidos.html"; }, 1500);
        return;
    }

    const usuarios = await API.getUsuarios();
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
        const submitButton = e.submitter;
        setButtonLoading(submitButton);

        // Atualiza o pedido
        pedido.status = 'ACEITO';
        pedido.valorStatus = 'ACEITO';
        pedido.statusPagamento = 'RETIDO';

        // 🚀 Salva o status de Pago/Retido no Banco de Dados Real!
        // A API agora cria a transação automaticamente quando o statusPagamento é 'RETIDO'
        API.atualizarSolicitacao(pedido.id, pedido).catch(console.error);

        // Envia mensagem no chat avisando a retenção
        const msgPagamento = `✅ <strong>Orçamento Aceito e Pagamento Realizado.</strong> O valor (R$ ${valorFloat.toFixed(2).replace('.', ',')}) está retido na plataforma de forma segura. O serviço já pode ser iniciado.`;
        API.enviarMensagemSistemaApi(pedido.id, msgPagamento).catch(console.error);

        // Simula o processamento do pagamento
        setTimeout(() => {
            mostrarToast("Pagamento confirmado com sucesso!", "success");
            setTimeout(() => {
                window.location.href = "pedidos.html";
            }, 1500);
        }, 1000);
    });
});