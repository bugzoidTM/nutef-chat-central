-- Adiciona 'video' ao enum message_type (schema watende).
-- Sem esse valor, o bridge (server/index.js: typeMap video->"video") lançava
-- HTTP 500 ao gravar mensagens de vídeo recebidas via webhook do whatsai
-- ("invalid input value for enum message_type: video"), descartando a mensagem.
ALTER TYPE watende.message_type ADD VALUE IF NOT EXISTS 'video';
