-- Fondora: tableau budget, rapprochement des récurrences et investissements.
-- Cette migration est additive afin de préserver les données existantes.

alter table public.profiles
  add column if not exists budget_widgets jsonb not null default '["restant_a_vivre","what_if","echeances","abonnements","budget_vs_reel","evolution_temps","objectif_epargne","top5_depenses","flux_financier","repartition_depenses","budgets"]'::jsonb;

alter table public.transactions
  add column if not exists recurrence_modele boolean not null default false,
  add column if not exists recurrence_active boolean not null default true,
  add column if not exists rapprochement_statut text not null default 'non_concerne',
  add column if not exists rapprochement_transaction_id uuid references public.transactions(id) on delete set null;

alter table public.dividendes
  add column if not exists compte_id uuid references public.comptes(id) on delete set null,
  add column if not exists type_compte text,
  add column if not exists reinvesti boolean not null default false,
  add column if not exists transaction_reinvestissement_id uuid references public.transactions_investissement(id) on delete set null;

alter table public.transactions_investissement
  add column if not exists compte_id uuid references public.comptes(id) on delete set null,
  add column if not exists actif_id uuid references public.catalogue_actifs(id) on delete set null,
  add column if not exists origine text not null default 'ordre_utilisateur';

alter table public.positions_financieres
  add column if not exists compte_id uuid references public.comptes(id) on delete cascade;

create index if not exists idx_transactions_recurrence_active
  on public.transactions(user_id, recurrence_groupe_id, recurrence_active)
  where recurrence_groupe_id is not null;
create index if not exists idx_transactions_rapprochement
  on public.transactions(user_id, compte_id, date, montant);
create index if not exists idx_transactions_investissement_compte
  on public.transactions_investissement(user_id, compte_id, date);
