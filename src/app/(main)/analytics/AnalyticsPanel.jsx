"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import {
  fetchSessionAnalytics,
  fetchCampaignsDetailed,
} from "../../services/requests";

export default function AnalyticsPanel() {
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState("");
  const [busy, setBusy] = useState(true);
  const [rail, setRail] = useState("");

  const load = useCallback(async (cid) => {
    setBusy(true);
    setRail("Carregando sessões…");
    try {
      const analytics = await fetchSessionAnalytics({
        days: 90,
        campaignId: cid || null,
      });
      setData(analytics);
      setRail("");
    } catch (err) {
      toast.error(err.message || "Falha ao carregar");
      setRail("");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const items = await fetchCampaignsDetailed("active");
        setCampaigns(items || []);
      } catch {
        /* ignore */
      }
      await load("");
    })();
  }, [load]);

  const maxMin = Math.max(
    1,
    ...((data?.days || []).map((d) => d.minutes) || [1])
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <BusyRail active={Boolean(rail)} label={rail} />
      <header data-tour="tour-analytics-header" className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Identidade
        </p>
        <h1 className="font-display text-3xl text-ash-200">Atividade</h1>
        <p className="text-sm text-ash-400">
          Dias fortes e fracos a partir das sessões concluídas.
        </p>
      </header>

      <section data-tour="tour-analytics-filter" className="panel space-y-3 p-5">
        <label className="block space-y-1.5">
          <span className="text-xs text-ash-400">Filtrar por campanha</span>
          <select
            className="input-field"
            value={campaignId}
            onChange={(e) => {
              const v = e.target.value;
              setCampaignId(v);
              load(v);
            }}
          >
            <option value="">Todas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {data && (
          <p className="text-sm text-ash-400">
            {data.totalMinutes} min no período · mediana {data.medianMinutes}{" "}
            min/dia ativo
          </p>
        )}
      </section>

      {busy && !data ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <section data-tour="tour-analytics-chart" className="panel space-y-3 p-5">
            <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Minutos por dia
            </h2>
            {(data?.days || []).length === 0 ? (
              <p className="text-sm text-ash-500">
                Nenhuma sessão concluída neste período.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.days.map((d) => (
                  <li key={d.date} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-ash-500">
                      {d.date}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-copper"
                        style={{
                          width: `${Math.round((d.minutes / maxMin) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-ash-300">
                      {d.minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="panel p-5">
              <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-ash-400">
                Dias fortes
              </h3>
              <p className="text-sm text-ash-300">
                {(data?.strongDays || []).map((d) => d.date).join(", ") || "—"}
              </p>
            </div>
            <div className="panel p-5">
              <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-ash-400">
                Dias fracos
              </h3>
              <p className="text-sm text-ash-300">
                {(data?.weakDays || []).map((d) => d.date).join(", ") || "—"}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
