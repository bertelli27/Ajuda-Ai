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
├── 📁 backend/                # Back-end Node.js
│   └── 📁 src/
│       ├── 📁 config/         # Configurações do Banco de Dados (db.js)
│       ├── 📁 controllers/    # Lógica de Negócios (auth, chat, serviços)
│       ├── 📁 database/       # Scripts SQL (schema.sql para criação das tabelas)
│       ├── 📁 middlewares/    # Interceptadores (validação de JWT)
│       ├── 📁 routes/         # Definição dos endpoints da API
│       └──  utils/          # Ferramentas auxiliares (logger.js)
├── 📄 server.js               # Arquivo de inicialização do Servidor (Express)
├── 📄 api.js                  # Camada DTO e Fetch HTTP do Front-end
├── 📄 index.html / home.html  # Páginas de aterrissagem e autenticação
├── 📄 servicos.html           # Vitrine e busca de profissionais
├── 📄 pedidos.html            # Área de gerenciamento de serviços e Chat
└── 📄 style.css               # Estilos globais e componentes visuais
```

---

## 🔄 Fluxo de Uso da Plataforma

1. **Descoberta:** O cliente navega pelos profissionais ou utiliza a IA para classificar seu problema (ex: *"Minha torneira está vazando"* -> Sugestão: Categoria Manutenção).
2. **Solicitação:** O cliente descreve o escopo, endereço e data desejada e envia o pedido ao prestador.
3. **Negociação (Chat API):** O prestador recebe a notificação, abre o chat e envia um **Orçamento Oficial** no valor acordado (dados salvos via *Short Polling* para sincronia instantânea).
4. **Pagamento (Retenção):** O cliente aceita e realiza o pagamento simulado. A plataforma retém o valor de forma segura e notifica ambos no chat.
5. **Execução:** O serviço é marcado como "Em Andamento".
6. **Conclusão:** O prestador sinaliza o fim do serviço, o cliente aprova, o saldo líquido (menos taxas da plataforma) é creditado na carteira do prestador e a tela de Avaliações é liberada.

---

## ✅ Principais Funcionalidades

* **Autenticação Segura:** Cadastro, Login (com JWT) e Recuperação de Senha automatizada com disparo de e-mail real.
* **UI/UX Moderna:** Acessibilidade, Modal interativo de confirmação, Toast Notifications, Dark/Light Mode e Skeleton Loaders.
* **Dashboards (Cliente e Prestador):** Gráficos financeiros, exportação de extrato para PDF, resumo de atividades e vitrine de conquistas.
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
   * Abra o arquivo `api.js` e altere a constante `BASE_URL` para o endereço do seu backend local (`http://localhost:3000/api`).
   * Abra a página `index.html` e utilize a plataforma livremente.

### 💡 Dica para Testar o Chat em Tempo Real:
* Abra a aplicação em uma aba normal e faça login como Cliente.
   * Abra o mesmo endereço em uma **Aba Anônima (Incógnita)** e faça login como Prestador.
* Negocie o orçamento e converse. Ambas as abas refletirão as mensagens instantaneamente!

---

## 🎓 Integrantes do Grupo (Equipe de Desenvolvimento)

Este projeto está sendo desenvolvido pelos alunos:

* Pedro Augusto Friesen Hartmann
* Leonardo Buchman Coelho
* Wesley Felipe Siqueira
* Geovanni Santos Ribeiro Chaves
* Bruno Bertelli Rabelo
* Kauan Henrique Marques da Rosa

---

<p align="center">
  <b>Status:</b> 🚀 Deploy realizado com sucesso e arquitetura totalmente finalizada.
</p>
