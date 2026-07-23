import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  scrapePensadorQuotes,
  PENSADOR_LIST_URLS,
} from "../src/lib/services/quoteScraper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "../.env");
  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      })
  );
}

const fresh = process.argv.includes("--fresh");

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e chave no .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

if (fresh) {
  const { error } = await supabase.from("quotes").delete().gte("id", 0);
  if (error) {
    console.error("Erro ao limpar quotes:", error.message);
    process.exit(1);
  }
  console.log("Tabela quotes limpa (--fresh).");
}

console.log("Raspando Pensador:", PENSADOR_LIST_URLS.join(", "));
const scraped = await scrapePensadorQuotes();

if (!scraped.length) {
  console.error("Nenhuma citação raspada.");
  process.exit(1);
}

const { data: existing } = await supabase.from("quotes").select("quote");
const existingTexts = new Set(
  (existing ?? []).map((r) => r.quote?.trim().toLowerCase())
);

const toInsert = scraped.filter(
  (r) => !existingTexts.has(r.quote.trim().toLowerCase())
);

if (toInsert.length) {
  const batchSize = 50;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("quotes").insert(batch);
    if (error) {
      console.error("Erro ao inserir:", error.message);
      process.exit(1);
    }
  }
}

const { count } = await supabase
  .from("quotes")
  .select("*", { count: "exact", head: true });

console.log(
  `Concluído: ${scraped.length} raspadas, ${toInsert.length} novas inseridas, ${count ?? 0} no total.`
);
