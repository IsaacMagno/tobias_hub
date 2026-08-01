"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import {
  fetchSuggestedCampaigns,
  actionAcceptSuggestedCampaign,
  actionRedeemCampaignShareCode,
  fetchApprovedCommunityCampaigns,
  actionAcceptCommunitySubmission,
  fetchAmICommunityModerator,
  fetchPendingCommunitySubmissions,
  actionReviewCommunitySubmission,
  fetchCommunityMilestoneBanners,
  fetchPlazaPosts,
  fetchMyPlazaCampaignOptions,
  actionCreatePlazaPost,
  fetchCommunityChallenges,
  actionJoinCommunityChallenge,
  actionCheckinCommunityChallenge,
  fetchCommunityChallengeStats,
  fetchMyClans,
  fetchClanProtocolOptions,
  actionCreateClan,
  actionJoinClanByCode,
  actionClanCheckin,
} from "../../services/requests";

const SUGGESTIONS_PER_PAGE = 5;

const DIFFICULTY_LABEL = {
  easy: "Leve",
  medium: "Média",
  hard: "Pesada",
};

const COMMUNITY_TABS = [
  { id: "suggestions", label: "Campanhas sugeridas" },
  { id: "challenges", label: "Desafios" },
  { id: "plaza", label: "Praça" },
  { id: "clans", label: "Clãs" },
];

