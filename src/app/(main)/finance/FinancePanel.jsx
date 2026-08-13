"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  actionSetFinanceEntryPaid,
  actionDeleteFinanceEntry,
  fetchFinanceChart,
} from "../../services/requests";

const TABS = [
  { id: "resumo", label: "Início" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "graficos", label: "Gráficos" },
  { id: "categorias", label: "Categorias" },
];

const PERIODS = [
  { id: "month", label: "Mensal" },
  { id: "quarter", label: "Trimestral" },
  { id: "semester", label: "Semestral" },
  { id: "year", label: "Anual" },
  { id: "custom", label: "Personalizado" },
];

const CHART_TYPES = [
  { id: "pie", label: "Pizza" },
  { id: "bars", label: "Barras" },
  { id: "compare", label: "Comparativo" },
  { id: "balance", label: "Saldo" },
];

const MONTH_FETCH_LIMIT = 500;
const LIST_PAGE_SIZE = 10;

const PIE_COLORS = [
  "#c4a574",
  "#b54a2e",
  "#d4785c",
  "#e0c896",
  "#8a7349",
  "#9a9188",
  "#c4bbb0",
  "#3d3630",
  "#655d55",
  "#7f766d",
];

const STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "unpaid", label: "A pagar" },
  { id: "paid", label: "Pagos" },
];

const KIND_FILTERS = [
  { id: "all", label: "Tudo" },
  { id: "expense", label: "Saídas" },
  { id: "income", label: "Entradas" },
];

const SORT_OPTIONS = [
  { id: "date_desc", label: "Mais recentes" },
  { id: "date_asc", label: "Mais antigos" },
  { id: "amount_desc", label: "Maior valor" },
  { id: "amount_asc", label: "Menor valor" },
];

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

