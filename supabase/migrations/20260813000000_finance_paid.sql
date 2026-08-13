-- Marca de pagamento nos lançamentos financeiros
alter table public.finance_entries
  add column if not exists paid_at timestamptz;

comment on column public.finance_entries.paid_at is
  'Quando o lançamento foi marcado como pago/recebido (null = pendente)';
