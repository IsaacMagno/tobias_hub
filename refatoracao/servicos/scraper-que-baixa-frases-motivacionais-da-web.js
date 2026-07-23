const PENSADOR_BASE = "https://www.pensador.com";

/** Páginas de listas do Pensador (formato com underscore, ex.: frases_motivacionais). */
export const PENSADOR_LIST_URLS = [
  `${PENSADOR_BASE}/frases_motivacionais/`,
  `${PENSADOR_BASE}/frases_curtas/`,
  `${PENSADOR_BASE}/frases_de_vida/`,
  `${PENSADOR_BASE}/frases_de_gratidao/`,
  `${PENSADOR_BASE}/frases_de_sucesso/`,
  `${PENSADOR_BASE}/frases_inspiradoras/`,
];

const THOUGHT_CARD_REGEX =
  /<div[^>]*class="[^"]*thought-card[^"]*"[^>]*>[\s\S]*?<p class="frase[^"]*"[^>]*>([\s\S]*?)<\/p>[\s\S]*?<span class="author-name">([\s\S]*?)<\/span>/gi;

function decodeHtmlEntities(str) {
  const named = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    ecirc: "ê",
    eacute: "é",
    acirc: "â",
    aacute: "á",
    atilde: "ã",
    ccedil: "ç",
    oacute: "ó",
    ocirc: "ô",
    otilde: "õ",
    uacute: "ú",
    iacute: "í",
    agrave: "à",
    ordm: "º",
    ordf: "ª",
    ucirc: "û",
    iuml: "ï",
    euml: "ë",
    auml: "ä",
    ouml: "ö",
    uuml: "ü",
  };

  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&([a-z]+);/gi, (_, name) => named[name.toLowerCase()] ?? `&${name};`)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseQuotesFromPensadorHtml(html) {
  const results = [];
  const seen = new Set();

  for (const match of html.matchAll(THOUGHT_CARD_REGEX)) {
    const quote = decodeHtmlEntities(match[1]);
    const author = decodeHtmlEntities(match[2]);

    if (!quote || !author) continue;

    const key = `${quote}|${author}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({ quote, author });
  }

  return results;
}

export async function fetchPensadorListPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Pensador ${response.status}: ${url}`);
  }

  return response.text();
}

/**
 * Raspa várias listas do Pensador e devolve citações únicas.
 */
export async function scrapePensadorQuotes(urls = PENSADOR_LIST_URLS) {
  const all = [];
  const seen = new Set();

  for (const url of urls) {
    try {
      const html = await fetchPensadorListPage(url);
      const pageQuotes = parseQuotesFromPensadorHtml(html);

      for (const row of pageQuotes) {
        const key = `${row.quote}|${row.author}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(row);
      }
    } catch (error) {
      console.error(`[quoteScraper] Falha em ${url}:`, error.message);
    }
  }

  return all;
}