function formatDayShort(dateKey) {
  if (!dateKey) return "";
  const [, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}

/** Nota como “nome” do lançamento; sem nota, cai na categoria. */
function entryTitle(entry) {
  const note = entry?.note ? String(entry.note).trim() : "";
  if (note) return note;
  return entry?.category?.name || "Sem descrição";
}

function monthLabel({ y, m }) {
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function emptyForm() {
  return {
    kind: "expense",
    categoryId: "",
    amount: "",
    occurredOn: todayKey(),
    note: "",
    recurrence: "",
    durationKey: "default",
    customValue: "3",
    customUnit: "month",
    untilDate: "",
    alreadyPaid: false,
  };
}

const RECURRENCE_OPTIONS = [
  { id: "", label: "Não repetir" },
  { id: "daily", label: "Diariamente" },
  { id: "weekly", label: "Semanalmente" },
  { id: "monthly", label: "Mensalmente" },
  { id: "yearly", label: "Anualmente" },
];

const RECURRENCE_SHORT = {
  daily: "diário",
  weekly: "semanal",
  monthly: "mensal",
  yearly: "anual",
};

const DURATION_PRESETS = {
  daily: [
    { id: "count:3", label: "Por 3 dias" },
    { id: "count:7", label: "Por 7 dias" },
    { id: "count:14", label: "Por 14 dias" },
    { id: "count:30", label: "Por 30 dias" },
    { id: "count:90", label: "Por 90 dias" },
  ],
  weekly: [
    { id: "count:4", label: "Por 4 semanas" },
    { id: "count:8", label: "Por 8 semanas" },
    { id: "count:12", label: "Por 12 semanas" },
    { id: "count:26", label: "Por 26 semanas" },
  ],
  monthly: [
    { id: "count:3", label: "Por 3 meses" },
    { id: "count:6", label: "Por 6 meses" },
    { id: "count:12", label: "Por 12 meses" },
    { id: "count:24", label: "Por 24 meses" },
  ],
  yearly: [
    { id: "count:2", label: "Por 2 anos" },
    { id: "count:5", label: "Por 5 anos" },
    { id: "count:10", label: "Por 10 anos" },
  ],
};

const CUSTOM_UNITS = [
  { id: "day", label: "dias" },
  { id: "week", label: "semanas" },
  { id: "month", label: "meses" },
  { id: "year", label: "anos" },
];

const DEFAULT_CUSTOM_UNIT = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

function buildRecurrenceDuration(form) {
  if (!form.recurrence) return null;
  const key = form.durationKey || "default";
  if (key === "default") return { mode: "default" };
  if (key === "custom") {
    return {
      mode: "span",
      value: Number(form.customValue) || 1,
      unit: form.customUnit || "month",
    };
  }
  if (key === "until") {
    return { mode: "until", until: form.untilDate || null };
  }
  if (key.startsWith("count:")) {
    return {
      mode: "count",
      count: Number(key.slice(6)) || 1,
    };
  }
  return { mode: "default" };
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Math.round((cx + r * Math.cos(rad)) * 100) / 100,
    y: Math.round((cy + r * Math.sin(rad)) * 100) / 100,
  };
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

function FinancePie({ slices }) {
  const total = slices.reduce((s, x) => s + x.amount_cents, 0);
  if (!total) return null;

  const cx = 100;
  const cy = 100;
  const r = 90;
  let angle = 0;
  const paths = [];

  if (slices.length === 1) {
    paths.push({
      ...slices[0],
      d: null,
      color: PIE_COLORS[0],
      pct: 100,
    });
  } else {
    slices.forEach((slice, i) => {
      const sweep = (slice.amount_cents / total) * 360;
      const start = angle;
      const end = Math.min(angle + sweep, 360);
      paths.push({
        ...slice,
        d: describeSlice(cx, cy, r, start, end),
        color: PIE_COLORS[i % PIE_COLORS.length],
        pct: Math.round((slice.amount_cents / total) * 1000) / 10,
      });
      angle = end;
    });
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-48 shrink-0"
        role="img"
        aria-label="Gráfico de pizza por categoria"
      >
        {paths.map((p) =>
          p.d ? (
            <path
              key={`${p.kind}-${p.id}`}
              d={p.d}
              fill={p.color}
              stroke="#0a0908"
              strokeWidth="1.5"
            />
          ) : (
            <circle
              key={`${p.kind}-${p.id}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={p.color}
              stroke="#0a0908"
              strokeWidth="1.5"
            />
          )
        )}
      </svg>
      <ul className="w-full min-w-0 space-y-2">
        {paths.map((p) => (
          <li
            key={`leg-${p.kind}-${p.id}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-ash-200">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: p.color }}
                aria-hidden
              />
              <span className="truncate">{p.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-ash-400">
              {p.pct}% · {formatBrl(p.amount_cents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontais por categoria. */
function FinanceBars({ slices }) {
  const total = slices.reduce((s, x) => s + x.amount_cents, 0);
  if (!total) return null;
  const max = Math.max(...slices.map((s) => s.amount_cents));

  return (
    <ul className="space-y-3">
      {slices.map((slice, i) => {
        const pct = Math.round((slice.amount_cents / total) * 1000) / 10;
        const width = max > 0 ? (slice.amount_cents / max) * 100 : 0;
        const color = PIE_COLORS[i % PIE_COLORS.length];
        return (
          <li key={`${slice.kind}-${slice.id}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-ash-200">{slice.name}</span>
              <span className="shrink-0 tabular-nums text-ash-400">
                {pct}% · {formatBrl(slice.amount_cents)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-sm bg-ink-950">
              <div
                className="h-full rounded-sm transition-[width]"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Entradas × saídas ao longo do período (buckets). */
function FinanceCompare({ buckets }) {
  const rows = (buckets || []).filter(
    (b) => b.income_cents > 0 || b.expense_cents > 0
  );
  if (!rows.length) return null;
  const max = Math.max(
    ...rows.map((b) => Math.max(b.income_cents, b.expense_cents)),
    1
  );
  const chartH = 160;
  const gap = 8;
  const groupW = 28;
  const barW = 10;
  const width = Math.max(rows.length * (groupW + gap) + 24, 280);

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-[11px] text-ash-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-copper" aria-hidden />
          Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-ember-soft" aria-hidden />
          Saídas
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${chartH + 36}`}
          className="h-52 min-w-full"
          role="img"
          aria-label="Comparativo de entradas e saídas"
        >
          {rows.map((b, i) => {
            const x = 16 + i * (groupW + gap);
            const inH = (b.income_cents / max) * chartH;
            const outH = (b.expense_cents / max) * chartH;
            return (
              <g key={b.key}>
                <rect
                  x={x}
                  y={chartH - inH}
                  width={barW}
                  height={inH}
                  fill="#c4a574"
                  rx="1"
                />
                <rect
                  x={x + barW + 2}
                  y={chartH - outH}
                  width={barW}
                  height={outH}
                  fill="#b54a2e"
                  rx="1"
                />
                <text
                  x={x + groupW / 2 - 2}
                  y={chartH + 14}
                  textAnchor="middle"
                  fill="#9a9188"
                  fontSize="9"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** Saldo (entradas − saídas) por bucket. */
function FinanceBalance({ buckets }) {
  const rows = buckets || [];
  if (!rows.length) return null;
  const values = rows.map((b) => b.income_cents - b.expense_cents);
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 1);
  const chartH = 160;
  const mid = chartH / 2;
  const gap = 6;
  const barW = 14;
  const width = Math.max(rows.length * (barW + gap) + 24, 280);

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-[11px] text-ash-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-copper" aria-hidden />
          Positivo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-ember-soft" aria-hidden />
          Negativo
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${chartH + 36}`}
          className="h-52 min-w-full"
          role="img"
          aria-label="Saldo por período"
        >
          <line
            x1="8"
            x2={width - 8}
            y1={mid}
            y2={mid}
            stroke="#3d3630"
            strokeWidth="1"
          />
          {rows.map((b, i) => {
            const net = b.income_cents - b.expense_cents;
            const h = (Math.abs(net) / maxAbs) * (chartH / 2 - 4);
            const x = 16 + i * (barW + gap);
            const y = net >= 0 ? mid - h : mid;
            return (
              <g key={b.key}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  fill={net >= 0 ? "#c4a574" : "#b54a2e"}
                  rx="1"
                />
                <text
                  x={x + barW / 2}
                  y={chartH + 14}
                  textAnchor="middle"
                  fill="#9a9188"
                  fontSize="9"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-center font-display text-sm tabular-nums text-ash-200">
        Saldo do período:{" "}
        <span
          className={
            values.reduce((a, b) => a + b, 0) >= 0
              ? "text-copper-bright"
              : "text-ember-soft"
          }
        >
          {formatBrl(values.reduce((a, b) => a + b, 0))}
        </span>
      </p>
    </div>
  );
}

export default function FinancePanel() {
  const [tab, setTab] = useState("resumo");

  const [categories, setCategories] = useState([]);
  const [chart, setChart] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rail, setRail] = useState("");
  const [busy, setBusy] = useState(false);

  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [chartType, setChartType] = useState("pie");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("expense");
  const [pieKind, setPieKind] = useState("expense");

  const now = new Date();
  const [monthCursor, setMonthCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth() + 1,
  });
  const [monthEntries, setMonthEntries] = useState([]);
  const [monthLoading, setMonthLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKind, setFilterKind] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [listView, setListView] = useState("cards");
  const [listPage, setListPage] = useState(0);

  const categoriesForKind = useMemo(
    () => categories.filter((c) => c.kind === form.kind && !c.archived_at),
    [categories, form.kind]
  );

  const monthRange = useMemo(() => {
    const { y, m } = monthCursor;
    const mm = String(m).padStart(2, "0");
    const lastDay = new Date(y, m, 0).getDate();
    return {
      from: `${y}-${mm}-01`,
      to: `${y}-${mm}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [monthCursor]);

  const loadCategories = useCallback(async () => {
    const rows = await fetchFinanceCategories();
    setCategories(rows || []);
    return rows || [];
  }, []);

  const loadChart = useCallback(async () => {
    if (period === "custom" && (!customFrom || !customTo)) {
      setChart(null);
      return;
    }
    const payload =
      period === "custom"
        ? { period: "custom", from: customFrom, to: customTo }
        : { period };
    const data = await fetchFinanceChart(payload);
    setChart(data);
  }, [period, customFrom, customTo]);

  const loadMonthSummary = useCallback(async () => {
    const data = await fetchFinanceChart({ period: "month" });
    setMonthSummary(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setRail("Carregando finanças…");
      try {
        const cats = await loadCategories();
        if (cancelled) return;
        if (cats.length) {
          setForm((f) => {
            if (f.categoryId) return f;
            const firstExpense = cats.find((c) => c.kind === "expense");
            return firstExpense
              ? { ...f, categoryId: String(firstExpense.id) }
              : f;
          });
        }
        await Promise.all([loadMonthSummary(), loadChart()]);
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Falha ao carregar");
      } finally {
        setRail("");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarrega gráfico quando o período muda (pula a 1ª montagem — já coberta acima)
  const chartReady = useRef(false);
  useEffect(() => {
    if (!chartReady.current) {
      chartReady.current = true;
      return undefined;
    }
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

  // Lançamentos do mês: só busca ao abrir a aba (evita corrida com o load inicial)
  const monthFetchSeq = useRef(0);
  useEffect(() => {
    if (tab !== "lancamentos") return undefined;
    const seq = ++monthFetchSeq.current;
    const { from, to } = monthRange;
    setMonthLoading(true);
    fetchFinanceEntries({
      limit: MONTH_FETCH_LIMIT,
      offset: 0,
      from,
      to,
    })
      .then((rows) => {
        if (seq !== monthFetchSeq.current) return;
        setMonthEntries(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (seq !== monthFetchSeq.current) return;
        setMonthEntries([]);
        toast.error(err?.message || "Falha nos lançamentos");
      })
      .finally(() => {
        if (seq === monthFetchSeq.current) setMonthLoading(false);
      });
    return undefined;
  }, [tab, monthRange.from, monthRange.to]);

  const loadMonthEntries = useCallback(async () => {
    const seq = ++monthFetchSeq.current;
    setMonthLoading(true);
    try {
      const rows = await fetchFinanceEntries({
        limit: MONTH_FETCH_LIMIT,
        offset: 0,
        from: monthRange.from,
        to: monthRange.to,
      });
      if (seq !== monthFetchSeq.current) return;
      setMonthEntries(Array.isArray(rows) ? rows : []);
    } catch (err) {
      if (seq !== monthFetchSeq.current) return;
      setMonthEntries([]);
      toast.error(err?.message || "Falha nos lançamentos");
    } finally {
      if (seq === monthFetchSeq.current) setMonthLoading(false);
    }
  }, [monthRange.from, monthRange.to]);

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

  const reloadData = async () => {
    await Promise.all([loadMonthSummary(), loadChart(), loadMonthEntries()]);
  };

  const shiftMonth = (delta) => {
    setMonthCursor(({ y, m }) => {
      const d = new Date(y, m - 1 + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
  };

  const handleSubmitEntry = (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("Escolha uma categoria");
      return;
    }
    if (
      !editingId &&
      form.recurrence &&
      form.durationKey === "until" &&
      !form.untilDate
    ) {
      toast.error("Escolha até quando repetir");
      return;
    }
    if (
      !editingId &&
      form.recurrence &&
      form.durationKey === "custom" &&
      !(Number(form.customValue) > 0)
    ) {
      toast.error("Informe a duração personalizada");
      return;
    }
    return withBusy(editingId ? "Salvando…" : "Registrando…", async () => {
      const payload = {
        categoryId: Number(form.categoryId),
        amount: form.amount,
        occurredOn: form.occurredOn,
        note: form.note,
        recurrence: editingId ? null : form.recurrence || null,
        recurrenceDuration: editingId ? null : buildRecurrenceDuration(form),
        paid:
          !editingId && form.kind === "expense"
            ? Boolean(form.alreadyPaid)
            : false,
      };
      if (editingId) {
        await actionUpdateFinanceEntry(editingId, payload);
        toast.success("Lançamento atualizado");
      } else {
        const created = await actionCreateFinanceEntry(payload);
        const n = created?.created_count || 1;
        toast.success(
          n > 1 ? `Série criada · ${n} lançamentos` : "Lançamento criado"
        );
      }
      setEditingId(null);
      setForm((f) => ({
        ...emptyForm(),
        kind: f.kind,
        categoryId: f.categoryId,
      }));
      await reloadData();
    });
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      ...emptyForm(),
      kind: entry.category?.kind || "expense",
      categoryId: String(entry.category_id),
      amount: (entry.amount_cents / 100).toFixed(2).replace(".", ","),
      occurredOn: entry.occurred_on,
      note: entry.note || "",
      recurrence: "",
    });
    setTab("resumo");
  };

  const handleTogglePaid = (entry) => {
    if (entry.category?.kind === "income") return;
    return withBusy(
      entry.paid_at ? "Desmarcando…" : "Marcando como pago…",
      async () => {
        const updated = await actionSetFinanceEntryPaid(
          entry.id,
          !entry.paid_at
        );
        setMonthEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      }
    );
  };

  const handleDelete = (entryId, { deleteSeries = false } = {}) =>
    withBusy(deleteSeries ? "Apagando série…" : "Apagando…", async () => {
      await actionDeleteFinanceEntry(entryId, { deleteSeries });
      if (editingId === entryId) {
        setEditingId(null);
        setForm(emptyForm());
      }
      toast.success(
        deleteSeries ? "Série removida daqui em diante" : "Lançamento removido"
      );
      await reloadData();
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

  const pieSlices = useMemo(
    () => (chart?.by_category || []).filter((c) => c.kind === pieKind),
    [chart?.by_category, pieKind]
  );

  const monthCategoryOptions = useMemo(() => {
    const seen = new Map();
    for (const e of monthEntries) {
      if (e.category && !seen.has(e.category.id)) {
        seen.set(e.category.id, e.category);
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [monthEntries]);

  const filteredEntries = useMemo(() => {
    let rows = monthEntries;
    // Status de pagamento só vale para saídas
    if (filterStatus === "paid") {
      rows = rows.filter(
        (e) => e.category?.kind === "expense" && e.paid_at
      );
    } else if (filterStatus === "unpaid") {
      rows = rows.filter(
        (e) => e.category?.kind === "expense" && !e.paid_at
      );
    }
    if (filterKind !== "all") {
      rows = rows.filter((e) => e.category?.kind === filterKind);
    }
    if (filterCategory !== "all") {
      rows = rows.filter((e) => String(e.category_id) === filterCategory);
    }
    const sorted = [...rows];
    if (sortBy === "amount_desc") {
      sorted.sort((a, b) => b.amount_cents - a.amount_cents);
    } else if (sortBy === "amount_asc") {
      sorted.sort((a, b) => a.amount_cents - b.amount_cents);
    } else if (sortBy === "date_asc") {
      sorted.sort(
        (a, b) => a.occurred_on.localeCompare(b.occurred_on) || a.id - b.id
      );
    } else {
      sorted.sort(
        (a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id - a.id
      );
    }
    return sorted;
  }, [monthEntries, filterStatus, filterKind, filterCategory, sortBy]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let expensePaid = 0;
    let expenseUnpaid = 0;
    let expensePaidCount = 0;
    let expenseUnpaidCount = 0;
    let expenseCount = 0;
    for (const e of filteredEntries) {
      if (e.category?.kind === "income") {
        income += e.amount_cents;
      } else {
        expense += e.amount_cents;
        expenseCount += 1;
        if (e.paid_at) {
          expensePaid += e.amount_cents;
          expensePaidCount += 1;
        } else {
          expenseUnpaid += e.amount_cents;
          expenseUnpaidCount += 1;
        }
      }
    }
    return {
      income,
      expense,
      expenseCount,
      expensePaid,
      expenseUnpaid,
      expensePaidCount,
      expenseUnpaidCount,
    };
  }, [filteredEntries]);

  const listPageCount = Math.max(
    1,
    Math.ceil(filteredEntries.length / LIST_PAGE_SIZE) || 1
  );
  const safeListPage = Math.min(listPage, listPageCount - 1);
  const pagedEntries = useMemo(() => {
    const start = safeListPage * LIST_PAGE_SIZE;
    return filteredEntries.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredEntries, safeListPage]);

  useEffect(() => {
    setListPage(0);
  }, [
    filterStatus,
    filterKind,
    filterCategory,
    sortBy,
    monthRange.from,
    monthRange.to,
    listView,
  ]);

  const hasActiveFilters =
    filterStatus !== "all" || filterKind !== "all" || filterCategory !== "all";

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <BusyRail active={Boolean(rail)} label={rail} />

      <header data-tour="tour-finance-header" className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Organização
        </p>
        <h1 className="font-display text-3xl text-ash-200">Finanças</h1>
        <p className="text-sm text-ash-400">
          Lançamentos por categoria e visão do período.
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-copper/15 bg-ink-950/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`shrink-0 flex-1 rounded-lg px-2.5 py-2 text-sm transition sm:px-3 ${
              tab === t.id
                ? "bg-copper/20 text-copper-bright"
                : "text-ash-400 hover:text-ash-300"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !monthSummary ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {!loading || monthSummary || chart ? (
        <>
          {tab === "resumo" ? (
            <>
              <section data-tour="tour-finance-summary" className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="panel p-3 text-center sm:p-4">
                    <p className="text-[10px] uppercase tracking-wider text-ash-500">
                      Entradas
                    </p>
                    <p className="mt-1 font-display text-sm text-ash-200 sm:text-base">
                      {formatBrl(monthSummary?.income_cents)}
                    </p>
                  </div>
                  <div className="panel p-3 text-center sm:p-4">
                    <p className="text-[10px] uppercase tracking-wider text-ash-500">
                      Saídas
                    </p>
                    <p className="mt-1 font-display text-sm text-ash-200 sm:text-base">
                      {formatBrl(monthSummary?.expense_cents)}
                    </p>
                  </div>
                  <div className="panel p-3 text-center sm:p-4">
                    <p className="text-[10px] uppercase tracking-wider text-ash-500">
                      Saldo
                    </p>
                    <p
                      className={`mt-1 font-display text-sm sm:text-base ${
                        (monthSummary?.balance_cents || 0) >= 0
                          ? "text-copper-bright"
                          : "text-ember-soft"
                      }`}
                    >
                      {formatBrl(monthSummary?.balance_cents)}
                    </p>
                  </div>
                </div>
                {monthSummary?.from && monthSummary?.to ? (
                  <p className="text-[11px] tabular-nums text-ash-500">
                    Mês atual · {monthSummary.from} → {monthSummary.to}
                  </p>
                ) : null}
              </section>

              <section
                data-tour="tour-finance-form"
                className="panel space-y-4 p-5"
              >
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
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            kind: k.id,
                            alreadyPaid:
                              k.id === "expense" ? f.alreadyPaid : false,
                          }))
                        }
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

                  {!editingId && form.kind === "expense" ? (
                    <div className="space-y-1.5">
                      <span className="text-xs text-ash-400">Situação</span>
                      <div className="flex gap-1 rounded-xl border border-copper/15 bg-ink-950/50 p-1">
                        {[
                          { id: false, label: "A pagar" },
                          { id: true, label: "Já pago" },
                        ].map((opt) => (
                          <button
                            key={String(opt.id)}
                            type="button"
                            className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                              Boolean(form.alreadyPaid) === opt.id
                                ? "bg-copper/20 text-copper-bright"
                                : "text-ash-400 hover:text-ash-300"
                            }`}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                alreadyPaid: opt.id,
                              }))
                            }
                            disabled={busy}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <span className="block text-[11px] text-ash-500">
                        Conta futura (luz, aluguel) → A pagar. Mercado ou compra
                        que você já quitou → Já pago. Na lista, o ✓ também
                        marca/desmarca depois.
                      </span>
                    </div>
                  ) : null}

                  {!editingId ? (
                    <>
                      <label className="block space-y-1.5">
                        <span className="text-xs text-ash-400">Recorrência</span>
                        <select
                          className="input-field"
                          value={form.recurrence}
                          onChange={(e) => {
                            const recurrence = e.target.value;
                            setForm((f) => ({
                              ...f,
                              recurrence,
                              durationKey: "default",
                              customUnit:
                                DEFAULT_CUSTOM_UNIT[recurrence] || f.customUnit,
                              customValue: recurrence === "daily" ? "7" : "3",
                              untilDate: "",
                            }));
                          }}
                        >
                          {RECURRENCE_OPTIONS.map((o) => (
                            <option key={o.id || "none"} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {form.recurrence ? (
                        <div className="space-y-1.5">
                          <label className="block space-y-1.5">
                            <span className="text-xs text-ash-400">Duração</span>
                            <select
                              className="input-field"
                              value={form.durationKey}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  durationKey: e.target.value,
                                }))
                              }
                            >
                              <option value="default">
                                Padrão (~1 ano
                                {form.recurrence === "yearly"
                                  ? " · anual: 5 anos"
                                  : ""}
                                )
                              </option>
                              {(DURATION_PRESETS[form.recurrence] || []).map(
                                (p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.label}
                                  </option>
                                )
                              )}
                              <option value="custom">Personalizada…</option>
                              <option value="until">Até uma data…</option>
                            </select>
                          </label>

                          {form.durationKey === "custom" ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={1}
                                max={800}
                                className="input-field w-24"
                                value={form.customValue}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    customValue: e.target.value,
                                  }))
                                }
                                aria-label="Quantidade"
                              />
                              <select
                                className="input-field flex-1"
                                value={form.customUnit}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    customUnit: e.target.value,
                                  }))
                                }
                                aria-label="Unidade"
                              >
                                {CUSTOM_UNITS.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {form.durationKey === "until" ? (
                            <input
                              type="date"
                              className="input-field"
                              value={form.untilDate}
                              min={form.occurredOn}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  untilDate: e.target.value,
                                }))
                              }
                              required
                            />
                          ) : null}

                          <span className="block text-[11px] text-ash-500">
                            {form.durationKey === "custom"
                              ? "Repete nessa frequência até completar o período."
                              : form.durationKey === "until"
                                ? "Inclui lançamentos até a data escolhida."
                                : form.durationKey.startsWith("count:")
                                  ? "Gera exatamente esse número de lançamentos."
                                  : "Sem duração definida, usa o horizonte padrão."}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : null}

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
            </>
          ) : null}

          {tab === "graficos" ? (
            <section data-tour="tour-finance-chart" className="space-y-4">
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

              {chart?.from && chart?.to ? (
                <p className="text-[11px] tabular-nums text-ash-500">
                  {chart.from} → {chart.to}
                </p>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
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
              </div>

              <div className="panel space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1 rounded-xl border border-copper/15 bg-ink-950/50 p-1">
                    {CHART_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`rounded-lg px-2.5 py-1.5 text-xs transition sm:px-3 ${
                          chartType === t.id
                            ? "bg-copper/20 text-copper-bright"
                            : "text-ash-400 hover:text-ash-300"
                        }`}
                        onClick={() => setChartType(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {chartType === "pie" || chartType === "bars" ? (
                    <div className="flex gap-1 rounded-xl border border-copper/15 bg-ink-950/50 p-1">
                      {[
                        { id: "expense", label: "Saídas" },
                        { id: "income", label: "Entradas" },
                      ].map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          className={`rounded-lg px-3 py-1.5 text-xs transition ${
                            pieKind === k.id
                              ? "bg-copper/20 text-copper-bright"
                              : "text-ash-400 hover:text-ash-300"
                          }`}
                          onClick={() => setPieKind(k.id)}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {period === "custom" && (!customFrom || !customTo) ? (
                  <p className="text-sm text-ash-500">
                    Escolha as datas do intervalo.
                  </p>
                ) : chartType === "compare" ? (
                  chart?.buckets?.some(
                    (b) => b.income_cents > 0 || b.expense_cents > 0
                  ) ? (
                    <FinanceCompare buckets={chart.buckets} />
                  ) : (
                    <p className="text-sm text-ash-500">
                      Sem lançamentos neste período para comparar.
                    </p>
                  )
                ) : chartType === "balance" ? (
                  chart?.buckets?.length ? (
                    <FinanceBalance buckets={chart.buckets} />
                  ) : (
                    <p className="text-sm text-ash-500">
                      Sem dados de saldo neste período.
                    </p>
                  )
                ) : !pieSlices.length ? (
                  <p className="text-sm text-ash-500">
                    {pieKind === "expense"
                      ? "Sem saídas neste período."
                      : "Sem entradas neste período."}
                  </p>
                ) : chartType === "bars" ? (
                  <FinanceBars slices={pieSlices} />
                ) : (
                  <FinancePie slices={pieSlices} />
                )}
              </div>
            </section>
          ) : null}

          {tab === "lancamentos" ? (
            <section data-tour="tour-finance-list" className="space-y-4">
              <div className="panel flex items-center justify-between gap-2 p-3">
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-lg leading-none"
                  onClick={() => shiftMonth(-1)}
                  disabled={busy || monthLoading}
                  aria-label="Mês anterior"
                >
                  ‹
                </button>
                <p className="font-display text-base text-ash-200">
                  {monthLabel(monthCursor)}
                </p>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-lg leading-none"
                  onClick={() => shiftMonth(1)}
                  disabled={busy || monthLoading}
                  aria-label="Próximo mês"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-[11px] text-ash-500">Status</span>
                  <select
                    className="input-field"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    {STATUS_FILTERS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-ash-500">Tipo</span>
                  <select
                    className="input-field"
                    value={filterKind}
                    onChange={(e) => setFilterKind(e.target.value)}
                  >
                    {KIND_FILTERS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-ash-500">Categoria</span>
                  <select
                    className="input-field"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">Todas</option>
                    {monthCategoryOptions.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-ash-500">Ordenar</span>
                  <select
                    className="input-field"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-2">
                {filteredEntries.length ? (
                  <div className="space-y-0.5 text-[11px] tabular-nums text-ash-500">
                    <p>
                      {filteredEntries.length}{" "}
                      {filteredEntries.length === 1
                        ? "lançamento"
                        : "lançamentos"}
                      {filteredTotals.expense
                        ? ` · Saídas ${formatBrl(filteredTotals.expense)}`
                        : ""}
                      {filteredTotals.income
                        ? ` · Entradas ${formatBrl(filteredTotals.income)}`
                        : ""}
                    </p>
                    {filteredTotals.expenseCount > 0 ? (
                      <p>
                        {filteredTotals.expensePaidCount}{" "}
                        {filteredTotals.expensePaidCount === 1
                          ? "pago"
                          : "pagos"}{" "}
                        {formatBrl(filteredTotals.expensePaid)}
                        {filteredTotals.expenseUnpaidCount > 0
                          ? ` · ${filteredTotals.expenseUnpaidCount} a pagar ${formatBrl(filteredTotals.expenseUnpaid)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <span />
                )}
                <div className="flex gap-1 rounded-xl border border-copper/15 bg-ink-950/50 p-1">
                  {[
                    { id: "cards", label: "Lista" },
                    { id: "table", label: "Tabela" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`rounded-lg px-3 py-1.5 text-xs transition ${
                        listView === v.id
                          ? "bg-copper/20 text-copper-bright"
                          : "text-ash-400 hover:text-ash-300"
                      }`}
                      onClick={() => setListView(v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {monthLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner className="h-6 w-6 text-copper" />
                </div>
              ) : !filteredEntries.length ? (
                <div className="panel p-5">
                  <EmptyState
                    compact
                    title={
                      hasActiveFilters
                        ? "Nada com esses filtros"
                        : "Nenhum lançamento neste mês"
                    }
                    hint={
                      hasActiveFilters
                        ? "Ajuste os filtros acima para ver outros lançamentos."
                        : "Registre uma entrada ou saída na aba Início."
                    }
                  />
                </div>
              ) : listView === "table" ? (
                <div className="panel overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-copper/15 text-[11px] uppercase tracking-wider text-ash-500">
                        <th className="px-3 py-2.5 font-medium">Pago</th>
                        <th className="px-3 py-2.5 font-medium">Descrição</th>
                        <th className="px-3 py-2.5 font-medium">Categoria</th>
                        <th className="px-3 py-2.5 font-medium">Data</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                          Valor
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedEntries.map((entry) => {
                        const isExpense = entry.category?.kind === "expense";
                        return (
                          <tr
                            key={entry.id}
                            className={`border-b border-copper/10 last:border-0 ${
                              isExpense && entry.paid_at ? "opacity-75" : ""
                            }`}
                          >
                            <td className="px-3 py-2.5 align-middle">
                              {isExpense ? (
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition ${
                                    entry.paid_at
                                      ? "border-copper/60 bg-copper/25 text-copper-bright"
                                      : "border-copper/25 text-transparent hover:border-copper/50 hover:text-copper/40"
                                  }`}
                                  disabled={busy}
                                  onClick={() => handleTogglePaid(entry)}
                                  title={
                                    entry.paid_at
                                      ? "Pago — clique para desmarcar"
                                      : "Marcar como pago"
                                  }
                                  aria-label={
                                    entry.paid_at
                                      ? "Desmarcar pagamento"
                                      : "Marcar como pago"
                                  }
                                >
                                  ✓
                                </button>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wider text-ash-600">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="max-w-[12rem] px-3 py-2.5 align-middle">
                              <span className="font-medium text-ash-200">
                                {entryTitle(entry)}
                              </span>
                              {entry.recurrence ||
                              (isExpense && entry.paid_at) ? (
                                <span className="mt-0.5 flex flex-wrap gap-1">
                                  {entry.recurrence ? (
                                    <span className="rounded border border-copper/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-copper/90">
                                      {RECURRENCE_SHORT[entry.recurrence] ||
                                        "recorrente"}
                                    </span>
                                  ) : null}
                                  {isExpense && entry.paid_at ? (
                                    <span className="rounded border border-copper/40 bg-copper/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-copper-bright">
                                      pago
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 align-middle text-ash-400">
                              {entry.category?.name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 align-middle tabular-nums text-ash-400">
                              {formatDayShort(entry.occurred_on)}
                            </td>
                            <td
                              className={`whitespace-nowrap px-3 py-2.5 align-middle text-right font-display tabular-nums ${
                                entry.category?.kind === "income"
                                  ? "text-copper-bright"
                                  : "text-ember-soft"
                              }`}
                            >
                              {entry.category?.kind === "income" ? "+" : "−"}
                              {formatBrl(entry.amount_cents)}
                            </td>
                            <td className="px-3 py-2.5 align-middle">
                              <div className="flex flex-wrap justify-end gap-1">
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
                                {entry.series_id ? (
                                  <button
                                    type="button"
                                    className="btn-ghost px-2 py-1 text-xs text-ember-soft"
                                    disabled={busy}
                                    onClick={() =>
                                      handleDelete(entry.id, {
                                        deleteSeries: true,
                                      })
                                    }
                                    title="Remove este e os próximos da série"
                                  >
                                    Série
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="space-y-2">
                  {pagedEntries.map((entry) => {
                    const isExpense = entry.category?.kind === "expense";
                    return (
                      <li
                        key={entry.id}
                        className={`panel flex flex-wrap items-start justify-between gap-3 p-4 ${
                          isExpense && entry.paid_at ? "opacity-75" : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          {isExpense ? (
                            <button
                              type="button"
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                                entry.paid_at
                                  ? "border-copper/60 bg-copper/25 text-copper-bright"
                                  : "border-copper/25 text-transparent hover:border-copper/50 hover:text-copper/40"
                              }`}
                              disabled={busy}
                              onClick={() => handleTogglePaid(entry)}
                              title={
                                entry.paid_at
                                  ? "Pago — clique para desmarcar"
                                  : "Marcar como pago"
                              }
                              aria-label={
                                entry.paid_at
                                  ? "Desmarcar pagamento"
                                  : "Marcar como pago"
                              }
                            >
                              ✓
                            </button>
                          ) : null}
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-medium text-ash-200">
                              {entryTitle(entry)}
                              {entry.recurrence ? (
                                <span className="ml-2 rounded border border-copper/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-copper/90">
                                  {RECURRENCE_SHORT[entry.recurrence] ||
                                    "recorrente"}
                                </span>
                              ) : null}
                              {isExpense && entry.paid_at ? (
                                <span className="ml-2 rounded border border-copper/40 bg-copper/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-copper-bright">
                                  pago
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-ash-500">
                              {formatDayShort(entry.occurred_on)}
                              {entry.category?.name
                                ? ` · ${entry.category.name}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                          {entry.series_id ? (
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1 text-xs text-ember-soft"
                              disabled={busy}
                              onClick={() =>
                                handleDelete(entry.id, { deleteSeries: true })
                              }
                              title="Remove este e os próximos da série"
                            >
                              Apagar série
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!monthLoading && filteredEntries.length > LIST_PAGE_SIZE ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-sm"
                    disabled={busy || safeListPage <= 0}
                    onClick={() => setListPage((p) => Math.max(0, p - 1))}
                  >
                    Anterior
                  </button>
                  <p className="text-xs tabular-nums text-ash-500">
                    Página {safeListPage + 1} de {listPageCount}
                  </p>
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-sm"
                    disabled={busy || safeListPage >= listPageCount - 1}
                    onClick={() =>
                      setListPage((p) => Math.min(listPageCount - 1, p + 1))
                    }
                  >
                    Próxima
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === "categorias" ? (
            <section
              data-tour="tour-finance-categories"
              className="panel space-y-4 p-5"
            >
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
          ) : null}
        </>
      ) : null}
    </div>
  );
}
