import { createAdminClient } from "@/lib/supabase/admin";
import { syncQuotesFromPensador } from "@/lib/services/syncQuotes";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeQuoteRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    quote: row.quote,
    author: row.author,
    championId: row.championId ?? row.champion_id ?? row.championid ?? null,
  };
}

/** Equivalente a `quoteServices.getAllQuotes()` na API antiga. */
export async function getAllQuotes() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("quotes").select("*");
  if (error) throw error;
  return (data ?? []).map(normalizeQuoteRow);
}

/**
 * Equivalente a `quoteServices.randomSelectQuote()`:
 * busca todas, embaralha (Fisher-Yates) e devolve a primeira.
 */
async function ensureQuotesAvailable() {
  let quotes = await getAllQuotes();
  if (quotes.length) return quotes;

  await syncQuotesFromPensador();
  quotes = await getAllQuotes();
  return quotes;
}

export async function getRandomQuote() {
  const quotes = await ensureQuotesAvailable();

  if (!quotes.length) {
    throw new Error("Não há citações disponíveis para selecionar.");
  }

  const shuffled = shuffleArray(quotes);
  return shuffled[0];
}
