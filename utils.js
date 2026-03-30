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

/**
 * Define um estado de erro em um campo de formulário, mostrando uma mensagem.
 * @param {HTMLElement} inputElement O elemento input a ser marcado com erro.
 * @param {string} message A mensagem de erro a ser exibida.
 */
function setInputError(inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    if (!formGroup) return;

    // Remove a mensagem de erro antiga, se houver, para evitar duplicatas
    const oldError = formGroup.querySelector('.error-message');
    if (oldError) oldError.remove();

    inputElement.classList.add('input-error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerText = message;
    
    // Insere a mensagem de erro logo após o input
    inputElement.insertAdjacentElement('afterend', errorElement);
}

/**
 * Limpa o estado de erro de um campo de formulário.
 * @param {HTMLElement} inputElement O elemento input a ser limpo.
 */
function clearInputError(inputElement) {
    const formGroup = inputElement.closest('.form-group');
    if (!formGroup) return;

    inputElement.classList.remove('input-error');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) errorElement.remove();
}

// =======================================================
// SISTEMA DE NOTIFICAÇÕES (Bolinha vermelha no menu)
// =======================================================

let lastNotificationCount = 0; // Guarda o último número de notificações

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

    // Se o número de notificações aumentou, dispara uma notificação real no sistema operacional!
    if (numNotificacoes > lastNotificationCount) {
        if (Notification.permission === "granted") {
            new Notification("AjudaAí", {
                body: "Você tem novas mensagens ou atualizações de serviço!",
                icon: "img/logo.png"
            });
        }
    }
    
    lastNotificationCount = numNotificacoes;

    // Procurar o link de "Meus Pedidos" em todas as páginas para renderizar o badge
    const links = document.querySelectorAll('a[href="pedidos.html"]');
    links.forEach(link => {
        const existingBadge = link.querySelector('.notificacao-badge');

        if (numNotificacoes > 0) {
            if (existingBadge) {
                // Atualiza o texto apenas se o número mudar, evitando que a animação pisque
                if (existingBadge.innerText !== numNotificacoes.toString()) {
                    existingBadge.innerText = numNotificacoes;
                }
            } else {
                link.style.position = 'relative'; // Necessário para posicionar a bolinha de forma correta
                const badge = document.createElement('span');
                badge.className = 'notificacao-badge';
                badge.innerText = numNotificacoes;
                link.appendChild(badge);
            }
        } else if (existingBadge) {
            existingBadge.remove(); // Remove a bolinha se as notificações zerarem
        }
    });
}

document.addEventListener("DOMContentLoaded", () => { 
    setTimeout(atualizarBadgeNotificacao, 200); 
    // Pede permissão para o usuário exibir notificações reais ao carregar a página
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}); // Delay seguro para garantir que os menus carregaram

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

// =======================================================
// VOLTAR AO TOPO (BACK TO TOP BUTTON)
// =======================================================
function inicializarBackToTopButton() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (!backToTopBtn) return;

    // Mostra/esconde o botão ao rolar a página
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) { // Mostra o botão após rolar 300px
            backToTopBtn.style.display = "flex";
        } else {
            backToTopBtn.style.display = "none";
        }
    });

    // Rola para o topo ao clicar no botão
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth" // Rolagem suave
        });
    });
}

// =======================================================
// ANIMAÇÕES DE FADE-IN (SCROLL) E MICRO-INTERAÇÕES
// =======================================================
function inicializarAnimacoesFade() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('fade-up-animation');
                
                // Remove as classes de animação após ela terminar para não bugar o :hover nativo dos cards
                el.addEventListener('animationend', function handler() {
                    el.classList.remove('fade-waiting', 'fade-up-animation');
                    el.removeEventListener('animationend', handler);
                });
                
                obs.unobserve(el); // Anima apenas a primeira vez que aparece
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

    // Classes principais que receberão o efeito de surgir suavemente
    const seletores = ['.login-card', '.home-section', '.dashboard-card', '.service-card', '.pedido-card', '.activity-card', '.achievement-card', '.pop-category-card', '.step-card', '.testimonial-card'];
    
    function observarNovosElementos() {
        seletores.forEach(seletor => {
            document.querySelectorAll(seletor).forEach(el => {
                if (!el.classList.contains('fade-waiting') && !el.classList.contains('fade-up-animation') && !el.hasAttribute('data-animado')) {
                    el.classList.add('fade-waiting');
                    el.setAttribute('data-animado', 'true'); // Marca para não processar de novo
                    observer.observe(el);
                }
            });
        });
    }

    observarNovosElementos();

    // Usamos o MutationObserver para capturar cards de serviços/pedidos que carregam depois (via API/LocalStorage)
    const mutationObserver = new MutationObserver(() => observarNovosElementos());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// =======================================================
// ACCORDION (FAQ)
// =======================================================
function inicializarAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            const content = item.querySelector('.accordion-content');
            
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });
}

// =======================================================
// MÁSCARAS E VALIDAÇÕES GLOBAIS (A11Y & UX)
// =======================================================

// Máscara para Dinheiro (R$ 0,00)
function aplicarMascaraDinheiro(input) {
    if (!input) return;
    input.type = 'text'; // Altera para texto para aceitar vírgulas
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value === '') { e.target.value = ''; return; }
        value = (parseInt(value, 10) / 100).toFixed(2) + '';
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = "R$ " + value;
    });
}

// Converte o valor mascarado (R$ 1.500,00) de volta para número do Banco de Dados (1500.00)
function limparMascaraDinheiro(valorFormatado) {
    if (!valorFormatado) return "0.00";
    return valorFormatado.replace(/[^\d,]/g, '').replace(',', '.');
}

// Formata um número do Banco de Dados (1500.00) para mostrar na tela (R$ 1.500,00)
function formatarMoedaParaMascara(valorReal) {
    if (!valorReal) return "";
    const numero = parseFloat(valorReal);
    if (isNaN(numero)) return "";
    let formatado = numero.toFixed(2).replace(".", ",");
    formatado = formatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return "R$ " + formatado;
}

// Máscara de CEP (00000-000)
function aplicarMascaraCEP(input) {
    if (!input) return;
    input.maxLength = 9;
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

// Consulta automática de CEP via API pública do ViaCEP
async function buscarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    if (cep.length !== 8) return null;
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        return data.erro ? null : data;
    } catch (error) { return null; }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(atualizarBadgeNotificacao, 200);
    setInterval(atualizarBadgeNotificacao, 3000); // Verifica notificações a cada 3 segundos
    inicializarThemeToggle();
    inicializarBackToTopButton(); // Chama a nova função
    inicializarAnimacoesFade(); // Chama as animações fluídas
    inicializarAccordion(); // Inicia o FAQ Expansível
});