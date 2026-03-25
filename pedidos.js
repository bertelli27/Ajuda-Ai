document.addEventListener("DOMContentLoaded", function() {
    // ================= VALIDAÇÃO E CARREGAMENTO DE DADOS =================
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) {
        alert("Você precisa fazer login para ver seus pedidos!");
        window.location.href = "index.html";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);

    if (!usuarioAtual) {
        alert("Usuário não encontrado. Faça login novamente.");
        logout();
        return;
    }

    const container = document.getElementById("pedidos-container");
    const titulo = document.getElementById("titulo-pedidos");

    // ================= LÓGICA DE EXIBIÇÃO (CLIENTE vs PRESTADOR) =================
    function carregarPedidos() {
        if (usuarioAtual.tipo === 'cliente') {
            titulo.innerText = "Meus Pedidos Realizados";
            const meusPedidos = solicitacoes.filter(s => s.clienteEmail === usuarioAtual.email).reverse();
            renderPedidosCliente(meusPedidos);
        } else if (usuarioAtual.tipo === 'prestador') {
            titulo.innerText = "Solicitações Recebidas";
            const pedidosParaMim = solicitacoes.filter(s => s.prestadorEmail === usuarioAtual.email).reverse();
            renderPedidosPrestador(pedidosParaMim);
        }
    }

    function renderPedidosCliente(pedidos) {
        if (pedidos.length === 0) {
            container.innerHTML = '<p class="aviso-sem-pedidos">Você ainda não fez nenhuma solicitação.</p>';
            return;
        }
        container.innerHTML = pedidos.map(pedido => {
            const prestador = usuarios.find(u => u.email === pedido.prestadorEmail);
            return `
                <div class="pedido-card">
                    <h3>${pedido.servico}</h3>
                    <p><strong>Prestador:</strong> ${prestador ? prestador.nome : 'Não encontrado'}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p><strong>Status:</strong> <span class="status status-${pedido.status.toLowerCase()}">${pedido.status}</span></p>
                    ${pedido.status === 'CONCLUIDO' ? `<button class="btn-avaliar" data-pedido-id="${pedido.id}">Avaliar Serviço</button>` : ''}
                </div>
            `;
        }).join('');
    }

    function renderPedidosPrestador(pedidos) {
        if (pedidos.length === 0) {
            container.innerHTML = '<p class="aviso-sem-pedidos">Você ainda não recebeu nenhuma solicitação.</p>';
            return;
        }
        container.innerHTML = pedidos.map(pedido => {
            const cliente = usuarios.find(u => u.email === pedido.clienteEmail);
            return `
                <div class="pedido-card">
                    <h3>Solicitação de ${cliente ? cliente.nome.split(' ')[0] : 'Cliente'}</h3>
                    <p><strong>Serviço:</strong> ${pedido.servico}</p>
                    <p><strong>Descrição:</strong> ${pedido.descricao}</p>
                    <p><strong>Endereço:</strong> ${pedido.enderecoRealizacao}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataSelecionada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p><strong>Status:</strong> <span class="status status-${pedido.status.toLowerCase()}">${pedido.status}</span></p>
                    <div class="botoes-acao">
                        ${pedido.status === 'PENDENTE' ? `
                            <button class="btn-acao aceitar" data-pedido-id="${pedido.id}">Aceitar</button>
                            <button class="btn-acao recusar" data-pedido-id="${pedido.id}">Recusar</button>
                        ` : ''}
                        ${pedido.status === 'ACEITO' ? `
                            <button class="btn-acao concluir" data-pedido-id="${pedido.id}">Marcar como Concluído</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ================= LÓGICA DAS AÇÕES =================
    container.addEventListener('click', function(e) {
        const target = e.target;
        const pedidoId = target.getAttribute('data-pedido-id');
        if (!pedidoId) return;

        let novoStatus = '';
        if (target.classList.contains('aceitar')) novoStatus = 'ACEITO';
        else if (target.classList.contains('recusar')) novoStatus = 'CANCELADO';
        else if (target.classList.contains('concluir')) novoStatus = 'CONCLUIDO';
        
        if (novoStatus) {
            const index = solicitacoes.findIndex(s => s.id === pedidoId);
            if (index !== -1) {
                solicitacoes[index].status = novoStatus;
                localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
                carregarPedidos(); // Recarrega a lista para refletir a mudança
            }
        } else if (target.classList.contains('btn-avaliar')) {
            alert(`Próximo passo: criar a tela de avaliação para o pedido ${pedidoId}`);
            // window.location.href = `avaliar.html?pedido=${pedidoId}`;
        }
    });

    // ================= LOGOUT =================
    function logout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "index.html";
    }
    document.getElementById("btnLogout")?.addEventListener("click", logout);

    // Inicia a renderização
    carregarPedidos();
});