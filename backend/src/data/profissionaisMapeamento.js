/**
 * Mapeamento de profissionais derivado do schema.sql (tabela categorias).
 * Categorias oficiais: Limpeza, Manutenção, Reformas, Tecnologia, Saúde e Beleza, Outros.
 * Não requer alterações no banco de dados.
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
    { categoria: 'Limpeza', nome: 'Diarista', descricao: 'Limpeza residencial e organização do lar', palavras_chave: 'diarista,limpeza,limpar,faxina,faxineira,casa,apartamento,poeira,organizar,doméstica,domestica,suja,sujo,lavar' },
    { categoria: 'Limpeza', nome: 'Limpeza Pós-Obra', descricao: 'Remoção de entulho e limpeza após reformas', palavras_chave: 'pós-obra,pos obra,entulho,reforma,construção,construcao,obras,resíduos,residuos' },
    { categoria: 'Limpeza', nome: 'Limpeza de Estofados', descricao: 'Higienização de sofás, colchões e carpetes', palavras_chave: 'estofado,sofá,sofa,colchão,colchao,carpete,tapete,higienização,higienizacao,mancha,ácaros,acaros' },
    { categoria: 'Limpeza', nome: 'Limpeza de Vidros', descricao: 'Limpeza de janelas, vitrines e fachadas', palavras_chave: 'vidro,janela,vitrine,fachada,cristal,espelho' },

    { categoria: 'Manutenção', nome: 'Encanador', descricao: 'Reparos hidráulicos, vazamentos e encanamentos', palavras_chave: 'encanador,encanamento,água,agua,cano,vazamento,vazando,pia,torneira,ralo,vaso,sanitário,sanitario,entupido,entupimento,hidráulica,hidraulica,pingando,gotejando' },
    { categoria: 'Manutenção', nome: 'Eletricista', descricao: 'Instalações e reparos elétricos', palavras_chave: 'eletricista,eletricidade,luz,energia,tomada,fio,curto,disjuntor,chuveiro,lâmpada,lampada,interruptor,sem luz,apagou' },
    { categoria: 'Manutenção', nome: 'Técnico de Ar Condicionado', descricao: 'Instalação e manutenção de climatização', palavras_chave: 'ar condicionado,climatização,climatizacao,ar-condicionado,refrigeração,refrigeracao,split,ventilador' },
    { categoria: 'Manutenção', nome: 'Chaveiro', descricao: 'Abertura de fechaduras e cópias de chaves', palavras_chave: 'chaveiro,chave,fechadura,trancado,trancou,cadeado,cópia,copia' },
    { categoria: 'Manutenção', nome: 'Marido de Aluguel', descricao: 'Pequenos reparos gerais na residência', palavras_chave: 'marido de aluguel,reparo,conserto,quebrou,consertar,fixar,pendurar' },

    { categoria: 'Reformas', nome: 'Pedreiro', descricao: 'Alvenaria, construção e reformas estruturais', palavras_chave: 'pedreiro,alvenaria,tijolo,cimento,reboco,construção,construcao,obra,muro,fundação,fundacao' },
    { categoria: 'Reformas', nome: 'Pintor', descricao: 'Pintura de paredes, tetos e fachadas', palavras_chave: 'pintor,pintura,tinta,pintar,parede,teto,fachada,esmalte,latex,descascando' },
    { categoria: 'Reformas', nome: 'Marceneiro', descricao: 'Fabricação e montagem de móveis', palavras_chave: 'marceneiro,móveis,moveis,montar,montagem,guarda-roupa,armário,armario,estante,mesa,cadeira,mdf,madeira,carpintaria' },
    { categoria: 'Reformas', nome: 'Gesseiro', descricao: 'Instalação de gesso, sancas e divisórias', palavras_chave: 'gesseiro,gesso,sanca,forro,divisória,divisoria,drywall' },
    { categoria: 'Reformas', nome: 'Azulejista', descricao: 'Instalação de pisos, azulejos e revestimentos', palavras_chave: 'azulejista,azulejo,piso,cerâmica,ceramica,revestimento,porcelanato' },

    { categoria: 'Tecnologia', nome: 'Técnico de Informática', descricao: 'Manutenção de computadores e notebooks', palavras_chave: 'computador,pc,notebook,laptop,informática,informatica,formatar,vírus,virus,lento,não liga,nao liga,tela azul,windows' },
    { categoria: 'Tecnologia', nome: 'Técnico de Redes', descricao: 'Instalação e configuração de internet e Wi-Fi', palavras_chave: 'rede,wifi,wi-fi,internet,roteador,modem,conexão,conexao,sinal' },
    { categoria: 'Tecnologia', nome: 'Técnico de Celular', descricao: 'Reparo de smartphones e tablets', palavras_chave: 'celular,smartphone,telefone,tela quebrada,bateria,tablet,iphone,android' },
    { categoria: 'Tecnologia', nome: 'Instalador de Câmeras', descricao: 'Instalação de câmeras de segurança e CFTV', palavras_chave: 'câmera,camera,segurança,seguranca,cftv,monitoramento,alarme' },

    { categoria: 'Saúde e Beleza', nome: 'Cabeleireiro', descricao: 'Corte, coloração e tratamentos capilares', palavras_chave: 'cabeleireiro,cabelo,corte,coloração,coloracao,escova,progressiva,salão,salao,penteado' },
    { categoria: 'Saúde e Beleza', nome: 'Manicure', descricao: 'Cuidados com unhas das mãos e pés', palavras_chave: 'manicure,unha,pé,pe,esmaltação,esmaltacao,pedicure,mãos,maos,cutilagem' },
    { categoria: 'Saúde e Beleza', nome: 'Massagista', descricao: 'Massagens relaxantes e terapêuticas', palavras_chave: 'massagem,massagista,relaxante,dor nas costas,tensão,tensao,drenagem' },
    { categoria: 'Saúde e Beleza', nome: 'Maquiador', descricao: 'Maquiagem para eventos e ocasiões especiais', palavras_chave: 'maquiagem,maquiador,make,evento,festa,casamento,formatura' },
    { categoria: 'Saúde e Beleza', nome: 'Barbeiro', descricao: 'Corte masculino e barba', palavras_chave: 'barbeiro,barba,barbearia,corte masculino,navalha,degradê,degrade' },

    { categoria: 'Outros', nome: 'Jardineiro', descricao: 'Manutenção de jardins e áreas verdes', palavras_chave: 'jardim,jardineiro,planta,grama,poda,capina,paisagismo,irrigação,irrigacao,mato' },
    { categoria: 'Outros', nome: 'Dog Walker', descricao: 'Passeio e cuidados com pets', palavras_chave: 'cachorro,cão,cao,pet,passeio,dog walker,animal,gato,pet sitter' },
    { categoria: 'Outros', nome: 'Professor Particular', descricao: 'Aulas particulares e reforço escolar', palavras_chave: 'aula,professor,reforço,reforco,escola,matéria,materia,matemática,matematica,inglês,ingles,estudo' },
    { categoria: 'Outros', nome: 'Personal Organizer', descricao: 'Organização de ambientes e rotinas', palavras_chave: 'organizar,organização,organizacao,desapego,closet,bagunça,bagunca,organizer' },
    { categoria: 'Outros', nome: 'Prestador Geral', descricao: 'Serviços diversos da categoria Outros', palavras_chave: 'outro,diverso,geral,ajuda,varios,vários' }
];

module.exports = {
    CATEGORIAS_SCHEMA,
    PROFISSIONAIS_POR_CATEGORIA
};
