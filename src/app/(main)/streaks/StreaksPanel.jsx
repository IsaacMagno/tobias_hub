"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import EmptyState from "@/components/EmptyState";
import StreakIconPicker from "@/components/streaks/StreakIconPicker";
import { StreakIconBadge } from "@/components/streaks/StreakIcon";
import StreakCalendar from "@/components/streaks/StreakCalendar";
import { DEFAULT_STREAK_ICON } from "@/lib/helpers/habitStreakIcons";
import {
  fetchMyStreaks,
  fetchCampaignsDetailed,
  actionCreateHabitStreak,
  actionUpdateHabitStreak,
  actionDeleteHabitStreak,
  actionMarkHabitStreakToday,
  actionUnmarkHabitStreakToday,
  actionSetHabitStreakCampaigns,
} from "../../services/requests";

function kindLabel(kind) {
  return kind === "break" ? "Evitar" : "Hábito";
}

function kindBadgeClass(kind) {
  return kind === "break"
    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
    : "border-copper/30 bg-copper/10 text-copper";
}

function motivationalLine(streak) {
  const n = streak.current_streak || 0;
  if (n < 3) return null;
  if (streak.kind === "break") {
    return `${n} dias limpos — não quebre agora.`;
  }
  return `${n} dias em sequência — não quebre agora.`;
}

function emptyForm() {
  return {
    title: "",
    kind: "build",
    icon: DEFAULT_STREAK_ICON,
    campaignIds: [],
  };
}

