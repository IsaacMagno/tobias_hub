"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import {
  actionCreateCampaign,
  actionUpdateCampaignEditor,
  actionFocusCampaign,
  fetchCampaignEditor,
  actionAddChapter,
  actionAddMission,
  actionCreateCampaignShareCode,
  fetchCampaignShareCodes,
  actionSubmitCampaignToCommunity,
  fetchCampaignCommunitySubmission,
} from "../../services/requests";
import {
  labelChapterStatus,
  labelMissionStatus,
} from "@/lib/helpers/statusLabels";

const WEEKDAYS = [
  { key: "dom", label: "Dom" },
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
];

function emptyStep() {
  return { id: null, surface: "", detail: "", planned_minutes: "" };
}

function fromEditor(data) {
  return {
    title: data.campaign.title || "",
    why: data.campaign.why || "",
    result: data.campaign.result || "",
    primaryStat: data.campaign.primary_stat || "inteligence",
    visibility: data.campaign.visibility || "private",
    missionId: data.mission.id,
    chapterId: data.chapter?.id ?? null,
    missionTitle: data.mission.title || "",
    missionWhy: data.mission.why || "",
    weekdays: data.mission.weekdays || [],
    timeOfDay: data.mission.time_of_day || "",
    plannedMinutes: data.mission.planned_minutes ?? "",
    steps: (data.steps || []).map((s) => ({
      id: s.id,
      surface: s.surface || "",
      detail: s.detail || "",
      planned_minutes: s.planned_minutes ?? "",
      status: s.status,
    })),
    chapters: data.chapters || [],
  };
}

function blankForm() {
  return {
    title: "",
    why: "",
    result: "",
    primaryStat: "inteligence",
    visibility: "private",
    missionId: null,
    chapterId: null,
    missionTitle: "Missão 1",
    missionWhy: "",
    weekdays: [],
    timeOfDay: "",
    plannedMinutes: "25",
    steps: [emptyStep(), emptyStep()],
    chapters: [],
  };
}

