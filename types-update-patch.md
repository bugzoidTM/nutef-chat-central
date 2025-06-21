# Atualização dos Tipos após Migração - Fase 1

## Após executar as migrações, os tipos TypeScript precisarão ser atualizados para incluir:

### Novas Tabelas:
1. **sectors**
   - id, name, description, color, is_active, created_by, created_at, updated_at

2. **conversation_transfers** 
   - id, conversation_id, from_attendant_id, to_attendant_id, from_sector_id, to_sector_id, reason, status, transferred_by, accepted_at, completed_at, created_at

### Campos Adicionados:
1. **profiles**
   - sector_id (UUID reference to sectors)
   - managed_by (UUID reference to profiles)
   - can_transfer (boolean)
   - max_concurrent_chats (integer)

2. **conversations**
   - sector_id (UUID reference to sectors)

3. **attendant_sectors**
   - sector_id (UUID reference to sectors)

4. **messages**
   - is_read (boolean)
   - sender_name (text) - já existe
   - sender_sector (text) - já existe
   - sequence_number (bigint) - já existe

## Comando para gerar tipos atualizados:
```bash
npx supabase gen types typescript --project-id [PROJECT_ID] --schema public > src/integrations/supabase/types.ts
```

## Ou execute no painel do Supabase:
1. Vá para SQL Editor
2. Execute as migrações criadas
3. Use a API do Supabase para gerar novos tipos 