<h1 align="center">🛠️ AjudaAí</h1>
<p align="center">
  <i>A plataforma ideal para conectar clientes a prestadores de serviços de forma rápida, segura e eficiente.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Tipo-Projeto_Acadêmico_(TCC)-blue?style=flat-square" alt="TCC" />
  <img src="https://img.shields.io/badge/Back--end-Node.js-339933?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Banco_de_Dados-MySQL-4479A1?style=flat-square&logo=mysql" alt="MySQL" />
</p>

<hr>

## 📖 Sobre o Projeto

O **AjudaAí** é uma solução tecnológica web desenvolvida como **Trabalho de Conclusão de Curso (TCC)**. Atuando como um intermediador digital moderno, o sistema visa solucionar a dificuldade de encontrar mão de obra qualificada e de confiança para serviços cotidianos (como limpeza, manutenção, TI, reformas, etc.), além de proporcionar uma vitrine digital profissional para prestadores autônomos.

O grande diferencial da plataforma é o seu fluxo centralizado: desde a busca (com auxílio de inteligência artificial simples) até a negociação de orçamentos e chat com envio de imagens em tempo real.

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

O projeto foi concebido seguindo o padrão de separação de responsabilidades (API RESTful), permitindo que o Front-end e o Back-end operem de forma independente.

### 🎨 Front-end
- **HTML5 & CSS3:** Estruturação semântica e estilização completa *from scratch* (sem frameworks de UI pesados), com suporte a **Dark/Light Mode**.
- **JavaScript (Vanilla):** Controle de DOM, consumo assíncrono da API (Fetch) e lógicas de UX.
- **Bibliotecas Auxiliares:** `Chart.js` (Evolução Financeira) e `jsPDF` (Exportação de relatórios).

### ⚙️ Back-end (API)
- **Node.js & Express.js:** Criação das rotas RESTful, middlewares de segurança e controle de payload (até 10MB para imagens).
- **CORS:** Liberação controlada para integração com o cliente web.

### 🗄️ Banco de Dados
- **MySQL:** Banco de dados relacional que garante integridade referencial nas tabelas de usuários, serviços, solicitações, transações e mensagens. O driver `mysql2/promise` é utilizado no Node para queries assíncronas de alta performance.

---

## 📂 Estrutura Principal do Projeto

```text
📁 AjudaAi/
├── 📁 backend/                # Motor da aplicação (API REST)
│   └── 📁 src/
│       ├── 📁 config/         # Configurações do Banco de Dados (db.js)
│       ├── 📁 controllers/    # Lógica de Negócios (auth, chat, solicitações)
│       ├── 📁 database/       # Scripts SQL (schema.sql para criação das tabelas)
│       ├── 📁 middlewares/    # Interceptadores (validação de JWT)
│       ├── 📁 routes/         # Definição dos endpoints da API
│       └── 📄 server.js       # Arquivo de entrada do Node.js
├── 📄 api.js                  # Camada DTO e Fetch API do Front-end (A Ponte)
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
5. **Execução:** O serviço entra em andamento e é realizado fisicamente.
6. **Conclusão:** O prestador sinaliza o fim do serviço, o cliente aprova, o saldo líquido (menos taxas da plataforma) é creditado na carteira do prestador e a tela de Avaliações é liberada.

---

## ✅ Funcionalidades Atuais Implementadas

* **Autenticação:** Login, Cadastro e proteção de rotas (Sessões).
* **Interface:** Responsividade completa, Dark/Light Mode adaptativo e micro-interações.
* **Dashboard Pessoal:** Gráficos interativos (Chart.js), resumo numérico e métricas separadas por tipo de perfil (Cliente vs Profissional).
* **Listagem e Busca:** Filtros dinâmicos de categorias e barra de pesquisa textual inteligente.
* **Gestão de Perfil:** Atualização de dados pessoais, foto de perfil, portfólio de imagens e cadastro de serviços oferecidos.
* **Integração Front-end & Back-end (API Própria):**
  * Criação, visualização e atualização de Pedidos e Serviços diretamente no MySQL.
  * Envio e recebimento de Orçamentos dinâmicos.
* **Sistema de Chat Completo:**
  * Mensagens em formato de texto e imagem (Base64 salva via `LONGTEXT`).
  * Atualização automática em tela (*Short Polling* integrado).
  * Mensagens automáticas do sistema para avisos financeiros.

## 🚧 Próximas Fases do TCC

* **Fase 7 (Financeiro):** Conexão das rotas de transações e atualização real do extrato e saldos de usuários na API.
* **Fase 8 (Avaliações):** Persistência do sistema de *rating* de 1 a 5 estrelas atrelados aos usuários no banco de dados, compondo a média pública.
* **Fase 9 (Polimento e Deploy):** Remoção de dados mockados residuais, auditoria de segurança (JWTs) e hospedagem em nuvem (ex: Vercel/Render).

---

## 🧪 Guia Rápido para Testes e Desenvolvimento

Para executar a aplicação e testar todas as funcionalidades desenvolvidas:

1. **Banco de Dados:**
   * Inicie seu servidor MySQL (ex: XAMPP).
   * Crie o banco `ajuda_ai_db`.
   * Execute o script localizado em `/backend/src/database/schema.sql` para gerar todas as tabelas perfeitamente tipadas.

2. **Back-end:**
   * Navegue até a pasta raiz no terminal.
   * Verifique a string de conexão no `db.js`.
   * Execute `node backend/src/server.js` (O servidor iniciará na porta 3000).

3. **Testando o Chat (Dica de Avaliação):**
   * Abra o Front-end (`index.html`) em uma janela normal do navegador e faça login como Cliente.
   * Abra o mesmo endereço em uma **Aba Anônima (Incógnita)** e faça login como Prestador.
   * Solicite um serviço na janela normal e aceite na anônima. O chat atualizará sozinho nas duas abas!

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
  <b>Status Atual:</b> 🚧 Integrando a Fase 7 de Desenvolvimento Back-end (Financeiro).
  <br>
  <i>Nota: Este é um projeto de caráter estritamente acadêmico para avaliação de Trabalhos de Conclusão de Curso. Novas camadas de regras de negócios estão sendo adicionadas periodicamente.</i>
</p>