export default function CommunityPanel() {
  const router = useRouter();
  const [tab, setTab] = useState("suggestions");
  const [catalogFilter, setCatalogFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [railLabel, setRailLabel] = useState("");
  const [page, setPage] = useState(1);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [reviewBusyId, setReviewBusyId] = useState(null);

  // Praça
  const [plazaPosts, setPlazaPosts] = useState([]);
  const [plazaBody, setPlazaBody] = useState("");
  const [plazaCampaignId, setPlazaCampaignId] = useState("");
  const [plazaOptions, setPlazaOptions] = useState([]);
  const [plazaBusy, setPlazaBusy] = useState(false);
  const [plazaLoadingMore, setPlazaLoadingMore] = useState(false);

  // Desafios
  const [challenges, setChallenges] = useState([]);
  const [challengeStats, setChallengeStats] = useState({});
  const [challengeBusy, setChallengeBusy] = useState(null);

  // Clãs
  const [clans, setClans] = useState([]);
  const [clanProtocols, setClanProtocols] = useState([]);
  const [clanName, setClanName] = useState("");
  const [clanProtocol, setClanProtocol] = useState("");
  const [clanJoinCode, setClanJoinCode] = useState("");
  const [clanBusy, setClanBusy] = useState(null);

  const loadCatalog = useCallback(async () => {
    // Server Actions em paralelo no client podem travar no App Router.
    const official = await fetchSuggestedCampaigns();
    const community = await fetchApprovedCommunityCampaigns();
    let banners = [];
    try {
      banners = await fetchCommunityMilestoneBanners();
    } catch {
      banners = [];
    }
    setSuggestions(official || []);
    setCommunityCards(community || []);
    setMilestones(banners || []);
  }, []);

  const loadModerator = useCallback(async () => {
    try {
      const me = await fetchAmICommunityModerator();
      setIsModerator(Boolean(me?.isModerator));
      if (me?.isModerator) {
        const pending = await fetchPendingCommunitySubmissions();
        setPendingSubs(pending || []);
      }
    } catch {
      setIsModerator(false);
    }
  }, []);

  const loadPlaza = useCallback(async () => {
    const posts = await fetchPlazaPosts();
    const options = await fetchMyPlazaCampaignOptions();
    setPlazaPosts(posts || []);
    setPlazaOptions(options || []);
  }, []);

  const loadChallenges = useCallback(async () => {
    const list = await fetchCommunityChallenges();
    setChallenges(list || []);
    const statsMap = {};
    for (const ch of list || []) {
      try {
        statsMap[ch.id] = await fetchCommunityChallengeStats(ch.id);
      } catch {
        statsMap[ch.id] = null;
      }
    }
    setChallengeStats(statsMap);
  }, []);

  const loadClans = useCallback(async () => {
    const mine = await fetchMyClans();
    const protocols = await fetchClanProtocolOptions();
    setClans(mine || []);
    setClanProtocols(protocols || []);
    setClanProtocol((prev) => prev || protocols?.[0]?.value || "");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (tab === "suggestions") {
          await loadCatalog();
          if (!alive) return;
          await loadModerator();
        } else if (tab === "plaza") {
          await loadPlaza();
        } else if (tab === "challenges") {
          await loadChallenges();
        } else if (tab === "clans") {
          await loadClans();
        }
      } catch (e) {
        if (alive) toast.error(e.message || "Erro ao carregar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tab, loadCatalog, loadModerator, loadPlaza, loadChallenges, loadClans]);

  const catalog = useMemo(() => {
    if (catalogFilter === "official") return suggestions;
    if (catalogFilter === "community") return communityCards;
    return [...suggestions, ...communityCards];
  }, [catalogFilter, suggestions, communityCards]);

  const totalPages = Math.max(1, Math.ceil(catalog.length / SUGGESTIONS_PER_PAGE));

  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * SUGGESTIONS_PER_PAGE;
    return catalog.slice(start, start + SUGGESTIONS_PER_PAGE);
  }, [catalog, page, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [catalogFilter]);

  const redeemShare = async () => {
    if (!redeemCode.trim() || redeemBusy) return;
    setRedeemBusy(true);
    setRailLabel("Resgatando código…");
    try {
      const res = await actionRedeemCampaignShareCode(redeemCode.trim());
      toast.success(
        res.created
          ? `"${res.title}" adicionada`
          : `"${res.title}" já estava na sua lista`
      );
      setRedeemCode("");
      if (res.campaignId) {
        router.push(`/campaigns/${res.campaignId}/edit`);
        return;
      }
      setRailLabel("");
    } catch (e) {
      toast.error(e.message || "Código inválido");
      setRailLabel("");
    } finally {
      setRedeemBusy(false);
    }
  };

  const acceptCard = async (card) => {
    const key =
      card.source === "community"
        ? `community-${card.submissionId}`
        : `suggest-${card.id}`;
    setBusyId(key);
    setRailLabel("Aceitando…");
    try {
      const res =
        card.source === "community"
          ? await actionAcceptCommunitySubmission(card.submissionId)
          : await actionAcceptSuggestedCampaign(card.id);
      await loadCatalog();
      setRailLabel(
        res.created ? "Campanha adicionada" : "Já estava na sua lista"
      );
      toast.success(
        res.created
          ? res.reward?.xpGained
            ? `"${res.title}" adicionada · +${res.reward.xpGained} XP`
            : `"${res.title}" adicionada às suas frentes`
          : `"${res.title}" já estava na sua lista`
      );
      await new Promise((r) => setTimeout(r, 900));
      if (res.campaignId) {
        router.push(`/campaigns/${res.campaignId}/edit`);
        return;
      }
      setRailLabel("");
      setBusyId(null);
    } catch (e) {
      toast.error(e.message || "Não foi possível aceitar");
      setBusyId(null);
      setRailLabel("");
    }
  };

  const reviewSub = async (id, decision) => {
    setReviewBusyId(`${id}-${decision}`);
    try {
      await actionReviewCommunitySubmission(id, decision, "");
      toast.success(decision === "approve" ? "Aprovada" : "Rejeitada");
      await loadCatalog();
      await loadModerator();
    } catch (e) {
      toast.error(e.message || "Falha na revisão");
    } finally {
      setReviewBusyId(null);
    }
  };

  const postPlaza = async () => {
    if (!plazaBody.trim() || plazaBusy) return;
    setPlazaBusy(true);
    try {
      await actionCreatePlazaPost(
        plazaBody,
        plazaCampaignId ? Number(plazaCampaignId) : null
      );
      setPlazaBody("");
      setPlazaCampaignId("");
      toast.success("Postado na Praça");
      await loadPlaza();
    } catch (e) {
      toast.error(e.message || "Não foi possível postar");
    } finally {
      setPlazaBusy(false);
    }
  };

  const loadMorePlaza = async () => {
    if (!plazaPosts.length || plazaLoadingMore) return;
    setPlazaLoadingMore(true);
    try {
      const oldest = plazaPosts[plazaPosts.length - 1]?.createdAt;
      const more = await fetchPlazaPosts(oldest);
      if (!more?.length) {
        toast("Não há posts anteriores");
      } else {
        setPlazaPosts((prev) => [...prev, ...more]);
      }
    } catch (e) {
      toast.error(e.message || "Falha ao carregar");
    } finally {
      setPlazaLoadingMore(false);
    }
  };

  const joinCh = async (id) => {
    setChallengeBusy(`join-${id}`);
    try {
      await actionJoinCommunityChallenge(id);
      toast.success("Você entrou no desafio");
      await loadChallenges();
    } catch (e) {
      toast.error(e.message || "Falha ao entrar");
    } finally {
      setChallengeBusy(null);
    }
  };

  const checkinCh = async (id) => {
    setChallengeBusy(`checkin-${id}`);
    try {
      const res = await actionCheckinCommunityChallenge(id);
      toast.success(
        res.stats?.checkedInToday
          ? `Check-in ok · você ${res.stats.myCheckinCount}/7`
          : "Check-in registrado"
      );
      await loadChallenges();
    } catch (e) {
      toast.error(e.message || "Falha no check-in");
    } finally {
      setChallengeBusy(null);
    }
  };

  const createClanSubmit = async () => {
    if (!clanName.trim() || !clanProtocol || clanBusy) return;
    setClanBusy("create");
    try {
      const clan = await actionCreateClan(clanName.trim(), clanProtocol);
      toast.success(`Clã criado · código ${clan.joinCode}`);
      setClanName("");
      await loadClans();
    } catch (e) {
      toast.error(e.message || "Falha ao criar clã");
    } finally {
      setClanBusy(null);
    }
  };

  const joinClanSubmit = async () => {
    if (!clanJoinCode.trim() || clanBusy) return;
    setClanBusy("join");
    try {
      const clan = await actionJoinClanByCode(clanJoinCode.trim());
      toast.success(`Entrou em ${clan.name}`);
      setClanJoinCode("");
      await loadClans();
    } catch (e) {
      toast.error(e.message || "Código inválido");
    } finally {
      setClanBusy(null);
    }
  };

  const checkinClan = async (id) => {
    setClanBusy(`checkin-${id}`);
    try {
      await actionClanCheckin(id);
      toast.success("Check-in do clã ok");
      await loadClans();
    } catch (e) {
      toast.error(e.message || "Falha no check-in");
    } finally {
      setClanBusy(null);
    }
  };

  return (
    <>
      <BusyRail active={Boolean(railLabel)} label={railLabel} />
      <div className="mx-auto max-w-2xl space-y-6 pb-24 lg:pb-8">
        <header data-tour="tour-community-header" className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">
            Mundo
          </p>
          <h1 className="font-display text-3xl text-ash-200">Comunidade</h1>
          <p className="text-sm text-ash-400">
            Campanhas oficiais, desafios, praça e clãs — separado das suas
            frentes pessoais.
          </p>
        </header>

        <div data-tour="tour-community-redeem" className="panel space-y-3 p-5">
          <h2 className="font-display text-lg text-ash-100">
            Tenho um código de campanha
          </h2>
          <p className="text-sm text-ash-400">
            Cole um código CP-XXXX-XXXX enviado por um amigo para clonar a
            frente dele.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className="input-field max-w-xs uppercase"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="CP-XXXX-XXXX"
            />
            <button
              type="button"
              className="btn-primary"
              disabled={redeemBusy || !redeemCode.trim()}
              onClick={redeemShare}
            >
              {redeemBusy ? (
                <>
                  <Spinner />
                  Resgatando…
                </>
              ) : (
                "Resgatar"
              )}
            </button>
          </div>
        </div>

        <div data-tour="tour-community-tabs" className="flex flex-wrap gap-2">
          {COMMUNITY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                tab === t.id
                  ? "border-copper/50 bg-copper/15 text-copper-bright"
                  : "border-copper/15 text-ash-400 hover:border-copper/35"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "suggestions" && (
          <section className="space-y-4">
            {milestones.length > 0 && (
              <ul className="space-y-2">
                {milestones.map((m) => (
                  <li
                    key={m.templateId}
                    className="rounded-lg border border-copper/35 bg-copper/10 px-4 py-3 text-sm text-ash-100"
                  >
                    {m.message}
                  </li>
                ))}
              </ul>
            )}

            {isModerator && (
              <div className="panel space-y-3 border-copper/30 bg-copper/5 p-5">
                <h2 className="font-display text-lg text-ash-100">
                  Moderação
                </h2>
                {!pendingSubs.length ? (
                  <p className="text-sm text-ash-400">
                    Nenhuma publicação pendente.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {pendingSubs.map((p) => {
                      const r = p.review || {};
                      return (
                      <li
                        key={p.id}
                        className="space-y-3 border-b border-copper/10 pb-4 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="font-display text-lg text-ash-100">
                            {p.title}
                          </p>
                          <p className="text-sm text-ash-300">{p.blurb}</p>
                          <p className="text-xs text-ash-500">
                            por {p.submitterName}
                            {p.createdAt
                              ? ` · enviado ${String(p.createdAt).slice(0, 10)}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {r.primaryStatLabel ? (
                            <span className="rounded border border-copper/25 bg-copper/10 px-2 py-1 text-copper">
                              Atributo: {r.primaryStatLabel}
                            </span>
                          ) : null}
                          <span className="rounded border border-copper/15 px-2 py-1 text-ash-400">
                            {r.chapterCount ?? 0} cap. · {r.missionCount ?? 0}{" "}
                            missões · {r.stepCount ?? 0} passos
                          </span>
                          {r.plannedMinutesTotal ? (
                            <span className="rounded border border-copper/15 px-2 py-1 text-ash-400">
                              ~{r.plannedMinutesTotal} min somados nos passos
                            </span>
                          ) : null}
                        </div>

                        {(r.why || r.result) && (
                          <div className="space-y-1.5 text-sm">
                            {r.why ? (
                              <p className="text-ash-300">
                                <span className="text-ash-500">Por quê: </span>
                                {r.why}
                              </p>
                            ) : null}
                            {r.result ? (
                              <p className="text-ash-300">
                                <span className="text-ash-500">
                                  Resultado:{" "}
                                </span>
                                {r.result}
                              </p>
                            ) : null}
                          </div>
                        )}

                        {(r.outline || []).length > 0 && (
                          <details className="rounded-lg border border-copper/15 bg-ink-950/40 p-3">
                            <summary className="cursor-pointer text-xs uppercase tracking-wider text-ash-400">
                              Estrutura da campanha
                            </summary>
                            <div className="mt-3 space-y-3 text-sm text-ash-300">
                              {r.outline.map((ch, ci) => (
                                <div key={`${p.id}-ch-${ci}`} className="space-y-2">
                                  <p className="font-display text-ash-200">
                                    Cap. {ci + 1}: {ch.title}
                                  </p>
                                  {ch.objective ? (
                                    <p className="text-xs text-ash-500">
                                      Objetivo: {ch.objective}
                                    </p>
                                  ) : null}
                                  <ul className="space-y-2 border-l border-copper/20 pl-3">
                                    {(ch.missions || []).map((m, mi) => (
                                      <li key={`${p.id}-m-${ci}-${mi}`}>
                                        <p className="text-ash-200">
                                          Missão: {m.title}
                                          {m.stepCount
                                            ? ` (${m.stepCount} passos)`
                                            : ""}
                                        </p>
                                        {m.why ? (
                                          <p className="text-xs text-ash-500">
                                            {m.why}
                                          </p>
                                        ) : null}
                                        {(m.weekdays?.length > 0 ||
                                          m.timeOfDay ||
                                          m.plannedMinutes) && (
                                          <p className="text-xs text-ash-500">
                                            {[
                                              m.weekdays?.length
                                                ? m.weekdays.join(", ")
                                                : null,
                                              m.timeOfDay,
                                              m.plannedMinutes
                                                ? `${m.plannedMinutes} min`
                                                : null,
                                            ]
                                              .filter(Boolean)
                                              .join(" · ")}
                                          </p>
                                        )}
                                        <ul className="mt-1 list-inside list-disc text-xs text-ash-400">
                                          {(m.steps || []).map((s, si) => (
                                            <li key={`${p.id}-s-${ci}-${mi}-${si}`}>
                                              {s.surface}
                                              {s.plannedMinutes
                                                ? ` (${s.plannedMinutes} min)`
                                                : ""}
                                              {s.detail ? (
                                                <span className="block pl-4 text-ash-500">
                                                  {s.detail}
                                                </span>
                                              ) : null}
                                            </li>
                                          ))}
                                          {m.stepsTruncated ? (
                                            <li className="text-ash-500">
                                              … mais passos no snapshot
                                            </li>
                                          ) : null}
                                        </ul>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={Boolean(reviewBusyId)}
                            onClick={() => reviewSub(p.id, "approve")}
                          >
                            {reviewBusyId === `${p.id}-approve` ? (
                              <Spinner />
                            ) : (
                              "Aprovar"
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            disabled={Boolean(reviewBusyId)}
                            onClick={() => reviewSub(p.id, "reject")}
                          >
                            {reviewBusyId === `${p.id}-reject` ? (
                              <Spinner />
                            ) : (
                              "Rejeitar"
                            )}
                          </button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div
              data-tour="tour-community-catalog"
              className="panel space-y-2 border-copper/25 bg-copper/5 p-5"
            >
              <h2 className="font-display text-lg text-ash-100">
                Campanhas sugeridas
              </h2>
              <p className="text-sm text-ash-400">
                Protocolos oficiais e publicações aprovadas. Ao aceitar, uma
                cópia privada entra em{" "}
                <Link href="/campaigns" className="text-copper hover:underline">
                  Campanhas
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "Todas" },
                { id: "official", label: "Oficiais" },
                { id: "community", label: "Da comunidade" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCatalogFilter(f.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    catalogFilter === f.id
                      ? "border-copper/50 bg-copper/15 text-copper-bright"
                      : "border-copper/15 text-ash-400 hover:border-copper/35"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !catalog.length ? (
              <div className="panel p-5">
                <p className="text-sm text-ash-400">
                  Nenhuma sugestão neste filtro.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-ash-500">
                  Página {Math.min(page, totalPages)} de {totalPages} ·{" "}
                  {catalog.length} itens
                </p>
                <ul className="space-y-3">
                  {paged.map((s) => {
                    const busyKey =
                      s.source === "community"
                        ? `community-${s.submissionId}`
                        : `suggest-${s.id}`;
                    return (
                      <li key={s.id} className="panel space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <h2 className="font-display text-xl text-ash-200">
                              {s.title}
                            </h2>
                            <p className="text-sm text-ash-400">{s.blurb}</p>
                            <p className="text-xs text-ash-500">
                              {s.scheduleHint}
                              {s.authorLabel ? ` · por ${s.authorLabel}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-copper/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash-400">
                            {DIFFICULTY_LABEL[s.difficulty] || s.difficulty}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded border border-copper/30 bg-copper/10 px-2 py-1 text-copper">
                            +{s.acceptBonusXp} XP ao aceitar
                          </span>
                          <span className="rounded border border-copper/20 px-2 py-1 text-ash-300">
                            +{s.acceptBonusAttr}{" "}
                            {s.primary_stat_label || s.primary_stat}
                          </span>
                          {s.estimatedXp != null && (
                            <span className="rounded border border-ink-700 px-2 py-1 text-ash-500">
                              ~{s.estimatedXp} XP se concluir
                            </span>
                          )}
                        </div>
                        {(s.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {s.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded border border-copper/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {s.alreadyAccepted ? (
                            <>
                              <span className="btn-ghost pointer-events-none opacity-70">
                                Já aceita
                              </span>
                              {s.existingCampaignId && (
                                <Link
                                  href={`/campaigns/${s.existingCampaignId}/edit`}
                                  className="btn-ghost"
                                >
                                  Ver / editar
                                </Link>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={Boolean(busyId)}
                              onClick={() => acceptCard(s)}
                            >
                              {busyId === busyKey ? (
                                <>
                                  <Spinner />
                                  Aceitando…
                                </>
                              ) : (
                                "Aceitar campanha"
                              )}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPage(n)}
                            className={`min-w-[2rem] rounded-lg border px-2 py-1 text-xs transition ${
                              n === page
                                ? "border-copper/50 bg-copper/15 text-copper-bright"
                                : "border-copper/15 text-ash-400 hover:border-copper/35"
                            }`}
                          >
                            {n}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === "challenges" && (
          <section className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !challenges.length ? (
              <div className="panel p-5">
                <p className="text-sm text-ash-400">
                  Nenhum desafio ativo no momento.
                </p>
              </div>
            ) : (
              challenges.map((ch) => {
                const st = challengeStats[ch.id];
                return (
                  <article key={ch.id} className="panel space-y-3 p-5">
                    <h2 className="font-display text-xl text-ash-200">
                      {ch.title}
                    </h2>
                    <p className="text-sm text-ash-400">{ch.blurb}</p>
                    <p className="text-xs text-ash-500">
                      {ch.startsOn} → {ch.endsOn}
                    </p>
                    {st && (
                      <p className="text-sm text-ash-300">
                        {st.memberCount} pessoa
                        {st.memberCount === 1 ? "" : "s"} nesta semana
                        {ch.joined
                          ? ` · Você: ${st.myCheckinCount}/${st.targetDays} dias`
                          : ""}
                        {st.checkinsToday > 0
                          ? ` · ${st.checkinsToday} marcaram hoje`
                          : ""}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {!ch.joined ? (
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={Boolean(challengeBusy)}
                          onClick={() => joinCh(ch.id)}
                        >
                          {challengeBusy === `join-${ch.id}` ? (
                            <Spinner />
                          ) : (
                            "Entrar"
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={
                            Boolean(challengeBusy) || st?.checkedInToday
                          }
                          onClick={() => checkinCh(ch.id)}
                        >
                          {challengeBusy === `checkin-${ch.id}` ? (
                            <Spinner />
                          ) : st?.checkedInToday ? (
                            "Já marcou hoje"
                          ) : (
                            "Marcar hoje"
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {tab === "plaza" && (
          <section className="space-y-4">
            <div className="panel space-y-3 p-5">
              <h2 className="font-display text-lg text-ash-100">
                O que você fez hoje?
              </h2>
              <p className="text-sm text-ash-400">
                Um post por dia · máx. 120 caracteres.
              </p>
              <textarea
                className="input-field min-h-[72px] resize-y"
                value={plazaBody}
                onChange={(e) => setPlazaBody(e.target.value.slice(0, 120))}
                placeholder="Uma linha sobre o progresso…"
                maxLength={120}
              />
              <select
                className="input-field max-w-md"
                value={plazaCampaignId}
                onChange={(e) => setPlazaCampaignId(e.target.value)}
              >
                <option value="">Sem campanha</option>
                {plazaOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {c.visibility === "public" ? "" : " (sua)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary"
                disabled={plazaBusy || !plazaBody.trim()}
                onClick={postPlaza}
              >
                {plazaBusy ? <Spinner /> : "Postar"}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !plazaPosts.length ? (
              <div className="panel p-5">
                <p className="text-sm text-ash-400">
                  A Praça está quieta. Seja o primeiro a contar o dia de hoje.
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {plazaPosts.map((p) => (
                    <li key={p.id} className="panel space-y-1 p-4">
                      <p className="text-sm text-ash-200">{p.body}</p>
                      <p className="text-xs text-ash-500">
                        {p.championName}
                        {p.campaignTitle ? ` · ${p.campaignTitle}` : ""}
                        {p.postDate ? ` · ${p.postDate}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={plazaLoadingMore}
                  onClick={loadMorePlaza}
                >
                  {plazaLoadingMore ? <Spinner /> : "Carregar anteriores"}
                </button>
              </>
            )}
          </section>
        )}

        {tab === "clans" && (
          <section className="space-y-4">
            <div className="panel space-y-3 p-5">
              <h2 className="font-display text-lg text-ash-100">Criar clã</h2>
              <p className="text-sm text-ash-400">
                2–5 pessoas · 7 dias · mesmo protocolo. Entrada por código.
              </p>
              <input
                className="input-field"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                placeholder="Nome do clã"
                maxLength={40}
              />
              <select
                className="input-field"
                value={clanProtocol}
                onChange={(e) => setClanProtocol(e.target.value)}
              >
                {clanProtocols.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                    {p.source === "community" ? " (comunidade)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary"
                disabled={
                  clanBusy || !clanName.trim() || !clanProtocol
                }
                onClick={createClanSubmit}
              >
                {clanBusy === "create" ? <Spinner /> : "Criar"}
              </button>
            </div>

            <div className="panel space-y-3 p-5">
              <h2 className="font-display text-lg text-ash-100">
                Entrar com código
              </h2>
              <div className="flex flex-wrap gap-2">
                <input
                  className="input-field max-w-xs uppercase"
                  value={clanJoinCode}
                  onChange={(e) => setClanJoinCode(e.target.value)}
                  placeholder="CL-XXXX-XXXX"
                />
                <button
                  type="button"
                  className="btn-primary"
                  disabled={clanBusy || !clanJoinCode.trim()}
                  onClick={joinClanSubmit}
                >
                  {clanBusy === "join" ? <Spinner /> : "Entrar"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !clans.length ? (
              <div className="panel p-5">
                <p className="text-sm text-ash-400">
                  Você ainda não está em nenhum clã.
                </p>
              </div>
            ) : (
              clans.map((clan) => (
                <article key={clan.id} className="panel space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-xl text-ash-200">
                        {clan.name}
                      </h2>
                      <p className="text-xs text-ash-500">
                        {clan.protocolLabel} · {clan.startsOn} → {clan.endsOn}
                      </p>
                    </div>
                    <code className="text-sm text-copper">{clan.joinCode}</code>
                  </div>
                  <p className="text-sm text-ash-300">
                    {clan.memberCount}/{clan.maxMembers} membros ·{" "}
                    {clan.checkinsToday} marcaram hoje
                    {clan.checkedInToday ? " · você já marcou" : ""}
                  </p>
                  {clan.members?.length > 0 && (
                    <ul className="flex flex-wrap gap-2 text-xs text-ash-400">
                      {clan.members.map((m) => (
                        <li
                          key={m.id}
                          className="rounded border border-copper/15 px-2 py-0.5"
                        >
                          {m.name}
                          {m.checkedInToday ? " ✓" : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                  {clan.active && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={
                        Boolean(clanBusy) || clan.checkedInToday
                      }
                      onClick={() => checkinClan(clan.id)}
                    >
                      {clanBusy === `checkin-${clan.id}` ? (
                        <Spinner />
                      ) : clan.checkedInToday ? (
                        "Já marcou hoje"
                      ) : (
                        "Marcar hoje"
                      )}
                    </button>
                  )}
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </>
  );
}
