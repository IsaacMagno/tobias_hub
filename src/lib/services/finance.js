/**
 * Ledger financeiro: categorias + lançamentos.
 * Sem carteiras/contas bancárias nesta versão.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { dateKeyInTz } from "@/lib/helpers/habitStreak";

const TZ = process.env.TIMEZONE || "America/Sao_Paulo";

const DEFAULT_CATEGORIES = [
  { name: "Moradia", kind: "expense" },
  { name: "Mercado", kind: "expense" },
  { name: "Transporte", kind: "expense" },
  { name: "Lazer", kind: "expense" },
  { name: "Saúde", kind: "expense" },
  { name: "Contas", kind: "expense" },
  { name: "Outros", kind: "expense" },
  { name: "Salário", kind: "income" },
  { name: "Freelance", kind: "income" },
  { name: "Outros", kind: "income" },
];

const VALID_PERIODS = new Set([
  "month",
  "quarter",
  "semester",
  "year",
  "custom",
]);

function parseDateKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addDays(dateKey, n) {
  const p = parseDateKey(dateKey);
  if (!p) return null;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dateKeyInTz(dt, "UTC");
}

function clampDateKey(key) {
  return parseDateKey(key) ? key : null;
}

/** Resolve janela [from, to] inclusive (YYYY-MM-DD) para o período. */
export function resolveFinanceRange({
  period = "month",
  from = null,
  to = null,
  anchor = null,
} = {}) {
  if (!VALID_PERIODS.has(period)) {
    throw new Error("Período inválido");
  }

  if (period === "custom") {
    const f = clampDateKey(from);
    const t = clampDateKey(to);
    if (!f || !t) throw new Error("Informe de e até para o período personalizado");
    if (f > t) throw new Error("A data inicial não pode ser depois da final");
    return { from: f, to: t, period };
  }

  const today = clampDateKey(anchor) || dateKeyInTz(new Date(), TZ);
  const { y, m } = parseDateKey(today);

  if (period === "month") {
    const fromKey = `${y}-${String(m).padStart(2, "0")}-01`;
    const toKey = `${y}-${String(m).padStart(2, "0")}-${String(
      daysInMonth(y, m)
    ).padStart(2, "0")}`;
    return { from: fromKey, to: toKey, period };
  }

  if (period === "quarter") {
    const qStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
    const qEndMonth = qStartMonth + 2;
    const fromKey = `${y}-${String(qStartMonth).padStart(2, "0")}-01`;
    const toKey = `${y}-${String(qEndMonth).padStart(2, "0")}-${String(
      daysInMonth(y, qEndMonth)
    ).padStart(2, "0")}`;
    return { from: fromKey, to: toKey, period };
  }

  if (period === "semester") {
    const sStart = m <= 6 ? 1 : 7;
    const sEnd = m <= 6 ? 6 : 12;
    const fromKey = `${y}-${String(sStart).padStart(2, "0")}-01`;
    const toKey = `${y}-${String(sEnd).padStart(2, "0")}-${String(
      daysInMonth(y, sEnd)
    ).padStart(2, "0")}`;
    return { from: fromKey, to: toKey, period };
  }

  // year
  return {
    from: `${y}-01-01`,
    to: `${y}-12-31`,
    period,
  };
}

function daySpan(from, to) {
  const a = parseDateKey(from);
  const b = parseDateKey(to);
  const da = Date.UTC(a.y, a.m - 1, a.d);
  const db = Date.UTC(b.y, b.m - 1, b.d);
  return Math.floor((db - da) / 86400000) + 1;
}

/** Escolhe granularidade do gráfico pelo tamanho da janela. */
function bucketMode(from, to) {
  const days = daySpan(from, to);
  if (days <= 40) return "day";
  if (days <= 100) return "week";
  return "month";
}

function bucketKey(dateKey, mode) {
  const { y, m, d } = parseDateKey(dateKey);
  if (mode === "day") return dateKey;
  if (mode === "month") return `${y}-${String(m).padStart(2, "0")}`;
  // week: ISO-like Monday start key = Monday's date
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0 Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dateKeyInTz(dt, "UTC");
}

