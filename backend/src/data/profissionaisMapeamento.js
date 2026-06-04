/**
 * Catálogo de profissões e palavras-chave (referência para NLP e sugestões).
 * Categorias oficiais do schema: Limpeza, Manutenção, Reformas, Tecnologia, Saúde e Beleza, Outros.
 */

const CATEGORIAS_SCHEMA = [
    'Limpeza',
    'Manutenção',
    'Reformas',
    'Tecnologia',
    'Saúde e Beleza',
    'Outros'
];

const PROFISSIONAIS_POR_CATEGORIA = [
    // ─── LIMPEZA ───
    { categoria: 'Limpeza', nome: 'Diarista', descricao: 'Limpeza residencial, faxina e organização do lar', palavras_chave: 'diarista,faxina,faxineira,casa,apartamento,poeira,organizar,doméstica,domestica,suja,sujo,lar,residencial,limpeza residencial,limpeza domestica,quarto,sala,cozinha,banheiro' },
    { categoria: 'Limpeza', nome: 'Zelador', descricao: 'Limpeza e manutenção de áreas comuns em condomínios', palavras_chave: 'zelador,condomínio,condominio,áreas comuns,areas comuns,hall,escadaria,portaria,prédio,predio' },
    { categoria: 'Limpeza', nome: 'Limpeza Pós-Obra', descricao: 'Remoção de entulho e limpeza pesada após reformas', palavras_chave: 'pós-obra,pos obra,entulho,reforma,construção,construcao,obras,resíduos,residuos,poeira de obra,limpeza fina' },
    { categoria: 'Limpeza', nome: 'Limpeza de Estofados', descricao: 'Higienização de sofás, colchões, carpetes e tapetes', palavras_chave: 'estofado,sofá,sofa,colchão,colchao,carpete,tapete,higienização,higienizacao,mancha,ácaros,acaros,poltrona' },
    { categoria: 'Limpeza', nome: 'Limpeza de Vidros', descricao: 'Limpeza de janelas, vitrines, box e fachadas em altura', palavras_chave: 'vidro,janela,vitrine,fachada,cristal,espelho,box,blindex,vidraça,vidraca,altura' },
    { categoria: 'Limpeza', nome: 'Limpeza Comercial', descricao: 'Limpeza de escritórios, lojas e estabelecimentos', palavras_chave: 'comercial,escritório,escritorio,loja,empresa,sala comercial,galpão,galpao,indústria,industria' },
    { categoria: 'Limpeza', nome: 'Passadeira', descricao: 'Passar roupas e organização de lavanderia', palavras_chave: 'passar roupa,passadeira,ferro de passar,roupa amassada,lavanderia,engomar' },

    // ─── MANUTENÇÃO ───
    { categoria: 'Manutenção', nome: 'Piscineiro', descricao: 'Limpeza, tratamento químico e manutenção de piscinas', palavras_chave: 'piscina,piscineiro,água verde,tratamento piscina,tratamento de piscina,limpeza piscina,limpeza de piscina,cloro,filtro,algas,ph,limpar piscina,manutenção piscina,bomba piscina' },
    { categoria: 'Manutenção', nome: 'Encanador', descricao: 'Reparos hidráulicos, vazamentos e desentupimentos', palavras_chave: 'encanador,encanamento,cano,vazamento,vazando,pia,torneira,ralo,vaso,sanitário,sanitario,entupido,entupimento,hidráulica,hidraulica,pingando,gotejando,registro,caixa dagua,caixa d agua' },
    { categoria: 'Manutenção', nome: 'Eletricista', descricao: 'Instalações, reparos elétricos e quadro de luz', palavras_chave: 'eletricista,eletricidade,luz,energia,tomada,fio,curto,disjuntor,chuveiro,lâmpada,lampada,interruptor,sem luz,apagou,fiacao,fiação,quadro elétrico,quadro eletrico' },
    { categoria: 'Manutenção', nome: 'Técnico de Ar Condicionado', descricao: 'Instalação, limpeza e manutenção de ar-condicionado', palavras_chave: 'ar condicionado,climatização,climatizacao,ar-condicionado,refrigeração,refrigeracao,split,ventilador,gás refrigerante,gas refrigerante,nao gela,nao gelando' },
    { categoria: 'Manutenção', nome: 'Chaveiro', descricao: 'Abertura de fechaduras, troca de segredo e cópias de chaves', palavras_chave: 'chaveiro,chave,fechadura,trancado,trancou,cadeado,cópia,copia,porta trancada,perdi a chave' },
    { categoria: 'Manutenção', nome: 'Marido de Aluguel', descricao: 'Pequenos reparos e serviços gerais na residência', palavras_chave: 'marido de aluguel,reparo,conserto,quebrou,consertar,fixar,pendurar,pequeno reparo,ajudante' },
    { categoria: 'Manutenção', nome: 'Técnico em Eletrodomésticos', descricao: 'Conserto de geladeira, fogão, máquina de lavar e micro-ondas', palavras_chave: 'eletrodoméstico,eletrodomestico,geladeira,fogão,fogao,máquina de lavar,maquina de lavar,micro-ondas,microondas,secadora,freezer,nao liga,defeito' },
    { categoria: 'Manutenção', nome: 'Instalador de Gás', descricao: 'Instalação e manutenção de gás encanado e botijão', palavras_chave: 'gás,gas,gás encanado,gas encanado,botijão,botijao,fogão a gás,vazamento de gás,regulador' },
    { categoria: 'Manutenção', nome: 'Serralheiro', descricao: 'Portões, grades, estruturas metálicas e soldas leves', palavras_chave: 'serralheiro,serralheria,grade,portão,portao,ferro,metal,estrutura metálica,estrutura metalica,solda' },
    { categoria: 'Manutenção', nome: 'Vidraceiro', descricao: 'Troca e instalação de vidros, box e espelhos', palavras_chave: 'vidraceiro,vidraçaria,vidracaria,troca de vidro,box quebrado,espelho,blindex' },
    { categoria: 'Manutenção', nome: 'Dedetizador', descricao: 'Controle de pragas, cupins, baratas e ratos', palavras_chave: 'dedetização,dedetizacao,dedetizar,dedetizador,pragas,barata,rato,cupim,formiga,escorpião,escorpiao,desinsetização,desinsetizacao,inseto,infestação,infestacao' },
    { categoria: 'Manutenção', nome: 'Desentupidor', descricao: 'Desentupimento de esgoto, ralos e colunas', palavras_chave: 'desentupidor,desentupimento,esgoto,ralo entupido,vaso entupido,coluna,fossa,hidrojato' },
    { categoria: 'Manutenção', nome: 'Técnico de Portão Automático', descricao: 'Instalação e conserto de portões eletrônicos', palavras_chave: 'portão automático,portao automatico,motor de portão,cancela,controle remoto portão' },
    { categoria: 'Manutenção', nome: 'Calheiro', descricao: 'Instalação e limpeza de calhas e rufos', palavras_chave: 'calha,calheiro,rufos,goteira,entupimento de calha,águas pluviais,aguas pluviais' },
    { categoria: 'Manutenção', nome: 'Técnico em Antenas e TV', descricao: 'Instalação de antenas, parabólicas e sinal de TV', palavras_chave: 'antena,parabólica,parabolica,sinal tv,tv sem sinal,conversor,sky,claro tv' },

    // ─── REFORMAS ───
    { categoria: 'Reformas', nome: 'Pedreiro', descricao: 'Alvenaria, reboco, contrapiso e obras estruturais', palavras_chave: 'pedreiro,alvenaria,tijolo,cimento,reboco,construção,construcao,obra,muro,fundação,fundacao,contrapiso,parede nova' },
    { categoria: 'Reformas', nome: 'Pintor', descricao: 'Pintura interna, externa, textura e grafiato', palavras_chave: 'pintor,pintura,tinta,pintar,parede,teto,fachada,esmalte,latex,descascando,grafiato,textura,impermeabilizar parede' },
    { categoria: 'Reformas', nome: 'Marceneiro', descricao: 'Móveis planejados, marcenaria e montagem', palavras_chave: 'marceneiro,móveis,moveis,montar,montagem,guarda-roupa,armário,armario,estante,mesa,cadeira,mdf,madeira,carpintaria,planejados' },
    { categoria: 'Reformas', nome: 'Gesseiro', descricao: 'Gesso, drywall, sancas e forros', palavras_chave: 'gesseiro,gesso,sanca,forro,divisória,divisoria,drywall,parede de gesso' },
    { categoria: 'Reformas', nome: 'Azulejista', descricao: 'Pisos, azulejos, porcelanato e revestimentos', palavras_chave: 'azulejista,azulejo,piso,cerâmica,ceramica,revestimento,porcelanato,pastilha,banheiro reforma' },
    { categoria: 'Reformas', nome: 'Impermeabilizador', descricao: 'Impermeabilização de lajes, telhados e banheiros', palavras_chave: 'impermeabilização,impermeabilizacao,infiltração,infiltracao,goteira,laje,telhado,umidade na parede,mofo' },
    { categoria: 'Reformas', nome: 'Telhadista', descricao: 'Reparo e instalação de telhados e calhas', palavras_chave: 'telhado,telha,telhadista,cobertura,estrutura telhado,rombimento,galpão,galpao' },
    { categoria: 'Reformas', nome: 'Instalador de Piso Laminado', descricao: 'Instalação de piso laminado, vinílico e deck', palavras_chave: 'piso laminado,piso vinílico,piso vinilico,deck,piso flutuante,rodapé,rodape' },
    { categoria: 'Reformas', nome: 'Demolidor', descricao: 'Demolição controlada e remoção de estruturas', palavras_chave: 'demolição,demolicao,demolidor,quebrar parede,retirar azulejo,quebra' },

    // ─── TECNOLOGIA ───
    { categoria: 'Tecnologia', nome: 'Técnico de Informática', descricao: 'Manutenção de computadores, notebooks e formatação', palavras_chave: 'computador,pc,notebook,laptop,informática,informatica,formatar,vírus,virus,lento,não liga,nao liga,tela azul,windows,hd,ssd' },
    { categoria: 'Tecnologia', nome: 'Técnico de Redes', descricao: 'Wi-Fi, roteadores, cabeamento e internet', palavras_chave: 'rede,wifi,wi-fi,internet,roteador,modem,conexão,conexao,sinal,cabeamento,rede lenta' },
    { categoria: 'Tecnologia', nome: 'Técnico de Celular', descricao: 'Reparo de smartphones, tablets e troca de tela', palavras_chave: 'celular,smartphone,telefone,tela quebrada,bateria,tablet,iphone,android,troca de tela,conector de carga' },
    { categoria: 'Tecnologia', nome: 'Instalador de Câmeras', descricao: 'CFTV, câmeras de segurança e monitoramento', palavras_chave: 'câmera,camera,segurança,seguranca,cftv,monitoramento,alarme,dvr,gravador,vigilância,vigilancia' },
    { categoria: 'Tecnologia', nome: 'Técnico em Impressoras', descricao: 'Manutenção de impressoras e cartuchos', palavras_chave: 'impressora,cartucho,toner,manutenção impressora,manutencao impressora,papel preso' },
    { categoria: 'Tecnologia', nome: 'Desenvolvedor Freelancer', descricao: 'Sites, sistemas e aplicativos sob demanda', palavras_chave: 'desenvolvedor,programador,site,sistema,app,aplicativo,software,landing page,e-commerce,ecommerce,wordpress' },
    { categoria: 'Tecnologia', nome: 'Designer Gráfico', descricao: 'Logos, artes para redes sociais e identidade visual', palavras_chave: 'designer,design,logo,identidade visual,arte,redes sociais,banner,flyer,canva' },

    // ─── SAÚDE E BELEZA ───
    { categoria: 'Saúde e Beleza', nome: 'Cabeleireiro', descricao: 'Corte, coloração, escova e tratamentos capilares', palavras_chave: 'cabeleireiro,cabelo,corte,coloração,coloracao,escova,progressiva,salão,salao,penteado,mechas,luzes' },
    { categoria: 'Saúde e Beleza', nome: 'Barbeiro', descricao: 'Corte masculino, barba e grooming', palavras_chave: 'barbeiro,barba,barbearia,corte masculino,navalha,degradê,degrade,barboterapia' },
    { categoria: 'Saúde e Beleza', nome: 'Manicure', descricao: 'Unhas das mãos, pés e esmaltação', palavras_chave: 'manicure,unha,pé,pe,esmaltação,esmaltacao,pedicure,mãos,maos,cutilagem,alongamento,fibra' },
    { categoria: 'Saúde e Beleza', nome: 'Esteticista', descricao: 'Limpeza de pele, depilação e tratamentos estéticos', palavras_chave: 'esteticista,estética,estetica,limpeza de pele,depilação,depilacao,peeling,drenagem facial,design de sobrancelha' },
    { categoria: 'Saúde e Beleza', nome: 'Massagista', descricao: 'Massagem relaxante, desportiva e terapêutica', palavras_chave: 'massagem,massagista,relaxante,dor nas costas,tensão,tensao,drenagem,shiatsu,quick massage' },
    { categoria: 'Saúde e Beleza', nome: 'Maquiador', descricao: 'Maquiagem para festas, casamentos e eventos', palavras_chave: 'maquiagem,maquiador,make,evento,festa,casamento,formatura,noiva,produção,producao' },
    { categoria: 'Saúde e Beleza', nome: 'Personal Trainer', descricao: 'Treinos personalizados em domicílio ou academia', palavras_chave: 'personal,personal trainer,treino,academia,exercício,exercicio,emagrecer,hipertrofia,condicionamento' },
    { categoria: 'Saúde e Beleza', nome: 'Fisioterapeuta', descricao: 'Fisioterapia domiciliar e reabilitação', palavras_chave: 'fisioterapia,fisioterapeuta,reabilitação,reabilitacao,dor,lombar,pilates,rpg,alongamento' },
    { categoria: 'Saúde e Beleza', nome: 'Nutricionista', descricao: 'Consultoria nutricional e plano alimentar', palavras_chave: 'nutricionista,nutrição,nutricao,dieta,emagrecer,reeducação alimentar,reeducacao alimentar' },
    { categoria: 'Saúde e Beleza', nome: 'Podólogo', descricao: 'Cuidados especializados com os pés', palavras_chave: 'podólogo,podologo,podologia,unha encravada,calosidade,rachadura no pé,micose' },
    { categoria: 'Saúde e Beleza', nome: 'Cuidador de Idosos', descricao: 'Acompanhamento e cuidados com idosos', palavras_chave: 'cuidador,cuidadora,idoso,terceira idade,acompanhante,medicação,medicacao,alzheimer' },

    // ─── OUTROS ───
    { categoria: 'Outros', nome: 'Jardineiro', descricao: 'Poda, plantio, gramado e paisagismo', palavras_chave: 'jardim,jardineiro,planta,grama,poda,capina,paisagismo,irrigação,irrigacao,mato,árvore,arvore,rocagem' },
    { categoria: 'Outros', nome: 'Paisagista', descricao: 'Projeto e execução de jardins e áreas verdes', palavras_chave: 'paisagista,paisagismo,projeto de jardim,plantio,deck,jardim vertical' },
    { categoria: 'Outros', nome: 'Dog Walker', descricao: 'Passeio e cuidados diários com cães', palavras_chave: 'cachorro,cão,cao,pet,passeio,dog walker,animal,passear com cachorro' },
    { categoria: 'Outros', nome: 'Pet Sitter', descricao: 'Hospedagem e cuidados com pets na ausência do dono', palavras_chave: 'pet sitter,gato,cachorro,hospedagem pet,cuidar de pet,férias,férias pet,ferias' },
    { categoria: 'Outros', nome: 'Adestrador', descricao: 'Adestramento e comportamento animal', palavras_chave: 'adestramento,adestrador,cachorro agressivo,obediência,obediencia,latido,comportamento' },
    { categoria: 'Outros', nome: 'Veterinário', descricao: 'Consultas e cuidados veterinários domiciliares', palavras_chave: 'veterinário,veterinario,vet,animal doente,vacina,consulta pet' },
    { categoria: 'Outros', nome: 'Babá', descricao: 'Cuidado de crianças em domicílio', palavras_chave: 'babá,baba,criança,crianca,bebê,bebe,infantil,cuidar de filho,berçário,bercario' },
    { categoria: 'Outros', nome: 'Professor Particular', descricao: 'Aulas particulares e reforço escolar', palavras_chave: 'aula,professor,reforço,reforco,escola,matéria,materia,matemática,matematica,inglês,ingles,estudo,redação,redacao,vestibular,enem' },
    { categoria: 'Outros', nome: 'Personal Organizer', descricao: 'Organização de ambientes, closets e mudanças', palavras_chave: 'organizar,organização,organizacao,desapego,closet,bagunça,bagunca,organizer' },
    { categoria: 'Outros', nome: 'Montador de Móveis', descricao: 'Montagem de móveis planejados e convencionais', palavras_chave: 'montador,montagem,móvel pronto,moveis prontos,ikea,guarda-roupa,armário,armario' },
    { categoria: 'Outros', nome: 'Frete e Mudanças', descricao: 'Transporte de móveis, mudanças residenciais e fretes', palavras_chave: 'frete,mudança,mudanca,caminhão,caminhao,carreto,transporte de móveis,transporte de moveis,embalagem' },
    { categoria: 'Outros', nome: 'Motorista Particular', descricao: 'Motorista para eventos, viagens e idosos', palavras_chave: 'motorista,dirigir,carro,transporte,condutor,levar,buscar,viagem,executivo' },
    { categoria: 'Outros', nome: 'Cozinheira', descricao: 'Preparo de refeições em domicílio e eventos', palavras_chave: 'cozinheira,cozinheiro,comida,refeição,refeicao,almoço,almoco,jantar,evento gastronômico,evento gastronomico' },
    { categoria: 'Outros', nome: 'Churrasqueiro', descricao: 'Churrasco para eventos e confraternizações', palavras_chave: 'churrasqueiro,churrasco,espeto,festa,confraternização,confraternizacao,evento' },
    { categoria: 'Outros', nome: 'Garçom', descricao: 'Serviço de garçom para festas e eventos', palavras_chave: 'garçom,garcom,evento,festa,casamento,buffet,servir mesa' },
    { categoria: 'Outros', nome: 'Fotógrafo', descricao: 'Fotografia de eventos, ensaios e produtos', palavras_chave: 'fotógrafo,fotografo,foto,fotografia,casamento,ensaio,book,evento,produto' },
    { categoria: 'Outros', nome: 'Videomaker', descricao: 'Filmagem e edição de vídeos para eventos e empresas', palavras_chave: 'vídeo,video,filmagem,edição,edicao,videomaker,youtube,reels,evento' },
    { categoria: 'Outros', nome: 'DJ', descricao: 'Música e animação para festas e eventos', palavras_chave: 'dj,festa,som,iluminação,iluminacao,animação,animacao,casamento' },
    { categoria: 'Outros', nome: 'Cerimonialista', descricao: 'Organização e coordenação de casamentos e eventos', palavras_chave: 'cerimonial,casamento,evento,festa,formatura,organização de evento,organizacao de evento' },
    { categoria: 'Outros', nome: 'Advogado', descricao: 'Consultoria jurídica e documentos', palavras_chave: 'advogado,advocacia,jurídico,juridico,processo,contrato,direito,consulta legal' },
    { categoria: 'Outros', nome: 'Contador', descricao: 'Contabilidade, impostos e abertura de empresa', palavras_chave: 'contador,contabilidade,imposto,mei,nota fiscal,das,declaração,declaracao' },
    { categoria: 'Outros', nome: 'Tradutor', descricao: 'Tradução de documentos e textos', palavras_chave: 'tradutor,tradução,traducao,inglês,ingles,espanhol,juramentado' },
    { categoria: 'Outros', nome: 'Prestador Geral', descricao: 'Serviços diversos não listados em outras categorias', palavras_chave: 'outro,diverso,geral,ajuda,varios,vários,serviço personalizado,servico personalizado' }
];

module.exports = {
    CATEGORIAS_SCHEMA,
    PROFISSIONAIS_POR_CATEGORIA
};