export default function CampaignEditorForm({
  mode,
  initial = null,
  campaignId = null,
}) {
  const router = useRouter();
  const [form, setForm] = useState(() =>
    initial ? fromEditor(initial) : blankForm()
  );
  const [busy, setBusy] = useState(false);
  const [railLabel, setRailLabel] = useState("");
  const [focusAfterCreate, setFocusAfterCreate] = useState(true);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [dependsOnPrevious, setDependsOnPrevious] = useState(true);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddMission, setShowAddMission] = useState(false);
  const [shareCodes, setShareCodes] = useState([]);
  const [shareBusy, setShareBusy] = useState(false);
  const [communitySubmission, setCommunitySubmission] = useState(null);
  const [communityBlurb, setCommunityBlurb] = useState("");
  const [communityBusy, setCommunityBusy] = useState(false);

  const canSubmit = useMemo(() => {
    const hasTitle = form.title.trim().length > 0;
    const hasMission = form.missionTitle.trim().length > 0;
    const hasStep = form.steps.some((s) => s.surface.trim().length > 0);
    return hasTitle && hasMission && hasStep;
  }, [form]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDay = (key) => {
    setForm((prev) => {
      const set = new Set(prev.weekdays);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return {
        ...prev,
        weekdays: WEEKDAYS.map((d) => d.key).filter((k) => set.has(k)),
      };
    });
  };

  const updateStep = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const addStep = () =>
    setForm((prev) => ({ ...prev, steps: [...prev.steps, emptyStep()] }));

  const removeStep = (index) => {
    setForm((prev) => {
      const step = prev.steps[index];
      if (step?.status === "done" || step?.status === "skipped") return prev;
      if (prev.steps.length <= 1) return prev;
      return { ...prev, steps: prev.steps.filter((_, i) => i !== index) };
    });
  };

  const moveStep = (index, dir) => {
    setForm((prev) => {
      const next = [...prev.steps];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return { ...prev, steps: next };
    });
  };

  const loadShareCodes = async () => {
    if (!campaignId || mode !== "edit") return;
    try {
      const codes = await fetchCampaignShareCodes(campaignId);
      setShareCodes(codes || []);
    } catch {
      /* ignore */
    }
  };

  const loadCommunitySubmission = async () => {
    if (!campaignId || mode !== "edit") return;
    try {
      const sub = await fetchCampaignCommunitySubmission(campaignId);
      setCommunitySubmission(sub);
      if (sub?.blurb) setCommunityBlurb(sub.blurb);
    } catch {
      /* ignore */
    }
  };

  const generateShareCode = async () => {
    if (!campaignId || shareBusy) return;
    setShareBusy(true);
    try {
      const created = await actionCreateCampaignShareCode(campaignId);
      setShareCodes((prev) => [created, ...prev].slice(0, 5));
      try {
        await navigator.clipboard.writeText(created.code);
        toast.success(`Código ${created.code} copiado`);
      } catch {
        toast.success(`Código: ${created.code}`);
      }
    } catch (err) {
      toast.error(err.message || "Falha ao gerar código");
    } finally {
      setShareBusy(false);
    }
  };

  const submitToCommunity = async () => {
    if (!campaignId || communityBusy) return;
    setCommunityBusy(true);
    try {
      const sub = await actionSubmitCampaignToCommunity(
        campaignId,
        communityBlurb
      );
      setCommunitySubmission(sub);
      toast.success("Enviado para revisão da Comunidade");
    } catch (err) {
      toast.error(err.message || "Falha ao enviar");
    } finally {
      setCommunityBusy(false);
    }
  };

  useEffect(() => {
    if (mode === "edit" && campaignId) {
      loadShareCodes();
      loadCommunitySubmission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, campaignId]);

  const communityStatusLabel = {
    pending: "Em revisão",
    approved: "Aprovada na Comunidade",
    rejected: "Rejeitada",
  };

  const flash = async (label, ms = 1200) => {
    setRailLabel(label);
    await new Promise((r) => setTimeout(r, ms));
    setRailLabel("");
  };

  const applyEditor = (data) => setForm(fromEditor(data));

  const selectMission = async (missionId) => {
    if (!campaignId || busy) return;
    if (Number(missionId) === Number(form.missionId)) return;
    setBusy(true);
    setRailLabel("Carregando missão…");
    try {
      const data = await fetchCampaignEditor(campaignId, missionId);
      applyEditor(data);
      setRailLabel("");
    } catch (err) {
      toast.error(err.message || "Falha ao carregar");
      setRailLabel("");
    } finally {
      setBusy(false);
    }
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    why: form.why.trim(),
    result: form.result.trim(),
    primaryStat: form.primaryStat || "inteligence",
    visibility: form.visibility === "public" ? "public" : "private",
    missionTitle: form.missionTitle.trim(),
    missionWhy: form.missionWhy.trim(),
    weekdays: form.weekdays,
    timeOfDay: form.timeOfDay.trim() || null,
    plannedMinutes: form.plannedMinutes
      ? Number(form.plannedMinutes)
      : null,
    steps: form.steps
      .filter((s) => s.surface.trim())
      .map((s, i) => ({
        id: s.id,
        surface: s.surface.trim(),
        detail: s.detail.trim() || null,
        planned_minutes: s.planned_minutes
          ? Number(s.planned_minutes)
          : null,
        order_index: i,
      })),
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setRailLabel(mode === "create" ? "Criando frente…" : "Salvando…");
    try {
      const payload = buildPayload();
      if (mode === "create") {
        const created = await actionCreateCampaign(payload);
        await flash("Frente criada");
        if (focusAfterCreate) {
          setRailLabel("Trocando frente…");
          await actionFocusCampaign(created.campaignId);
          await flash("Frente alterada");
          router.push("/");
          return;
        }
        router.push(`/campaigns/${created.campaignId}/edit`);
        return;
      }

      await actionUpdateCampaignEditor(campaignId, {
        campaign: {
          title: payload.title,
          why: payload.why,
          result: payload.result,
          primary_stat: payload.primaryStat,
          visibility: payload.visibility,
        },
        mission: {
          id: form.missionId,
          title: payload.missionTitle,
          why: payload.missionWhy,
          weekdays: payload.weekdays,
          time_of_day: payload.timeOfDay,
          planned_minutes: payload.plannedMinutes,
        },
        steps: payload.steps,
      });
      await flash("Salvo");
      router.push("/campaigns");
    } catch (err) {
      toast.error(err.message || "Falha ao salvar");
      setRailLabel("");
    } finally {
      setBusy(false);
    }
  };

  const handleAddChapter = async () => {
    if (!campaignId || !newChapterTitle.trim()) return;
    setBusy(true);
    setRailLabel("Adicionando capítulo…");
    try {
      const data = await actionAddChapter(campaignId, {
        title: newChapterTitle.trim(),
      });
      applyEditor(data);
      setNewChapterTitle("");
      setShowAddChapter(false);
      await flash("Capítulo adicionado");
    } catch (err) {
      toast.error(err.message || "Falha");
      setRailLabel("");
    } finally {
      setBusy(false);
    }
  };

  const handleAddMission = async () => {
    if (!campaignId || !form.chapterId || !newMissionTitle.trim()) return;
    setBusy(true);
    setRailLabel("Adicionando missão…");
    try {
      const data = await actionAddMission(form.chapterId, {
        title: newMissionTitle.trim(),
        dependsOnPrevious,
      });
      applyEditor(data);
      setNewMissionTitle("");
      setShowAddMission(false);
      await flash("Missão adicionada");
    } catch (err) {
      toast.error(err.message || "Falha");
      setRailLabel("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BusyRail active={Boolean(railLabel)} label={railLabel} />
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-3xl space-y-6 pb-24 lg:pb-8"
      >
        <header data-tour="tour-editor-header" className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">
            Editor
          </p>
          <h1 className="font-display text-3xl text-ash-200">
            {mode === "create" ? "Nova frente" : "Editar frente"}
          </h1>
          <Link
            href="/campaigns"
            className="inline-block text-xs text-copper/80 hover:text-copper"
          >
            ← Voltar às campanhas
          </Link>
        </header>

        {mode === "edit" && form.chapters?.length > 0 && (
          <section
            data-tour="tour-editor-structure"
            className="panel space-y-4 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
                Capítulos e missões
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  disabled={busy}
                  onClick={() => {
                    setShowAddChapter((v) => !v);
                    setShowAddMission(false);
                  }}
                >
                  + Capítulo
                </button>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  disabled={busy || !form.chapterId}
                  onClick={() => {
                    setShowAddMission((v) => !v);
                    setShowAddChapter(false);
                  }}
                >
                  + Missão
                </button>
              </div>
            </div>

            {showAddChapter && (
              <div className="flex flex-wrap gap-2">
                <input
                  className="input-field flex-1"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Título do capítulo"
                />
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={handleAddChapter}
                >
                  Criar
                </button>
              </div>
            )}

            {showAddMission && (
              <div className="space-y-2">
                <input
                  className="input-field"
                  value={newMissionTitle}
                  onChange={(e) => setNewMissionTitle(e.target.value)}
                  placeholder="Título da missão"
                />
                <label className="flex items-center gap-2 text-sm text-ash-300">
                  <input
                    type="checkbox"
                    checked={dependsOnPrevious}
                    onChange={(e) => setDependsOnPrevious(e.target.checked)}
                  />
                  Depende da missão anterior
                </label>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={handleAddMission}
                >
                  Criar missão
                </button>
              </div>
            )}

            <ul className="space-y-4">
              {form.chapters.map((ch) => (
                <li key={ch.id} className="space-y-2">
                  <p className="text-sm text-ash-300">
                    {ch.title}
                    <span className="ml-2 text-[10px] uppercase text-ash-400">
                      {labelChapterStatus(ch.status)}
                    </span>
                  </p>
                  <ul className="space-y-1 pl-2">
                    {(ch.missions || []).map((m) => {
                      const selected = Number(m.id) === Number(form.missionId);
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => selectMission(m.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                              selected
                                ? "border-copper/40 bg-copper/10 text-copper-bright"
                                : "border-copper/10 text-ash-300 hover:border-copper/30"
                            }`}
                          >
                            {m.title}
                            <span className="ml-2 text-[10px] uppercase text-ash-400">
                              {labelMissionStatus(m.status)}
                              {m.dependencies?.length ? " · dep" : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section data-tour="tour-editor-meta" className="panel space-y-4 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Campanha
          </h2>
          <label className="block space-y-1.5">
            <span className="text-xs text-ash-400">Título</span>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-ash-400">Por quê</span>
            <input
              className="input-field"
              value={form.why}
              onChange={(e) => setField("why", e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-ash-400">Resultado desejado</span>
            <input
              className="input-field"
              value={form.result}
              onChange={(e) => setField("result", e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-ash-400">Atributo primário</span>
            <select
              className="input-field"
              value={form.primaryStat}
              onChange={(e) => setField("primaryStat", e.target.value)}
            >
              <option value="strength">Força</option>
              <option value="agility">Agilidade</option>
              <option value="inteligence">Inteligência</option>
              <option value="vitality">Vitalidade</option>
            </select>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-xs text-ash-400">
              Visibilidade da campanha
            </legend>
            <p className="text-xs text-ash-500">
              Pública aparece no seu perfil em Campeões. Privada fica só com
              você.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-ash-300">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={form.visibility !== "public"}
                  onChange={() => setField("visibility", "private")}
                />
                Privada
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={form.visibility === "public"}
                  onChange={() => setField("visibility", "public")}
                />
                Pública
              </label>
            </div>
          </fieldset>
        </section>

        <section
          data-tour={
            mode === "edit" && !(form.chapters?.length > 0)
              ? "tour-editor-structure"
              : undefined
          }
          className="panel space-y-4 p-5"
        >
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Missão
          </h2>
          <label className="block space-y-1.5">
            <span className="text-xs text-ash-400">Título da missão</span>
            <input
              className="input-field"
              value={form.missionTitle}
              onChange={(e) => setField("missionTitle", e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-ash-400">Por quê (missão)</span>
            <input
              className="input-field"
              value={form.missionWhy}
              onChange={(e) => setField("missionWhy", e.target.value)}
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs text-ash-400">Dias sugeridos</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const on = form.weekdays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      on
                        ? "border-copper/50 bg-copper/15 text-copper-bright"
                        : "border-copper/15 text-ash-400 hover:border-copper/35"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs text-ash-400">Horário (opcional)</span>
              <input
                className="input-field"
                type="time"
                value={form.timeOfDay}
                onChange={(e) => setField("timeOfDay", e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-ash-400">Minutos planejados</span>
              <input
                className="input-field"
                type="number"
                min={1}
                max={240}
                value={form.plannedMinutes}
                onChange={(e) => setField("plannedMinutes", e.target.value)}
              />
            </label>
          </div>
        </section>

        <section data-tour="tour-editor-steps" className="panel space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Passos
            </h2>
            <button
              type="button"
              className="btn-ghost !px-3 !py-1.5 text-xs"
              onClick={addStep}
            >
              + Passo
            </button>
          </div>

          <ul className="space-y-4">
            {form.steps.map((step, index) => (
              <li
                key={step.id ?? `new-${index}`}
                className="space-y-2 rounded-lg border border-copper/10 bg-ink-950/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ash-400">
                    Passo {index + 1}
                    {step.status === "done" ? " · concluído" : ""}
                    {step.status === "current" ? " · atual" : ""}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === form.steps.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => removeStep(index)}
                      disabled={
                        form.steps.length <= 1 ||
                        step.status === "done" ||
                        step.status === "skipped"
                      }
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <input
                  className="input-field"
                  value={step.surface}
                  onChange={(e) =>
                    updateStep(index, { surface: e.target.value })
                  }
                  placeholder="O que fazer agora"
                  required={index === 0}
                />
                <textarea
                  className="input-field min-h-[72px] resize-y"
                  value={step.detail}
                  onChange={(e) =>
                    updateStep(index, { detail: e.target.value })
                  }
                  placeholder="Detalhe opcional"
                />
                <input
                  className="input-field max-w-[140px]"
                  type="number"
                  min={1}
                  max={240}
                  value={step.planned_minutes}
                  onChange={(e) =>
                    updateStep(index, { planned_minutes: e.target.value })
                  }
                  placeholder="Min"
                />
              </li>
            ))}
          </ul>
        </section>

        {mode === "edit" && campaignId && (
          <section data-tour="tour-editor-share" className="panel space-y-3 p-5">
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Convidar amigo
            </h2>
            <p className="text-sm text-ash-400">
              Gere um código. Quem resgatar recebe uma cópia privada desta
              campanha.
            </p>
            <button
              type="button"
              className="btn-ghost"
              disabled={shareBusy || busy}
              onClick={generateShareCode}
            >
              {shareBusy ? (
                <>
                  <Spinner />
                  Gerando…
                </>
              ) : (
                "Gerar código"
              )}
            </button>
            {shareCodes.length > 0 && (
              <ul className="space-y-1.5 text-sm text-ash-300">
                {shareCodes.map((c) => (
                  <li
                    key={c.id || c.code}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-copper/10 pb-1.5"
                  >
                    <code className="text-copper">{c.code}</code>
                    <span className="text-xs text-ash-500">
                      {c.useCount ?? 0}/{c.maxUses ?? 10} usos
                    </span>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(c.code);
                          toast.success("Copiado");
                        } catch {
                          toast.error("Não foi possível copiar");
                        }
                      }}
                    >
                      Copiar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {mode === "edit" && campaignId && (
          <section
            data-tour="tour-editor-publish"
            className="panel space-y-3 p-5"
          >
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Enviar para Comunidade
            </h2>
            <p className="text-sm text-ash-400">
              Um moderador revisa antes de aparecer no catálogo. O snapshot
              congela a árvore no momento do envio.
            </p>
            {communitySubmission?.status ? (
              <div className="space-y-2 text-sm">
                <p className="text-ash-200">
                  Status:{" "}
                  <span className="text-copper">
                    {communityStatusLabel[communitySubmission.status] ||
                      communitySubmission.status}
                  </span>
                </p>
                {communitySubmission.reviewerNote ? (
                  <p className="text-ash-500">
                    Nota: {communitySubmission.reviewerNote}
                  </p>
                ) : null}
                {communitySubmission.status === "rejected" ? (
                  <p className="text-xs text-ash-500">
                    Você pode ajustar a campanha e enviar de novo com um novo
                    resumo.
                  </p>
                ) : null}
              </div>
            ) : null}
            {(!communitySubmission ||
              communitySubmission.status === "rejected") && (
              <>
                <textarea
                  className="input-field min-h-[88px] resize-y"
                  value={communityBlurb}
                  onChange={(e) => setCommunityBlurb(e.target.value)}
                  placeholder="Resumo para a comunidade (mín. 10 caracteres)"
                  maxLength={280}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={
                    communityBusy || busy || communityBlurb.trim().length < 10
                  }
                  onClick={submitToCommunity}
                >
                  {communityBusy ? (
                    <>
                      <Spinner />
                      Enviando…
                    </>
                  ) : (
                    "Enviar para revisão"
                  )}
                </button>
              </>
            )}
          </section>
        )}

        <div data-tour="tour-editor-save" className="space-y-3">
          {mode === "create" && (
            <label className="flex items-center gap-2 text-sm text-ash-300">
              <input
                type="checkbox"
                checked={focusAfterCreate}
                onChange={(e) => setFocusAfterCreate(e.target.checked)}
              />
              Continuar nesta frente depois de criar
            </label>
          )}

          <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-wrap gap-2 bg-gradient-to-t from-ink-950 via-ink-950/90 to-transparent px-4 pb-2 pt-6 sm:static sm:mx-0 sm:bg-none sm:p-0">
            <button
              type="submit"
              className="btn-primary flex-1 sm:flex-none"
              disabled={!canSubmit || busy}
            >
              {busy ? (
                <>
                  <Spinner />
                  {mode === "create" ? "Criando…" : "Salvando…"}
                </>
              ) : mode === "create" ? (
                "Criar frente"
              ) : (
                "Salvar"
              )}
            </button>
            <Link href="/campaigns" className="btn-ghost">
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