function labelBucket(key, mode) {
  if (mode === "day") {
    const { d, m } = parseDateKey(key);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  }
  if (mode === "month") {
    const [y, mo] = key.split("-");
    return `${mo}/${y.slice(2)}`;
  }
  // week
  const { d, m } = parseDateKey(key);
  return `sem ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

function enumerateBuckets(from, to, mode) {
  const keys = [];
  let cur = from;
  while (cur <= to) {
    const k = bucketKey(cur, mode);
    if (!keys.length || keys[keys.length - 1] !== k) keys.push(k);
    cur = addDays(cur, 1);
    if (!cur) break;
  }
  return keys;
}

function parseAmountToCents(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  const raw = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/i, "");
  if (!raw) return null;
  // 1.234,56 or 1234,56 or 1234.56
  let normalized = raw;
  if (raw.includes(",") && raw.includes(".")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    normalized = raw.replace(",", ".");
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function ensureDefaultCategories(championId) {
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from("finance_categories")
    .select("id")
    .eq("champion_id", championId)
    .limit(1);
  if (error) throw new Error(error.message);
  if (existing?.length) return;

  const rows = DEFAULT_CATEGORIES.map((c) => ({
    champion_id: championId,
    name: c.name,
    kind: c.kind,
  }));
  const { error: insErr } = await supabase
    .from("finance_categories")
    .insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function listFinanceCategories(championId, { includeArchived = false } = {}) {
  await ensureDefaultCategories(championId);
  const supabase = createAdminClient();
  let q = supabase
    .from("finance_categories")
    .select("id, name, kind, archived_at, created_at")
    .eq("champion_id", championId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });
  if (!includeArchived) q = q.is("archived_at", null);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createFinanceCategory(championId, { name, kind }) {
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("Nome da categoria é obrigatório");
  if (kind !== "income" && kind !== "expense") {
    throw new Error("Tipo de categoria inválido");
  }
  await ensureDefaultCategories(championId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_categories")
    .insert({
      champion_id: championId,
      name: trimmed,
      kind,
    })
    .select("id, name, kind, archived_at, created_at")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe uma categoria com esse nome");
    }
    throw new Error(error.message);
  }
  return data;
}

export async function archiveFinanceCategory(championId, categoryId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", Number(categoryId))
    .eq("champion_id", championId)
    .is("archived_at", null)
    .select("id, name, kind, archived_at")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Categoria não encontrada");
  return data;
}

export async function listFinanceEntries(
  championId,
  { limit = 30, offset = 0, from = null, to = null } = {}
) {
  await ensureDefaultCategories(championId);
  const supabase = createAdminClient();
  let q = supabase
    .from("finance_entries")
    .select(
      "id, amount_cents, occurred_on, note, created_at, updated_at, category_id, finance_categories(id, name, kind)"
    )
    .eq("champion_id", championId)
    .order("occurred_on", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) q = q.gte("occurred_on", from);
  if (to) q = q.lte("occurred_on", to);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: row.id,
    amount_cents: row.amount_cents,
    occurred_on: row.occurred_on,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category_id: row.category_id,
    category: row.finance_categories
      ? {
          id: row.finance_categories.id,
          name: row.finance_categories.name,
          kind: row.finance_categories.kind,
        }
      : null,
  }));
}

async function assertCategoryOwned(supabase, championId, categoryId, kind = null) {
  const { data, error } = await supabase
    .from("finance_categories")
    .select("id, kind, archived_at")
    .eq("id", Number(categoryId))
    .eq("champion_id", championId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.archived_at) throw new Error("Categoria inválida");
  if (kind && data.kind !== kind) {
    throw new Error("Categoria não combina com o tipo do lançamento");
  }
  return data;
}

export async function createFinanceEntry(
  championId,
  { categoryId, amount, amountCents, occurredOn, note }
) {
  const cents =
    amountCents != null
      ? Math.round(Number(amountCents))
      : parseAmountToCents(amount);
  if (!cents || cents <= 0) throw new Error("Valor inválido");

  const date = clampDateKey(occurredOn) || dateKeyInTz(new Date(), TZ);
  const supabase = createAdminClient();
  await assertCategoryOwned(supabase, championId, categoryId);

  const { data, error } = await supabase
    .from("finance_entries")
    .insert({
      champion_id: championId,
      category_id: Number(categoryId),
      amount_cents: cents,
      occurred_on: date,
      note: note ? String(note).trim().slice(0, 280) : null,
    })
    .select(
      "id, amount_cents, occurred_on, note, created_at, updated_at, category_id, finance_categories(id, name, kind)"
    )
    .single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    amount_cents: data.amount_cents,
    occurred_on: data.occurred_on,
    note: data.note,
    created_at: data.created_at,
    updated_at: data.updated_at,
    category_id: data.category_id,
    category: data.finance_categories
      ? {
          id: data.finance_categories.id,
          name: data.finance_categories.name,
          kind: data.finance_categories.kind,
        }
      : null,
  };
}

export async function updateFinanceEntry(
  championId,
  entryId,
  { categoryId, amount, amountCents, occurredOn, note }
) {
  const supabase = createAdminClient();
  const patch = { updated_at: new Date().toISOString() };

  if (categoryId != null) {
    await assertCategoryOwned(supabase, championId, categoryId);
    patch.category_id = Number(categoryId);
  }
  if (amountCents != null || amount != null) {
    const cents =
      amountCents != null
        ? Math.round(Number(amountCents))
        : parseAmountToCents(amount);
    if (!cents || cents <= 0) throw new Error("Valor inválido");
    patch.amount_cents = cents;
  }
  if (occurredOn != null) {
    const date = clampDateKey(occurredOn);
    if (!date) throw new Error("Data inválida");
    patch.occurred_on = date;
  }
  if (note !== undefined) {
    patch.note = note ? String(note).trim().slice(0, 280) : null;
  }

  const { data, error } = await supabase
    .from("finance_entries")
    .update(patch)
    .eq("id", Number(entryId))
    .eq("champion_id", championId)
    .select(
      "id, amount_cents, occurred_on, note, created_at, updated_at, category_id, finance_categories(id, name, kind)"
    )
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lançamento não encontrado");

  return {
    id: data.id,
    amount_cents: data.amount_cents,
    occurred_on: data.occurred_on,
    note: data.note,
    created_at: data.created_at,
    updated_at: data.updated_at,
    category_id: data.category_id,
    category: data.finance_categories
      ? {
          id: data.finance_categories.id,
          name: data.finance_categories.name,
          kind: data.finance_categories.kind,
        }
      : null,
  };
}

export async function deleteFinanceEntry(championId, entryId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_entries")
    .delete()
    .eq("id", Number(entryId))
    .eq("champion_id", championId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lançamento não encontrado");
  return { ok: true };
}

export async function getFinanceChart(
  championId,
  { period = "month", from = null, to = null, anchor = null } = {}
) {
  await ensureDefaultCategories(championId);
  const range = resolveFinanceRange({ period, from, to, anchor });
  const mode = bucketMode(range.from, range.to);
  const bucketKeys = enumerateBuckets(range.from, range.to, mode);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_entries")
    .select(
      "amount_cents, occurred_on, finance_categories!inner(kind)"
    )
    .eq("champion_id", championId)
    .gte("occurred_on", range.from)
    .lte("occurred_on", range.to);
  if (error) throw new Error(error.message);

  const map = new Map(
    bucketKeys.map((k) => [k, { income: 0, expense: 0 }])
  );
  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const row of data || []) {
    const kind = row.finance_categories?.kind;
    if (kind !== "income" && kind !== "expense") continue;
    const k = bucketKey(row.occurred_on, mode);
    if (!map.has(k)) map.set(k, { income: 0, expense: 0 });
    const cell = map.get(k);
    cell[kind] += row.amount_cents;
    if (kind === "income") incomeTotal += row.amount_cents;
    else expenseTotal += row.amount_cents;
  }

  const buckets = bucketKeys.map((k) => ({
    key: k,
    label: labelBucket(k, mode),
    income_cents: map.get(k)?.income || 0,
    expense_cents: map.get(k)?.expense || 0,
  }));

  return {
    period: range.period,
    from: range.from,
    to: range.to,
    bucketMode: mode,
    income_cents: incomeTotal,
    expense_cents: expenseTotal,
    balance_cents: incomeTotal - expenseTotal,
    buckets,
  };
}
