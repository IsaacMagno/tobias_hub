import { createAdminClient } from "@/lib/supabase/admin";
import { scrapePensadorQuotes } from "@/lib/services/quoteScraper";

/**
 * Raspa o Pensador e grava citações novas na tabela `quotes`
 * (ignora textos já existentes, como na API antiga).
 */
export async function syncQuotesFromPensador() {
  const scraped = await scrapePensadorQuotes();

  if (!scraped.length) {
    throw new Error(
      "Nenhuma citação obtida do Pensador. Verifique conectividade ou o layout do site."
    );
  }

  const supabase = createAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("quotes")
    .select("quote");

  if (readError) throw readError;

  const existingTexts = new Set(
    (existing ?? []).map((row) => row.quote?.trim().toLowerCase())
  );

  const toInsert = scraped.filter(
    (row) => !existingTexts.has(row.quote.trim().toLowerCase())
  );

  if (!toInsert.length) {
    return { scraped: scraped.length, inserted: 0, total: existing?.length ?? 0 };
  }

  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("quotes").insert(batch);
    if (error) throw error;
    inserted += batch.length;
  }

  const total = (existing?.length ?? 0) + inserted;
  return { scraped: scraped.length, inserted, total };
}
