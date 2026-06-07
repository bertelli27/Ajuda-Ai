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

async function atualizarBadgeNotificacao() {
    // Agora usamos a API para garantir que pegamos do MySQL (100% seguro)
    if (typeof API === 'undefined') return;
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) return;
    
    let numNotificacoes = 0;

    try {
        numNotificacoes = await API.getNotificacoes();
    } catch (e) { return; /* fail silently para não piscar erros */ }

    // Se o número de notificações aumentou, dispara uma notificação real no sistema operacional!
    if (numNotificacoes > lastNotificationCount) {
        if (Notification.permission === "granted") {
            new Notification("AjudaAí", {
                body: "Você tem novas mensagens ou atualizações de serviço!",
                icon: "../img/logo.png"
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
// MODO DEUS (ADMIN GLOBAL BANNER)
// =======================================================
async function inicializarModoDeus() {
    if (typeof API === 'undefined') return;
    const emailLogado = API.getSessaoAtual();
    if (!emailLogado) return;
    
    try {
        const usuarios = await API.getUsuarios();
        const user = usuarios.find(u => u.email === emailLogado);
        if (user && user.tipo === 'admin') {
            if (!document.getElementById("adminGlobalBanner")) {
                const banner = document.createElement('div');
                banner.id = "adminGlobalBanner";
                banner.className = "admin-global-banner fade-up-animation";
                banner.innerHTML = "👑 Modo Administrador Ativo - Suas ações são definitivas e auditadas";
                document.body.appendChild(banner);
                document.body.style.paddingTop = "35px"; // Abre espaço para a barra
            }
        }
    } catch (e) {}
}

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
    btnLight.setAttribute('data-tooltip', 'Modo Claro');
    btnLight.setAttribute('data-tooltip-dir', 'left');

    const btnDark = document.createElement('button');
    btnDark.className = 'theme-btn';
    btnDark.innerHTML = '🌙';
    btnDark.setAttribute('data-tooltip', 'Modo Escuro');
    btnDark.setAttribute('data-tooltip-dir', 'left');

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
    // 1. Remove botões antigos (Limpeza)
    document.querySelectorAll("#backToTopBtn, .back-to-top-btn").forEach(btn => btn.remove());

    // 2. BURLANDO O CACHE: Injetando o CSS blindado diretamente pelo JS
    if (!document.getElementById("back-to-top-styles")) {
        const style = document.createElement("style");
        style.id = "back-to-top-styles";
        style.innerHTML = `
            .back-to-top-btn {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                background-color: #00ADB5 !important;
                color: #222A31 !important;
                border: none !important;
                border-radius: 50% !important;
                width: 50px !important;
                height: 50px !important;
                font-size: 24px !important;
                display: none !important; /* Só aparece quando o JS mandar */
                justify-content: center !important;
                align-items: center !important;
                cursor: pointer !important;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
                z-index: 999999 !important; /* Prioridade máxima para ficar por cima de tudo */
                transition: transform 0.3s ease, background-color 0.3s ease !important;
            }
            .back-to-top-btn.show {
                display: flex !important;
                animation: slideUpFade 0.3s ease-out forwards !important;
            }
            .back-to-top-btn:hover {
                background-color: #00CED1 !important;
                transform: translateY(-2px) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 3. Cria o botão dinâmico
    const backToTopBtn = document.createElement("button");
    backToTopBtn.id = "backToTopBtn";
    backToTopBtn.className = "back-to-top-btn";
    backToTopBtn.setAttribute("data-tooltip", "Voltar ao Topo");
    backToTopBtn.setAttribute("data-tooltip-dir", "left");
    backToTopBtn.innerHTML = "&#9650;";
    document.body.appendChild(backToTopBtn);

    // 4. Lógica para mostrar/esconder (Verifica no Load e no Scroll)
    const checkScroll = () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    };

    window.addEventListener("scroll", checkScroll);
    checkScroll(); // Verifica o scroll imediatamente ao carregar a página

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
// MOSTRAR/OCULTAR SENHA
// =======================================================
function setupPasswordToggle(inputElement) {
    if (!inputElement || inputElement.dataset.toggleSetup) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'password-wrapper';
    
    // Move o input para dentro do wrapper
    inputElement.parentNode.insertBefore(wrapper, inputElement);
    wrapper.appendChild(inputElement);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Mostrar/Ocultar senha');
    toggleBtn.setAttribute('data-tooltip', 'Ocultar/Mostrar');
    toggleBtn.setAttribute('data-tooltip-dir', 'left');

    const eyeOpenIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    toggleBtn.innerHTML = eyeClosedIcon;
    wrapper.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => {
        const isPassword = inputElement.type === 'password';
        inputElement.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = isPassword ? eyeOpenIcon : eyeClosedIcon;
    });

    inputElement.dataset.toggleSetup = 'true';
}

function inicializarAllPasswordToggles() {
    // Aplica a funcionalidade a todos os inputs de senha da página
    document.querySelectorAll('input[type="password"]').forEach(setupPasswordToggle);
}

// =======================================================
// SPINNER DE LOADING PARA BOTÕES
// =======================================================

/**
 * Ativa o estado de loading de um botão, desabilitando-o e mostrando um spinner.
 * @param {HTMLElement} buttonElement O elemento do botão.
 */
function setButtonLoading(buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.add('btn-loading');
    buttonElement.disabled = true;
}

/**
 * Remove o estado de loading de um botão, reativando-o.
 * @param {HTMLElement} buttonElement O elemento do botão.
 */
function removeButtonLoading(buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.remove('btn-loading');
    buttonElement.disabled = false;
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

// =======================================================
// COMPRESSÃO DE IMAGENS (FRONT-END)
// =======================================================
/**
 * Comprime uma imagem usando Canvas API antes de salvar em Base64
 * @param {File} file O arquivo de imagem original
 * @param {number} maxWidth Largura máxima permitida (padrão: 800)
 * @param {number} maxHeight Altura máxima permitida (padrão: 800)
 * @param {number} quality Qualidade do JPEG (0.0 a 1.0)
 * @returns {Promise<string>} Promessa com a string Base64 da imagem comprimida
 */
function comprimirImagem(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// =======================================================
// LIGHTBOX (VISUALIZADOR DE IMAGENS)
// =======================================================
let lightboxGallery = [];
let lightboxCurrentIndex = 0;

function showLightboxImage(index) {
    if (index < 0 || index >= lightboxGallery.length) return;
    const imgElement = document.getElementById('lightbox-img');
    const infoPanel = document.getElementById('lightbox-info');
    if (!imgElement) return;

    // Adiciona um efeito de fade para a transição da imagem
    imgElement.style.opacity = '0';
    if (infoPanel) infoPanel.style.opacity = '0';
    
    setTimeout(() => {
        const imgData = lightboxGallery[index];
        imgElement.src = typeof imgData === 'string' ? imgData : imgData.src;
        
        if (infoPanel && typeof imgData === 'object' && (imgData.verificado || imgData.descricao)) {
            let html = '';
            if (imgData.verificado) {
                html += `<div class="lightbox-badge">✅ Projeto Verificado</div>`;
                if (imgData.nota) {
                    const nota = parseInt(imgData.nota, 10);
                    html += `<div class="lightbox-rating">${'★'.repeat(nota)}${'☆'.repeat(5 - nota)}</div>`;
                }
                if (imgData.comentario) html += `<div class="lightbox-comment">"${imgData.comentario}"</div>`;
            }
            if (imgData.descricao) {
                html += `<div class="lightbox-desc">${imgData.descricao}</div>`;
            }
            infoPanel.innerHTML = html;
            infoPanel.style.display = 'block';
        } else if (infoPanel) {
            infoPanel.style.display = 'none';
        }

        imgElement.style.opacity = '1';
        if (infoPanel) infoPanel.style.opacity = '1';
        lightboxCurrentIndex = index;
    }, 150);
}

function changeLightboxImage(direction) {
    const newIndex = lightboxCurrentIndex + direction;
    if (newIndex >= lightboxGallery.length) {
        showLightboxImage(0); // Volta para o início
    } else if (newIndex < 0) {
        showLightboxImage(lightboxGallery.length - 1); // Volta para o final
    } else {
        showLightboxImage(newIndex);
    }
}

function abrirLightbox(clickedImgElement) {
    let overlay = document.getElementById('lightbox-overlay');
    
    // Cria o lightbox no DOM se for a primeira vez que é chamado
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lightbox-overlay';
        overlay.className = 'lightbox-overlay';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'lightbox-close';
        closeBtn.innerHTML = '&times;';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'lightbox-nav lightbox-prev';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.setAttribute('aria-label', 'Imagem anterior');

        const nextBtn = document.createElement('button');
        nextBtn.className = 'lightbox-nav lightbox-next';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.setAttribute('aria-label', 'Próxima imagem');

        const img = document.createElement('img');
        img.className = 'lightbox-content';
        img.id = 'lightbox-img';
        img.style.transition = 'opacity 0.2s ease-in-out';
        
        const infoPanel = document.createElement('div');
        infoPanel.id = 'lightbox-info';
        infoPanel.className = 'lightbox-info-panel';
        infoPanel.style.transition = 'opacity 0.2s ease-in-out';

        overlay.appendChild(closeBtn);
        overlay.appendChild(prevBtn);
        overlay.appendChild(nextBtn);
        overlay.appendChild(img);
        overlay.appendChild(infoPanel);
        document.body.appendChild(overlay);
        
        const fecharLightbox = () => { overlay.style.display = 'none'; img.src = ''; lightboxGallery = []; };

        closeBtn.addEventListener('click', fecharLightbox);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharLightbox(); });
        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); changeLightboxImage(-1); });
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); changeLightboxImage(1); });

        document.addEventListener('keydown', (e) => { 
            if (overlay.style.display !== 'flex') return;
            if (e.key === 'Escape') fecharLightbox();
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'ArrowRight') changeLightboxImage(1);
        });
    }
    
    const galleryContainer = clickedImgElement.closest('.portfolio-gallery, #modalListaPortfolio, .chat-messages');
    
    if (galleryContainer) {
        lightboxGallery = Array.from(galleryContainer.querySelectorAll('img')).map(img => ({
            src: img.src,
            verificado: img.dataset.verificado === "true",
            nota: img.dataset.nota || "",
            comentario: img.dataset.comentario || "",
            descricao: img.dataset.descricao || ""
        }));
    } else {
        lightboxGallery = [{
            src: clickedImgElement.src,
            verificado: clickedImgElement.dataset.verificado === "true",
            nota: clickedImgElement.dataset.nota || "",
            comentario: clickedImgElement.dataset.comentario || "",
            descricao: clickedImgElement.dataset.descricao || ""
        }];
    }

    const navButtons = overlay.querySelectorAll('.lightbox-nav');
    navButtons.forEach(btn => btn.style.display = lightboxGallery.length > 1 ? 'flex' : 'none');

    const startIndex = lightboxGallery.findIndex(imgData => imgData.src === clickedImgElement.src);
    showLightboxImage(startIndex >= 0 ? startIndex : 0);
    overlay.style.display = 'flex';
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(atualizarBadgeNotificacao, 200);
    setInterval(atualizarBadgeNotificacao, 3000); // Verifica notificações a cada 3 segundos
    inicializarThemeToggle();
    inicializarBackToTopButton(); // Chama a nova função
    inicializarAnimacoesFade(); // Chama as animações fluídas
    inicializarAccordion(); // Inicia o FAQ Expansível
    inicializarAllPasswordToggles(); // Inicia o botão de mostrar/ocultar senha
    inicializarModoDeus(); // Inicia o banner global do Admin
});

// =======================================================
// MOTOR DE EXPORTAÇÃO CSV GLOBAL (RELATÓRIOS E AUDITORIA)
// =======================================================
window.exportarDadosParaCSV = function(dados, nomeDoArquivo) {
    if (!dados || dados.length === 0) {
        mostrarToast("Não há dados para exportar.", "error");
        return;
    }

    // 1. Extrair os Cabeçalhos (Headers) da primeira linha
    const colunas = Object.keys(dados[0]);
    const cabecalho = colunas.map(col => `"${col.toUpperCase()}"`).join(';');

    // 2. Extrair e Formatar as Linhas de Dados
    const linhas = dados.map(registro => {
        return colunas.map(coluna => {
            let valor = registro[coluna];
            
            if (valor === null || valor === undefined) valor = '';
            
            if (typeof valor === 'string') {
                valor = valor.replace(/"/g, '""'); // Escapa para o Excel não quebrar as colunas
            }
            
            return `"${valor}"`;
        }).join(';');
    });

    // 3. Montar o texto final e baixar via Blob
    const conteudoCSV = [cabecalho, ...linhas].join('\n');
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const linkInvisivel = document.createElement("a");
    linkInvisivel.href = url;
    linkInvisivel.download = nomeDoArquivo;
    linkInvisivel.style.display = 'none';
    document.body.appendChild(linkInvisivel);
    linkInvisivel.click();
    document.body.removeChild(linkInvisivel);
    URL.revokeObjectURL(url);
};