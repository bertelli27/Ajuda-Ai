<h1 align="center">🛠️ AjudaAí</h1>
<p align="center">
  <i>A plataforma ideal para conectar clientes a prestadores de serviços de forma rápida, segura e eficiente.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Conclu%C3%ADdo_|_Deploy_Online-brightgreen?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Tipo-Projeto_Acadêmico_(TCC)-blue?style=flat-square" alt="TCC" />
  <img src="https://img.shields.io/badge/Back--end-Node.js-339933?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Banco_de_Dados-MySQL-4479A1?style=flat-square&logo=mysql" alt="MySQL" />
  <a href="https://ajuda-ai-one.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-Acessar_Plataforma-00ADB5?style=flat-square&logo=vercel" alt="Live Demo" /></a>
</p>

<hr>

## 📖 Sobre o Projeto

O **AjudaAí** é uma plataforma web desenvolvida como **Trabalho de Conclusão de Curso (TCC)**. Atuando como um intermediador digital moderno, o sistema visa solucionar a dificuldade de encontrar mão de obra qualificada para serviços cotidianos (limpeza, manutenção, TI, reformas, etc.), proporcionando ao mesmo tempo uma vitrine digital profissional para prestadores autônomos.

O grande diferencial da plataforma é o seu fluxo centralizado: desde a busca (com auxílio de inteligência artificial simples) até a negociação de orçamentos e chat com envio de imagens em tempo real.

