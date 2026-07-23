"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ContinueSkeleton } from "@/components/LoadingUI";
import { fetchCampaignEditor } from "../../../../services/requests";
import CampaignEditorForm from "../../CampaignEditorForm";

export default function EditCampaignPage({ params }) {
  const campaignId = Number(params.id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const editor = await fetchCampaignEditor(campaignId);
        if (!cancelled) setData(editor);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Erro ao carregar");
          toast.error(e.message || "Erro ao carregar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (loading) return <ContinueSkeleton />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10">
        <h1 className="font-display text-2xl text-ash-200">Editor</h1>
        <p className="text-sm text-ash-400">
          {error || "Campanha não encontrada."}
        </p>
        <Link href="/campaigns" className="btn-primary inline-flex">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <CampaignEditorForm
      mode="edit"
      campaignId={campaignId}
      initial={data}
    />
  );
}