function StreakForm({ form, campaigns, onChange, onSubmit, onCancel, submitLabel }) {
  const toggleCampaign = (id) => {
    const cid = Number(id);
    onChange({
      ...form,
      campaignIds: form.campaignIds.includes(cid)
        ? form.campaignIds.filter((x) => x !== cid)
        : [...form.campaignIds, cid],
    });
  };

  return (
    <form
      className="panel space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-xs text-ash-400">Nome</span>
        <input
          className="input-field"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Ex.: Leitura, Corrida, Sem junk food"
          required
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-xs text-ash-400">Ícone</span>
        <StreakIconPicker
          value={form.icon}
          onChange={(icon) => onChange({ ...form, icon })}
        />
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-ash-400">Tipo</span>
        <select
          className="input-field"
          value={form.kind}
          onChange={(e) => onChange({ ...form, kind: e.target.value })}
        >
          <option value="build">Hábito positivo — marco quando fiz</option>
          <option value="break">Evitar — marco quando não fiz o hábito ruim</option>
        </select>
      </label>

      {campaigns.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-ash-400">
            Campanhas ligadas (marca automaticamente ao concluir sessão)
          </p>
          <ul className="space-y-1.5">
            {campaigns.map((c) => {
              const checked = form.campaignIds.includes(Number(c.id));
              return (
                <li key={c.id}>
                  <label className="flex items-center gap-2 text-sm text-ash-300">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCampaign(c.id)}
                      className="rounded border-copper/30"
                    />
                    {c.title}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default function StreaksPanel() {
  const [streaks, setStreaks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [busy, setBusy] = useState(true);
  const [rail, setRail] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [items, camps] = await Promise.all([
        fetchMyStreaks(),
        fetchCampaignsDetailed("active"),
      ]);
      setStreaks(items || []);
      setCampaigns(camps || []);
    } catch (err) {
      toast.error(err.message || "Falha ao carregar sequências");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedStreaks = useMemo(
    () =>
      [...streaks].sort(
        (a, b) =>
          (b.current_streak || 0) - (a.current_streak || 0) ||
          String(b.updated_at).localeCompare(String(a.updated_at))
      ),
    [streaks]
  );

  const replaceStreak = (updated) => {
    setStreaks((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  };

  const handleCreate = async () => {
    setRail("Criando…");
    try {
      const row = await actionCreateHabitStreak({
        title: createForm.title,
        kind: createForm.kind,
        emoji: createForm.icon || DEFAULT_STREAK_ICON,
      });
      if (createForm.campaignIds.length) {
        const linked = await actionSetHabitStreakCampaigns(
          row.id,
          createForm.campaignIds
        );
        replaceStreak(linked);
      } else {
        replaceStreak(row);
      }
      setCreateForm(emptyForm());
      setShowCreate(false);
      toast.success("Sequência criada");
    } catch (err) {
      toast.error(err.message || "Falha ao criar");
    } finally {
      setRail("");
    }
  };

  const startEdit = (streak) => {
    setEditingId(streak.id);
    setEditForm({
      title: streak.title,
      kind: streak.kind,
      icon: streak.emoji || DEFAULT_STREAK_ICON,
      campaignIds: streak.campaignIds || [],
    });
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setRail("Salvando…");
    try {
      await actionUpdateHabitStreak(editingId, {
        title: editForm.title,
        kind: editForm.kind,
        emoji: editForm.icon || DEFAULT_STREAK_ICON,
      });
      const linked = await actionSetHabitStreakCampaigns(
        editingId,
        editForm.campaignIds
      );
      replaceStreak(linked);
      setEditingId(null);
      toast.success("Sequência atualizada");
    } catch (err) {
      toast.error(err.message || "Falha ao salvar");
    } finally {
      setRail("");
    }
  };

  const handleDelete = async (streakId) => {
    if (!window.confirm("Remover esta sequência e todo o histórico?")) return;
    setRail("Removendo…");
    try {
      await actionDeleteHabitStreak(streakId);
      setStreaks((prev) => prev.filter((s) => s.id !== streakId));
      if (editingId === streakId) setEditingId(null);
      toast.success("Sequência removida");
    } catch (err) {
      toast.error(err.message || "Falha ao remover");
    } finally {
      setRail("");
    }
  };

  const handleMark = async (streakId) => {
    setRail("Marcando…");
    try {
      const row = await actionMarkHabitStreakToday(streakId);
      replaceStreak(row);
      toast.success("Dia marcado");
    } catch (err) {
      toast.error(err.message || "Falha ao marcar");
    } finally {
      setRail("");
    }
  };

  const handleUnmark = async (streakId) => {
    setRail("Desmarcando…");
    try {
      const row = await actionUnmarkHabitStreakToday(streakId);
      replaceStreak(row);
      toast.success("Marcação removida");
    } catch (err) {
      toast.error(err.message || "Falha ao desmarcar");
    } finally {
      setRail("");
    }
  };

  if (busy && streaks.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <BusyRail active={Boolean(rail)} label={rail} />

      <header data-tour="tour-streaks-header" className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Identidade
        </p>
        <h1 className="font-display text-3xl text-ash-200">Sequências</h1>
        <p className="text-sm text-ash-400">
          Marque cada dia para manter o fogo aceso nos bons hábitos e nos que
          você quer evitar.
        </p>
        <p className="text-xs leading-relaxed text-ash-500">
          Escudos cobrem 1 dia perdido sem zerar a sequência. Começa com 1;
          ganha +1 a cada 7 dias seguidos (máx. 2).
        </p>
      </header>

      <section data-tour="tour-streaks-new" className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setShowCreate(true);
            setEditingId(null);
            setCreateForm(emptyForm());
          }}
        >
          Nova sequência
        </button>
      </section>

      {showCreate && (
        <StreakForm
          form={createForm}
          campaigns={campaigns}
          onChange={setCreateForm}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          submitLabel="Criar sequência"
        />
      )}

      {editingId && (
        <StreakForm
          form={editForm}
          campaigns={campaigns}
          onChange={setEditForm}
          onSubmit={handleUpdate}
          onCancel={() => setEditingId(null)}
          submitLabel="Salvar alterações"
        />
      )}

      {sortedStreaks.length === 0 && !showCreate ? (
        <section data-tour="tour-streaks-list" className="panel p-5">
          <EmptyState
            title="Ainda sem sequências"
            hint="Crie uma para começar — por exemplo: leitura diária, corrida ou dias sem junk food."
          />
        </section>
      ) : (
        <ul data-tour="tour-streaks-list" className="space-y-4">
          {sortedStreaks.map((streak) => {
            const motiv = motivationalLine(streak);
            return (
              <li key={streak.id} className="panel space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StreakIconBadge icon={streak.emoji} />
                      <h2 className="font-display text-lg text-ash-100">
                        {streak.title}
                      </h2>
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${kindBadgeClass(
                          streak.kind
                        )}`}
                      >
                        {kindLabel(streak.kind)}
                      </span>
                    </div>
                    {streak.campaigns?.length > 0 && (
                      <p className="text-xs text-ash-500">
                        Auto:{" "}
                        {streak.campaigns.map((c) => c.title).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-4xl text-copper tabular-nums">
                      {streak.current_streak || 0}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-ash-500">
                      dias
                    </p>
                  </div>
                </div>

                <p className="text-sm text-ash-400">
                  Melhor: {streak.best_streak || 0} dias
                  {streak.last_log_date
                    ? ` · Última: ${String(streak.last_log_date).slice(0, 10)}`
                    : ""}
                </p>

                {motiv && (
                  <p className="text-sm text-copper/90">{motiv}</p>
                )}

                <StreakCalendar streak={streak} />

                <div className="flex flex-wrap gap-2">
                  {streak.markedToday ? (
                    <button
                      type="button"
                      className="btn-ghost text-sm"
                      onClick={() => handleUnmark(streak.id)}
                    >
                      Desmarcar hoje
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      onClick={() => handleMark(streak.id)}
                    >
                      {streak.kind === "break"
                        ? "Marquei: evitei hoje"
                        : "Marcar hoje"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => startEdit(streak)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm text-rose-400/80"
                    onClick={() => handleDelete(streak.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
