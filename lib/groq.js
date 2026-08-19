// Modèle Groq partagé par toutes les fonctionnalités IA.
// llama-3.3-70b-versatile a été retiré par Groq : openai/gpt-oss-120b le remplace.
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Toutes les clés disponibles (dédupliquées) : chaque clé a son propre quota TPM,
// on bascule sur la suivante quand l'une est saturée (429).
export const ALL_GROQ_KEYS = [...new Set([
  process.env.GROQ_API,
  process.env.GROQ_API_KEY,
  process.env.GROQ_API1,
  process.env.GROQ_API2,
  process.env.GROQ_API3,
].filter(Boolean))];

// Certains modèles encadrent le JSON dans un bloc markdown : on nettoie avant parse.
function parseJsonContent(content) {
  const cleaned = String(content).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Appel Groq en mode JSON, avec rotation des clés sur quota dépassé (429).
 * Retourne l'objet JSON parsé. Lève une erreur lisible sinon.
 */
export async function groqChatJSON({ messages, temperature = 0, maxTokens = 4000, timeoutMs = 60000, keys = ALL_GROQ_KEYS }) {
  if (!keys.length) throw new Error('Aucune clé GROQ configurée (GROQ_API / GROQ_API1-3)');

  let lastError = null;

  for (const key of keys) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature,
          response_format: { type: 'json_object' },
          max_completion_tokens: maxTokens,
          reasoning_effort: 'low',
        }),
        signal: controller.signal,
      });
    } catch (err) {
      lastError = new Error(err.name === 'AbortError' ? 'Délai dépassé côté Groq' : err.message);
      continue;
    } finally {
      clearTimeout(timeout);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.error?.message || `Groq error ${res.status}`;
      // Quota de la clé épuisé ou clé invalide -> on tente la clé suivante
      if (res.status === 429 || res.status === 401 || res.status === 403) {
        lastError = new Error(msg);
        continue;
      }
      throw new Error(msg);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Réponse Groq vide');
    return parseJsonContent(content);
  }

  throw lastError ?? new Error('Toutes les clés GROQ ont échoué');
}

function compactListing(l) {
  return {
    id: l._id?.toString?.() ?? String(l._id),
    titre: typeof l.title === 'string' ? l.title : (l.title?.fr ?? ''),
    type: l.type,
    ville: l.location?.city ?? '',
    region: l.location?.region ?? '',
    prix_nuit: Math.round((l.pricePerNight ?? 0) / 100),
    capacite: l.capacity,
    chambres: l.bedrooms,
    sdb: l.bathrooms,
    equipements: l.amenities ?? [],
    themes: l.themes ?? [],
    activites: l.activities ?? [],
    env: l.environment ?? [],
    note: l.averageRating ?? 0,
    avis: l.reviewCount ?? 0,
    desc: (typeof l.description === 'string' ? l.description : (l.description?.fr ?? '')).slice(0, 200),
    distances: l.distances ?? {},
  };
}

const SEARCH_SYSTEM = `Tu es un moteur de recherche d'hébergements touristiques expert. Tu évalues chaque annonce indépendamment par rapport à la recherche de l'utilisateur et tu attribues un score de pertinence précis.

Grille de scoring (0-10):
- 9-10 : correspondance quasi-parfaite (type, lieu, équipements, capacité tous présents)
- 6-8  : bonne correspondance (majorité des critères satisfaits)
- 3-5  : correspondance partielle (quelques critères, ou ville/région différente mais type correct)
- 0-2  : peu ou pas de rapport (exclure du résultat)

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après.`;

// Le quota gratuit Groq plafonne prompt + réponse à 8000 tokens par requête :
// on découpe le catalogue en lots qui tiennent dans cette limite.
const MAX_BATCH_CHARS = 12000;

function buildBatches(items) {
  const batches = [];
  let current = [];
  let size = 0;
  for (const item of items) {
    const len = JSON.stringify(item).length;
    if (current.length && size + len > MAX_BATCH_CHARS) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += len;
  }
  if (current.length) batches.push(current);
  return batches;
}

// Chaque clé a son propre quota : on décale la clé de départ d'un lot à l'autre.
function rotateKeys(offset) {
  if (!ALL_GROQ_KEYS.length) return [];
  const i = offset % ALL_GROQ_KEYS.length;
  return [...ALL_GROQ_KEYS.slice(i), ...ALL_GROQ_KEYS.slice(0, i)];
}

async function scoreBatch(userQuery, items, offset) {
  const user = `Recherche utilisateur : "${userQuery}"

Catalogue (${items.length} annonces) :
${JSON.stringify(items)}

Évalue chaque annonce et retourne :
{
  "results": [
    {"id": "...", "score": 8},
    ...
  ],
  "interpretation": "phrase courte décrivant ce que tu as compris de la demande",
  "message": "conseil utile si 0 ou peu de résultats trouvés — explique ce qui manque dans le catalogue et ce que l'utilisateur pourrait essayer. null si résultats suffisants."
}

Règles :
- N'inclure dans "results" que les annonces avec score >= 3
- Trier "results" par score décroissant
- "interpretation" : toujours renseigner (1 phrase, ex: "Chalet ski pour 6 personnes avec sauna")
- "message" : renseigner si results.length < 3, sinon null`;

  const parsed = await groqChatJSON({
    messages: [
      { role: 'system', content: SEARCH_SYSTEM },
      { role: 'user', content: user },
    ],
    temperature: 0.1,
    maxTokens: 1500,
    timeoutMs: 20000,
    keys: rotateKeys(offset),
  });

  if (!Array.isArray(parsed.results)) throw new Error('Format GROQ invalide: results manquant');

  return {
    results: parsed.results.filter((r) => r?.id && typeof r.score === 'number' && r.score >= 3),
    interpretation: typeof parsed.interpretation === 'string' ? parsed.interpretation : null,
    message: typeof parsed.message === 'string' && parsed.message ? parsed.message : null,
  };
}

/**
 * Retourne { ids, interpretation, message }
 * - ids: IDs triés par score décroissant (score >= 3)
 * - interpretation: ce que l'IA a compris de la requête
 * - message: conseil utile si peu ou pas de résultats, null sinon
 */
export async function searchListingsWithAI(userQuery, listings) {
  if (!ALL_GROQ_KEYS.length) throw new Error('Aucune clé GROQ configurée (GROQ_API / GROQ_API1-3)');

  if (!listings.length) {
    return {
      ids: [],
      interpretation: null,
      message: 'Le catalogue ne contient aucune annonce pour le moment.',
    };
  }

  const items = listings.slice(0, 300).map(compactListing);
  const batches = buildBatches(items);

  const settled = await Promise.allSettled(
    batches.map((batch, i) => scoreBatch(userQuery, batch, i)),
  );

  const ranked = [];
  let interpretation = null;
  let message = null;
  let lastError = null;

  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      lastError = outcome.reason;
      continue;
    }
    ranked.push(...outcome.value.results);
    interpretation ??= outcome.value.interpretation;
    message ??= outcome.value.message;
  }

  // Aucun lot n'a abouti : on remonte l'erreur pour déclencher le fallback appelant
  if (!ranked.length && lastError) throw lastError;

  ranked.sort((a, b) => b.score - a.score);

  return {
    ids: ranked.map((r) => String(r.id)),
    interpretation,
    message: ranked.length < 3 ? message : null,
  };
}