**🔗 Acesse a plataforma online:** [ajuda-ai-one.vercel.app](https://ajuda-ai-one.vercel.app)

## 🎯 Objetivos

### Objetivo Geral
Desenvolver uma plataforma web responsiva, segura e escalável que conecte demandantes e ofertantes de serviços gerais, gerenciando o ciclo de vida da prestação do serviço.

### Objetivos Específicos
- 🔒 Garantir um ecossistema seguro de autenticação para dois tipos de perfil: Cliente e Prestador.
- 🔍 Facilitar a busca de serviços através de filtros e de um assistente de categorias inteligente.
- 💬 Prover um canal de comunicação (Chat) persistente e em tempo real para negociações e envio de anexos.
- 📊 Oferecer painéis de controle (Dashboards) para acompanhamento de serviços, estatísticas financeiras e avaliações.
- ⭐ Implementar um sistema de reputação para garantir a confiabilidade na plataforma.

---

## 💻 Arquitetura e Tecnologias

O projeto foi concebido com uma arquitetura **desacoplada (API RESTful)** e implantado 100% em nuvem (*Cloud Computing*), permitindo altíssima disponibilidade e escalabilidade.

### 🎨 Front-end
- **HTML5 & CSS3 Vanilla:** Design responsivo, estilização *from scratch* e suporte nativo a **Dark/Light Mode**.
- **JavaScript ES6+:** Consumo assíncrono (Fetch API), *Short Polling* para notificações em tempo real e processamento de imagens (Canvas/Base64).
- **Bibliotecas Auxiliares:** `Chart.js` (Gráficos) e `jsPDF` (Exportação de relatórios financeiros).

### ⚙️ Back-end / API (Hospedado no Render)
- **Node.js & Express:** Roteamento REST, controle de payload e Middlewares.
- **Segurança:** Autenticação via **JWT** (JSON Web Tokens) e criptografia de senhas com **Bcrypt**.
- **E-mails:** Envio de e-mails reais para recuperação de senha utilizando **Nodemailer** (via SMTP Gmail).

### 🗄️ Banco de Dados (Hospedado no TiDB Serverless)
- **MySQL (TiDB):** Banco de dados relacional em nuvem com conexão segura via **SSL/TLS**. 
- Utilização de chaves estrangeiras (Foreign Keys), `ON DELETE CASCADE`, validações (`CHECK`) e armazenamento de imagens diretamente via `LONGTEXT` (Base64).

---

## 📂 Estrutura Principal do Projeto

```text
📁 AjudaAi/
├── 📁 backend/                # Back-end Node.js (API Express)
│   └── 📁 src/
│       ├── 📁 config/         # Configurações do Banco de Dados (db.js)
│       ├── 📁 controllers/    # Lógica de Negócios (auth, chat, serviços)
│       ├── 📁 database/       # Scripts SQL (schema.sql para criação das tabelas)
│       ├── 📁 middlewares/    # Interceptadores (validação de JWT)
│       ├── 📁 routes/         # Definição dos endpoints da API
│       └── 📁 utils/          # Ferramentas auxiliares (logger.js)
├── 📁 frontend/               # Front-end estático (HTML, CSS, JS puro)
│   ├── 📁 pages/              # Páginas HTML (ex.: index.html, login.html)
│   ├── 📁 js/                 # Scripts (api.js, utils.js, páginas *.js)
│   ├── 📁 css/                # style.css (estilos globais)
│   └── 📁 img/                # Imagens estáticas (logo, avatar padrão, etc.)
├── 📄 server.js               # Entrada da API na raiz (Express — apenas /api)
├── 📄 package.json            # Dependências do projeto (raiz)
└── 📄 README.md
```

**Nota:** O `server.js` na raiz expõe somente a API REST. O front-end não é servido por esse arquivo; para desenvolvimento local, abra os HTML em `frontend/pages/` com um servidor estático ou diretamente no navegador (respeitando os caminhos relativos `../css`, `../js`, `../img`).

---

## 🔄 Fluxo de Uso da Plataforma

1. **Descoberta:** O cliente navega pelos profissionais ou utiliza a IA para classificar seu problema (ex: *"Minha torneira está vazando"* -> Sugestão: Categoria Manutenção).
2. **Solicitação:** O cliente descreve o escopo, endereço e data desejada e envia o pedido ao prestador.
3. **Negociação Forçada (Chat API):** Substituindo o antigo "Aceite Cego", o prestador agora é obrigado a interagir no chat e enviar um **Orçamento Oficial (Contrato de Escopo)**, garantindo alinhamento antes de fechar o serviço.
4. **Aprovação e Pagamento (Retenção):** O poder de aceite é transferido ao cliente, que aprova o orçamento e realiza o pagamento simulado. A plataforma retém o valor de forma segura e notifica ambos.
5. **Execução:** O serviço é marcado como "Em Andamento".
6. **Conclusão:** O prestador sinaliza o fim do serviço, o cliente aprova, o saldo líquido (menos taxas da plataforma) é creditado na carteira do prestador e a tela de Avaliações é liberada.

---

## ✅ Principais Funcionalidades

* **Onboarding Premium (Cadastro Multi-step):**
  * Assistente de cadastro dinâmico em 4 etapas (Wizard).
  * Validação *Inline* via API (verifica duplicidade de CPF e E-mail em tempo real).
  * Gamificação de Segurança (Checklist interativo de senha com Regex).
  * **Compliance LGPD:** Consentimento explícito e isolado via modais para Termos de Uso e Política de Privacidade.
* **Inteligência de Negócios (BI Avançado):**
  * **Smart Insights:** Algoritmo que atua como consultor automatizado, lendo o Funil de Vendas do prestador e sugerindo ações estratégicas de melhoria.
  * Métricas exclusivas: Funil de Conversão (Eficácia), Ticket Médio, Receita por Categoria e ranking de Clientes Fidelizados.
  * Exportação de Relatório Gerencial em PDF com estruturação robusta via `jsPDF-AutoTable`.
* **Autenticação Segura:** Login (com JWT) e Recuperação de Senha automatizada com disparo de e-mail real.
* **UI/UX Moderna:** Acessibilidade, Modal interativo de confirmação, Toast Notifications, Dark/Light Mode e Skeleton Loaders.
* **Listagem e Busca:** Filtros dinâmicos de categorias e barra de pesquisa textual inteligente.
* **Perfil Duplo:** Um cliente pode se "Tornar Prestador" de forma nativa e sem necessidade de recadastro.
* **Gestão de Perfil e Portfólio:** Edição de dados e upload de imagens *Drag & Drop* (compactação via Canvas API antes do Base64).
* **Sistema de Chat Completo:**
  * Mensagens em formato de texto e imagem (Base64 salva via `LONGTEXT`).
  * Atualização em tempo real nativa (*Short Polling*).
  * Mensagens automáticas do sistema para avisos financeiros.
  * Notificações (Bolinha de badge dinâmica em ícones e abas).
* **Fluxo Financeiro:** Simulação de pagamento, controle de status (Retido, Liberado, Cancelado) e cálculo de taxas operacionais.
* **Sistema de Avaliação:** Notas (1 a 5 estrelas), comentários e exibição da média na vitrine pública do perfil.
* **Auditoria e Logs:** Tabela `logs_usuario` que rastreia ações vitais de uso no back-end.

---

## 🧪 Guia para Execução Local (Desenvolvimento)

Caso um avaliador ou desenvolvedor deseje rodar a aplicação localmente em seu próprio computador, siga os passos:

1. **Banco de Dados:**
   * Utilize um servidor MySQL local (XAMPP/WAMP) ou em nuvem.
   * Execute o script localizado em `/backend/src/database/schema.sql` para gerar todas as tabelas perfeitamente tipadas.

2. **Back-end:**
   * Navegue até a pasta `/backend` no terminal.
   * Execute `npm install` para instalar as dependências.
   * Crie um arquivo `.env` com suas credenciais de banco e JWT (use o formato indicado em código).
   * Execute `npm run dev` para iniciar a API.

3. **Front-end:**
   * Abra o arquivo `frontend/js/api.js` e altere a constante `BASE_URL` para o endereço do seu backend local (ex.: `http://localhost:3000/api`).
   * Abra a página `frontend/pages/index.html` no navegador (recomenda-se usar a extensão *Live Server* ou `npx serve frontend` na raiz do repositório para evitar bloqueios de CORS/recursos em alguns navegadores).

### 💡 Dica para Testar o Chat em Tempo Real:
* Abra a aplicação em uma aba normal e faça login como Cliente.
   * Abra o mesmo endereço em uma **Aba Anônima (Incógnita)** e faça login como Prestador.
* Negocie o orçamento e converse. Ambas as abas refletirão as mensagens instantaneamente!

---

## 🎓 Integrantes do Grupo (Equipe de Desenvolvimento)

Este projeto está sendo desenvolvido pelos alunos:

* Bruno Bertelli Rabelo
* Geovanni Santos Ribeiro Chaves
* Kauan Henrique Marques da Rosa
* Leonardo Buchman Coelho
* Pedro Augusto Friesen Hartmann
* Wesley Felipe Siqueira

---

<p align="center">
  <b>Status:</b> 🚀 Deploy realizado com sucesso e arquitetura totalmente finalizada.
</p>
