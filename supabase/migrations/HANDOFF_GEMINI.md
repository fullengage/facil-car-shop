# Handoff Concluído — Banco do Fácil Car Shop (Supabase `zzehxqgyberjewihsliu`)

**Data:** 10/10/2026  
**Status:** MIGRAÇÃO APLICADA COM SUCESSO NO BANCO DE DADOS

---

## 1. Migração Aplicada (`20261011_admin_rls_final.sql`)
Todas as seções foram executadas e validadas diretamente no PostgreSQL do Supabase:

1. **`fcs_profiles`:**
   - Adicionada coluna `role` (default `'user'`, restrito a `'user'`, `'super_admin'`).
   - Adicionada coluna `cpf` com validação de dígitos verificadores (`fcs_is_valid_cpf`).
   - `SELECT` revogado para `anon` e restrito às colunas públicas para `authenticated` (sem expor CPF).

2. **`fcs_memberships` e Escopo:**
   - Suporte aos papéis: `'lojista'`, `'admin_loja'`, `'vendedor'`, `'vendedor_autonomo'`.
   - `dealer_id` tornado anulável (DROP NOT NULL) para permitir vendedor autônomo sem revenda.
   - Restrição de escopo (`fcs_memberships_scope_check`):
     - `lojista`: `dealer_id IS NOT NULL AND store_id IS NULL`
     - `admin_loja` / `vendedor`: `dealer_id IS NOT NULL AND store_id IS NOT NULL`
     - `vendedor_autonomo`: `dealer_id IS NULL AND store_id IS NULL`
   - Índices parciais de unicidade criados para lojistas, admins de loja e autônomos.

3. **Funções Auxiliares de Segurança (`SECURITY DEFINER`):**
   - `fcs_is_super_admin()`, `fcs_store_dealer_id()`, `fcs_lead_store_id()`, `fcs_public_vehicle_store_id()`.
   - `fcs_store_is_public()`, `fcs_dealer_is_active()`, `fcs_is_dealer_owner()`, `fcs_is_active_dealer_owner()`.
   - `fcs_profile_has_cpf()`, `fcs_is_dealer_member()`, `fcs_is_store_admin()`, `fcs_is_store_member()`, `fcs_is_autonomous_seller()`.

4. **Triggers de Guarda:**
   - Trava de campos administrativos: `fcs_guard_admin_fields` para dealers, stores, profiles e leads.
   - Limite por plano comercial: `fcs_enforce_plan_limit` aplicado em veículos, lojas e vendedores.

5. **`fcs_proposals`:**
   - Coluna `seller_id` alterada para aceitar `NULL` (`ALTER TABLE fcs_proposals ALTER COLUMN seller_id DROP NOT NULL;`), permitindo propostas vindas da vitrine anônima antes da atribuição de um vendedor.

6. **Função Pública de Cadastro (`fcs_public_register_store`):**
   - Criada como `SECURITY DEFINER` e liberada para papéis `anon` e `authenticated`.
   - Cria a revenda (`fcs_dealers`) com status `pending`, assinatura trial do plano Básico em `fcs_subscriptions`, e a loja em `fcs_stores` com status `pending_approval`.
   - Testada e validada em produção retornando `{ success: true, dealer_id, store_id }`.

7. **Tabela Comercial de Planos (`fcs_plans`):**
   - Atualizada para os 3 planos comerciais oficiais da vitrine:
     - **Básico:** R$ 29,00/mês | 10 veículos | 1 loja | 1 vendedor
     - **Pro:** R$ 149,00/mês | 50 veículos | 2 lojas | 5 vendedores
     - **Premium:** R$ 299,00/mês | 9999 veículos (ilimitado) | 10 lojas | 20 vendedores

8. **Políticas de Row Level Security (RLS):**
   - RLS ativo em todas as 22 tabelas do sistema.
   - Políticas restritas implementadas para Perfis, Revendas, Memberships, Lojas, Veículos, Mídias, Clientes, Funil, Leads, Distribuição, Linha do Tempo, Tarefas, Propostas, Vendas, Contatos, Regras, Auditoria, Log Externo, Planos, Assinaturas e Compradores.

---

## 2. Ajustes Realizados no Frontend (Vitrine e CRM)
1. **`AnuncieForm.tsx`:** Atualizado para chamar `supabase.rpc('fcs_public_register_store', ...)` em vez de tentar inserção direta sem privilégios.
2. **`PropostaForm.tsx`:** Atualizado para gerar IDs no cliente via `crypto.randomUUID()`, enviar proposta sem `seller_id` e sem `.select()` (evitando o bloqueio do `RETURNING *` no papel anônimo).
3. **Tipografia:** Fonte oficial **Poppins** aplicada no layout e no CSS global.
4. **Build do Next.js:** Compilado com sucesso (`next build`), gerando 76 rotas estáticas otimizadas sem nenhum erro de TypeScript.

---

## 3. Próximo Passo para o Claude Code / Equipe
- Testar a submissão de anúncio de revenda e de propostas diretamente pelo navegador na vitrine pública.
- Quando a tela de Login (Supabase Auth) for implementada, atribuir o papel `super_admin` ao primeiro usuário via:
  ```sql
  UPDATE public.fcs_profiles SET role = 'super_admin' WHERE id = '<UUID-DO-USUARIO-AUTH>';
  ```
