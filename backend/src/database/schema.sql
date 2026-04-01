-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS AJUDAAÍ
-- Este arquivo contém a estrutura oficial das tabelas do sistema.

-- 1. TABELA DE USUÁRIOS (Clientes e Prestadores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14),
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    foto_perfil LONGTEXT, -- Usando LONGTEXT para suportar a imagem em Base64
    cep VARCHAR(10),
    rua VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    tipo ENUM('cliente', 'prestador') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PRESTADORES (Detalhes extras se o usuário for profissional)
CREATE TABLE IF NOT EXISTS prestadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    descricao_perfil TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- Popula as categorias iniciais do sistema
INSERT IGNORE INTO categorias (nome) VALUES 
('Limpeza'), ('Manutenção'), ('Reformas'), ('Tecnologia'), ('Saúde e Beleza'), ('Outros');

-- 4. TABELA DE SERVIÇOS (A vitrine do prestador)
CREATE TABLE IF NOT EXISTS servicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prestador_id INT NOT NULL,
    categoria_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    preco_base DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- 5. TABELA DE PORTFÓLIO (Fotos dos trabalhos do prestador)
CREATE TABLE IF NOT EXISTS portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prestador_id INT NOT NULL,
    imagem_url LONGTEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE
);

-- 6. TABELA DE SOLICITAÇÕES (O coração do sistema)
CREATE TABLE IF NOT EXISTS solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servico_id INT NOT NULL,
    cliente_id INT NOT NULL,
    descricao_problema TEXT NOT NULL,
    data_desejada DATE NOT NULL,
    endereco_realizacao VARCHAR(255) NOT NULL,
    status ENUM('PENDENTE', 'ACEITO', 'AGUARDANDO_CONFIRMACAO', 'CONCLUIDO', 'CANCELADO') DEFAULT 'PENDENTE',
    status_pagamento ENUM('PENDENTE', 'RETIDO', 'LIBERADO', 'ESTORNADO') DEFAULT 'PENDENTE',
    valor_combinado DECIMAL(10,2),
    valor_status ENUM('INICIAL', 'PROPOSTO', 'ACEITO') DEFAULT 'INICIAL',
    descricao_proposta TEXT,
    data_proposta DATE,
    hora_proposta TIME,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 7. TABELA DE MENSAGENS (Chat vinculado à solicitação)
CREATE TABLE IF NOT EXISTS mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitacao_id INT NOT NULL,
    remetente_id INT, -- Pode ser NULL quando for uma mensagem automática do "SISTEMA"
    texto TEXT NULL,
    imagem_base64 LONGTEXT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 8. TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitacao_id INT NOT NULL,
    cliente_id INT NOT NULL,
    prestador_id INT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    taxa_plataforma DECIMAL(10,2) NOT NULL,
    valor_prestador DECIMAL(10,2) NOT NULL,
    tipo ENUM('PAGAMENTO', 'ESTORNO') DEFAULT 'PAGAMENTO',
    status ENUM('PENDENTE', 'RETIDO', 'CONCLUIDO', 'CANCELADO') DEFAULT 'RETIDO',
    transacao_mp_id VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE
);

-- 9. TABELA DE AVALIAÇÕES (Feedback do cliente para o prestador)
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitacao_id INT NOT NULL UNIQUE, -- Uma solicitação só pode ter uma avaliação
    cliente_id INT NOT NULL,
    prestador_id INT NOT NULL,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE
);

-- 10. TABELA DE RECUPERAÇÃO DE SENHA (Controle de tokens e expiração)
CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_em DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 11. TABELA DE LOGS DO USUÁRIO (Rastreabilidade de ações no sistema)
CREATE TABLE IF NOT EXISTS logs_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT, -- Pode ser NULL caso o log seja de um usuário não logado
    acao VARCHAR(255) NOT NULL,
    detalhes TEXT,
    ip_endereco VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);