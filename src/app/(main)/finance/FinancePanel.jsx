"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import EmptyState from "@/components/EmptyState";
import {
  fetchFinanceCategories,
  actionCreateFinanceCategory,
  actionArchiveFinanceCategory,
  fetchFinanceEntries,
  actionCreateFinanceEntry,
  actionUpdateFinanceEntry,
  actionDeleteFinanceEntry,
  fetchFinanceChart,
} from "../../services/requests";

const PERIODS = [
  { id: "month", label: "Mensal" },
  { id: "quarter", label: "Trimestral" },
  { id: "semester", label: "Semestral" },
  { id: "year", label: "Anual" },
  { id: "custom", label: "Personalizado" },
];

const PAGE_SIZE = 20;

function formatBrl(cents) {
  const n = Number(cents || 0) / 100;
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyForm() {
  return {
    kind: "expense",
    categoryId: "",
    amount: "",
    occurredOn: todayKey(),
    note: "",
  };
}

export default function FinancePanel() {
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rail, setRail] = useState("");
  const [busy, setBusy] = useState(false);

  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("expense");

  const categoriesForKind = useMemo(
    () => categories.filter((c) => c.kind === form.kind && !c.archived_at),
    [categories, form.kind]
  );

  const loadCategories = useCallback(async () => {
    const rows = await fetchFinanceCategories();
    setCategories(rows || []);
    return rows || [];
  }, []);

  const loadChart = useCallback(async () => {
    const payload =
      period === "custom"
        ? { period: "custom", from: customFrom, to: customTo }
        : { period };
    if (period === "custom" && (!customFrom || !customTo)) {
      setChart(null);
      return;
    }
    const data = await fetchFinanceChart(payload);
    setChart(data);
  }, [period, customFrom, customTo]);

  const loadEntries = useCallback(
    async (nextOffset = 0, append = false) => {
      const rows = await fetchFinanceEntries({
        limit: PAGE_SIZE,
        offset: nextOffset,
        from: chart?.from || null,
        to: chart?.to || null,
      });
      setHasMore((rows || []).length === PAGE_SIZE);
      setOffset(nextOffset);
      setEntries((prev) => (append ? [...prev, ...(rows || [])] : rows || []));
    },
    [chart?.from, chart?.to]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setRail("Carregando finanças…");
    try {
      const cats = await loadCategories();
      await loadChart();
      // entries reload after chart sets range — handled in effect below on first load
      if (!form.categoryId && cats.length) {
        const firstExpense = cats.find((c) => c.kind === "expense");
        if (firstExpense) {
          setForm((f) => ({ ...f, categoryId: String(firstExpense.id) }));
        }
      }
    } catch (err) {
      toast.error(err.message || "Falha ao carregar");
    } finally {
      setRail("");
      setLoading(false);
    }
  }, [loadCategories, loadChart, form.categoryId]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setRail("Atualizando gráfico…");
        await loadChart();
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Falha no gráfico");
      } finally {
        if (!cancelled) setRail("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadChart]);

  useEffect(() => {
    if (!chart?.from) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchFinanceEntries({
          limit: PAGE_SIZE,
          offset: 0,
          from: chart.from,
          to: chart.to,
        });
        if (cancelled) return;
        setEntries(rows || []);
        setOffset(0);
        setHasMore((rows || []).length === PAGE_SIZE);
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Falha nos lançamentos");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart?.from, chart?.to]);

  useEffect(() => {
    const stillValid = categoriesForKind.some(
      (c) => String(c.id) === String(form.categoryId)
    );
    if (!stillValid) {
      setForm((f) => ({
        ...f,
        categoryId: categoriesForKind[0] ? String(categoriesForKind[0].id) : "",
      }));
    }
  }, [categoriesForKind, form.categoryId]);

  const withBusy = async (label, fn) => {
    setBusy(true);
    setRail(label);
    try {
      await fn();
    } catch (err) {
      toast.error(err.message || "Falha na ação");
    } finally {
      setBusy(false);
      setRail("");
    }
  };

  const reloadPeriodData = async () => {
    const data = await fetchFinanceChart(
      period === "custom"
        ? { period: "custom", from: customFrom, to: customTo }
        : { period }
    );
    setChart(data);
    if (!data?.from) {
      setEntries([]);
      return;
    }
    const rows = await fetchFinanceEntries({
      limit: PAGE_SIZE,
      offset: 0,
      from: data.from,
      to: data.to,
    });
    setEntries(rows || []);
    setOffset(0);
    setHasMore((rows || []).length === PAGE_SIZE);
  };

  const handleSubmitEntry = (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("Escolha uma categoria");
      return;
    }
    return withBusy(
      editingId ? "Salvando…" : "Registrando…",
      async () => {
        const payload = {
          categoryId: Number(form.categoryId),
          amount: form.amount,
          occurredOn: form.occurredOn,
          note: form.note,
        };
        if (editingId) {
          await actionUpdateFinanceEntry(editingId, payload);
          toast.success("Lançamento atualizado");
        } else {
          await actionCreateFinanceEntry(payload);
          toast.success("Lançamento criado");
        }
        setEditingId(null);
        setForm((f) => ({ ...emptyForm(), kind: f.kind, categoryId: f.categoryId }));
        await reloadPeriodData();
      }
    );
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      kind: entry.category?.kind || "expense",
      categoryId: String(entry.category_id),
      amount: (entry.amount_cents / 100).toFixed(2).replace(".", ","),
      occurredOn: entry.occurred_on,
      note: entry.note || "",
    });
  };

  const handleDelete = (entryId) =>
    withBusy("Apagando…", async () => {
      await actionDeleteFinanceEntry(entryId);
      if (editingId === entryId) {
        setEditingId(null);
        setForm(emptyForm());
      }
      toast.success("Lançamento removido");
      await reloadPeriodData();
    });

  const handleCreateCategory = (e) => {
    e.preventDefault();
    return withBusy("Criando categoria…", async () => {
      const row = await actionCreateFinanceCategory({
        name: catName,
        kind: catKind,
      });
      setCatName("");
      toast.success("Categoria criada");
      const cats = await loadCategories();
      if (row?.kind === form.kind) {
        setForm((f) => ({ ...f, categoryId: String(row.id) }));
      }
      return cats;
    });
  };

  const handleArchiveCategory = (categoryId) =>
    withBusy("Arquivando…", async () => {
      await actionArchiveFinanceCategory(categoryId);
      toast.success("Categoria arquivada");
      await loadCategories();
    });

  const maxBar = Math.max(
    1,
    ...((chart?.buckets || []).flatMap((b) => [
      b.income_cents,
      b.expense_cents,
    ]) || [1])
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <BusyRail active={Boolean(rail)} label={rail} />

      <header data-tour="tour-finance-header" className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Organização
        </p>
        <h1 className="font-display text-3xl text-ash-200">Finanças</h1>
        <p className="text-sm text-ash-400">
          Lançamentos por categoria e visão do período — sem pressão.
        </p>
      </header>

      {loading && !chart ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <section
            data-tour="tour-finance-summary"
            className="grid grid-cols-3 gap-2"
          >
            <div className="panel p-3 text-center sm:p-4">
              <p className="text-[10px] uppercase tracking-wider text-ash-500">
                Entradas
              </p>
              <p className="mt-1 font-display text-sm text-ash-200 sm:text-base">
                {formatBrl(chart?.income_cents)}
              </p>
            </div>
            <div className="panel p-3 text-center sm:p-4">
              <p className="text-[10px] uppercase tracking-wider text-ash-500">
                Saídas
              </p>
              <p className="mt-1 font-display text-sm text-ash-200 sm:text-base">
                {formatBrl(chart?.expense_cents)}
              </p>
            </div>
            <div className="panel p-3 text-center sm:p-4">
              <p className="text-[10px] uppercase tracking-wider text-ash-500">
                Saldo
              </p>
              <p
                className={`mt-1 font-display text-sm sm:text-base ${
                  (chart?.balance_cents || 0) >= 0
                    ? "text-copper-bright"
                    : "text-ember-soft"
                }`}
              >
                {formatBrl(chart?.balance_cents)}
              </p>
            </div>
          </section>

          <section data-tour="tour-finance-chart" className="panel space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
                Gráfico
              </h2>
              {chart?.from && chart?.to ? (
                <p className="text-[11px] tabular-nums text-ash-500">
                  {chart.from} → {chart.to}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    period === p.id
                      ? "border-copper/50 bg-copper/15 text-copper-bright"
                      : "border-copper/15 text-ash-400 hover:border-copper/35"
                  }`}
                  onClick={() => setPeriod(p.id)}
                  disabled={busy}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {period === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs text-ash-400">De</span>
                  <input
                    type="date"
                    className="input-field"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-ash-400">Até</span>
                  <input
                    type="date"
                    className="input-field"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {!chart?.buckets?.length ? (
              <p className="text-sm text-ash-500">
                {period === "custom" && (!customFrom || !customTo)
                  ? "Escolha as datas do intervalo."
                  : "Sem movimentos neste período."}
              </p>
            ) : (
              <ul className="space-y-3">
                {chart.buckets.map((b) => (
                  <li key={b.key} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-ash-500">
                      <span>{b.label}</span>
                      <span className="tabular-nums">
                        +{formatBrl(b.income_cents)} · −
                        {formatBrl(b.expense_cents)}
                      </span>
                    </div>
                    <div className="flex h-2 gap-1">
                      <div className="h-full flex-1 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-copper/80"
                          style={{
                            width: `${Math.round(
                              (b.income_cents / maxBar) * 100
                            )}%`,
                          }}
                          title="Entradas"
                        />
                      </div>
                      <div className="h-full flex-1 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-ember/70"
                          style={{
                            width: `${Math.round(
                              (b.expense_cents / maxBar) * 100
                            )}%`,
                          }}
                          title="Saídas"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-ash-500">
              Barras: copper = entradas · ember = saídas
            </p>
          </section>

          <section data-tour="tour-finance-form" className="panel space-y-4 p-5">
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              {editingId ? "Editar lançamento" : "Novo lançamento"}
            </h2>
            <form onSubmit={handleSubmitEntry} className="space-y-3">
              <div className="flex gap-1 rounded-xl border border-copper/15 bg-ink-950/50 p-1">
                {[
                  { id: "expense", label: "Saída" },
                  { id: "income", label: "Entrada" },
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                      form.kind === k.id
                        ? "bg-copper/20 text-copper-bright"
                        : "text-ash-400 hover:text-ash-300"
                    }`}
                    onClick={() => setForm((f) => ({ ...f, kind: k.id }))}
                    disabled={busy}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs text-ash-400">Valor</span>
                  <input
                    className="input-field"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-ash-400">Data</span>
                  <input
                    type="date"
                    className="input-field"
                    value={form.occurredOn}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, occurredOn: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs text-ash-400">Categoria</span>
                <select
                  className="input-field"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  required
                >
                  {categoriesForKind.length === 0 ? (
                    <option value="">Nenhuma categoria</option>
                  ) : (
                    categoriesForKind.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs text-ash-400">Nota (opcional)</span>
                <input
                  className="input-field"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  maxLength={280}
                  placeholder="Ex.: mercado da semana"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || !form.categoryId}
                >
                  {busy ? (
                    <>
                      <Spinner />
                      Salvando…
                    </>
                  ) : editingId ? (
                    "Salvar alterações"
                  ) : (
                    "Registrar"
                  )}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm());
                    }}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section data-tour="tour-finance-list" className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Lançamentos do período
            </h2>
            {!entries.length ? (
              <div className="panel p-5">
                <EmptyState
                  compact
                  title="Nenhum lançamento"
                  hint="Registre uma entrada ou saída acima para começar a ver o gráfico."
                />
              </div>
            ) : (
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="panel flex flex-wrap items-start justify-between gap-3 p-4"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-ash-200">
                        {entry.category?.name || "—"}
                      </p>
                      <p className="text-xs text-ash-500">
                        {entry.occurred_on}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-display text-lg tabular-nums ${
                          entry.category?.kind === "income"
                            ? "text-copper-bright"
                            : "text-ember-soft"
                        }`}
                      >
                        {entry.category?.kind === "income" ? "+" : "−"}
                        {formatBrl(entry.amount_cents)}
                      </span>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-xs"
                        disabled={busy}
                        onClick={() => startEdit(entry)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-xs text-ember-soft"
                        disabled={busy}
                        onClick={() => handleDelete(entry.id)}
                      >
                        Apagar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {hasMore ? (
              <button
                type="button"
                className="btn-ghost w-full"
                disabled={busy}
                onClick={() =>
                  withBusy("Carregando…", () =>
                    loadEntries(offset + PAGE_SIZE, true)
                  )
                }
              >
                Carregar mais
              </button>
            ) : null}
          </section>

          <section data-tour="tour-finance-categories" className="panel space-y-4 p-5">
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Categorias
            </h2>
            <form
              onSubmit={handleCreateCategory}
              className="flex flex-wrap items-end gap-2"
            >
              <label className="min-w-[8rem] flex-1 space-y-1.5">
                <span className="text-xs text-ash-400">Nova</span>
                <input
                  className="input-field"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Nome"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-ash-400">Tipo</span>
                <select
                  className="input-field"
                  value={catKind}
                  onChange={(e) => setCatKind(e.target.value)}
                >
                  <option value="expense">Saída</option>
                  <option value="income">Entrada</option>
                </select>
              </label>
              <button type="submit" className="btn-primary" disabled={busy}>
                Adicionar
              </button>
            </form>
            <ul className="divide-y divide-copper/10">
              {categories
                .filter((c) => !c.archived_at)
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="text-ash-200">
                      {c.name}{" "}
                      <span className="text-xs text-ash-500">
                        · {c.kind === "income" ? "entrada" : "saída"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-xs text-ash-500 hover:text-ember-soft"
                      disabled={busy}
                      onClick={() => handleArchiveCategory(c.id)}
                    >
                      Arquivar
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
