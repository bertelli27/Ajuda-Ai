// =======================================================
// MODO CLARO / ESCURO (THEME TOGGLE)
// =======================================================
// Aplica o tema imediatamente para evitar que a tela pisque ao carregar
const temaAtual = localStorage.getItem('theme') || 'dark';
if (temaAtual === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

/**
 * Exibe uma notificação flutuante (toast) na tela.
 * @param {string} mensagem O texto a ser exibido.
 * @param {string} [tipo='success'] O tipo de toast ('success' ou 'error') para estilização.
 */
function mostrarToast(mensagem, tipo = 'success') {
    // Cria o container de toasts se ele ainda não existir no DOM
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Cria o elemento do toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`; // Adiciona a classe de tipo (success/error)
    toast.innerText = mensagem;

    // Adiciona o toast ao container
    container.appendChild(toast);

    // Define um temporizador para remover o toast após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        // Remove o elemento do DOM após a animação de saída
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =======================================================
// SISTEMA DE NOTIFICAÇÕES (Bolinha vermelha no menu)
// =======================================================
function atualizarBadgeNotificacao() {
    const emailLogado = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
    if (!emailLogado) return;

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    if (!usuarioAtual) return;

    const solicitacoes = JSON.parse(localStorage.getItem("solicitacoes")) || [];
    const mensagens = JSON.parse(localStorage.getItem("mensagens")) || [];

    let numNotificacoes = 0;

    // 1. Pedidos pendentes (para prestador)
    if (usuarioAtual.tipo === 'prestador') {
        const pendentes = solicitacoes.filter(s => s.prestadorEmail === emailLogado && s.status === 'PENDENTE').length;
        numNotificacoes += pendentes;
    }

    // 2. Mensagens não lidas (para qualquer usuário logado)
    const meusPedidosIds = solicitacoes.filter(s => s.clienteEmail === emailLogado || s.prestadorEmail === emailLogado).map(s => s.id);
    const mensagensNaoLidas = mensagens.filter(m => meusPedidosIds.includes(m.id_solicitacao) && m.remetenteEmail !== emailLogado && m.lida !== true).length;
    numNotificacoes += mensagensNaoLidas;

    // Procurar o link de "Meus Pedidos" em todas as páginas para renderizar o badge
    const links = document.querySelectorAll('a[href="pedidos.html"]');
    links.forEach(link => {
        const existingBadge = link.querySelector('.notificacao-badge');
        if (existingBadge) existingBadge.remove(); // Limpa o badge antigo, se houver

        if (numNotificacoes > 0) {
            link.style.position = 'relative'; // Necessário para posicionar a bolinha de forma correta
            const badge = document.createElement('span');
            badge.className = 'notificacao-badge';
            badge.innerText = numNotificacoes;
            link.appendChild(badge);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => { setTimeout(atualizarBadgeNotificacao, 200); }); // Delay seguro para garantir que os menus carregaram

// =======================================================
// MODO CLARO / ESCURO (THEME TOGGLE FLOATING)
// =======================================================
function inicializarThemeToggle() {
    if (document.getElementById('floatingThemeToggle')) return;

    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'floatingThemeToggle';
    toggleContainer.className = 'theme-toggle-floating';

    const btnLight = document.createElement('button');
    btnLight.className = 'theme-btn';
    btnLight.innerHTML = '☀️';
    btnLight.title = 'Modo Claro';

    const btnDark = document.createElement('button');
    btnDark.className = 'theme-btn';
    btnDark.innerHTML = '🌙';
    btnDark.title = 'Modo Escuro';

    toggleContainer.appendChild(btnLight);
    toggleContainer.appendChild(btnDark);
    document.body.appendChild(toggleContainer);

    function atualizarBotoes() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            btnLight.classList.add('active');
            btnDark.classList.remove('active');
        } else {
            btnDark.classList.add('active');
            btnLight.classList.remove('active');
        }
    }

    btnLight.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        atualizarBotoes();
    });

    btnDark.addEventListener('click', () => {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
        atualizarBotoes();
    });

    atualizarBotoes();
}

document.addEventListener("DOMContentLoaded", inicializarThemeToggle);