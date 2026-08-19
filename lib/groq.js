const GROQ_KEYS = [
  process.env.GROQ_API1,
  process.env.GROQ_API2,
  process.env.GROQ_API3,
].filter(Boolean);

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
export async function groqChatJSON({ messages, temperature = 0, maxTokens = 4000, timeoutMs = 60000 }) {
  if (!ALL_GROQ_KEYS.length) throw new Error('Aucune clé GROQ configurée (GROQ_API / GROQ_API1-3)');

  let lastError = null;

  for (const key of ALL_GROQ_KEYS) {
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

/**
 * Retourne { ids, interpretation, message }
 * - ids: IDs triés par score décroissant (score >= 3)
 * - interpretation: ce que l'IA a compris de la requête
 * - message: conseil utile si peu ou pas de résultats, null sinon
 */
export async function searchListingsWithAI(userQuery, listings) {
  if (!GROQ_KEYS.length) throw new Error('Aucune clé GROQ configurée (GROQ_API1/2/3)');

  if (!listings.length) {
    return {
      ids: [],
      interpretation: null,
      message: 'Le catalogue ne contient aucune annonce pour le moment.',
    };
  }

  const items = listings.slice(0, 300).map(compactListing);

  const system = `Tu es un moteur de recherche d'hébergements touristiques expert. Tu évalues chaque annonce indépendamment par rapport à la recherche de l'utilisateur et tu attribues un score de pertinence précis.

Grille de scoring (0-10):
- 9-10 : correspondance quasi-parfaite (type, lieu, équipements, capacité tous présents)
- 6-8  : bonne correspondance (majorité des critères satisfaits)
- 3-5  : correspondance partielle (quelques critères, ou ville/région différente mais type correct)
- 0-2  : peu ou pas de rapport (exclure du résultat)

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après.`;

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

  let lastError = null;

  for (const key of GROQ_KEYS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

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
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            temperature: 0.1,
            max_completion_tokens: 2048,
            reasoning_effort: 'low',
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (res.status === 429 || res.status === 401 || res.status === 403) {
        lastError = new Error(`Clé GROQ rejetée (${res.status})`);
        continue;
      }
      if (!res.ok) {
        lastError = new Error(`Erreur API GROQ: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Réponse GROQ vide');

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.results)) throw new Error('Format GROQ invalide: results manquant');

      const ranked = parsed.results
        .filter((r) => r?.id && typeof r.score === 'number' && r.score >= 3)
        .sort((a, b) => b.score - a.score);

      return {
        ids: ranked.map((r) => String(r.id)),
        interpretation: typeof parsed.interpretation === 'string' ? parsed.interpretation : null,
        message: typeof parsed.message === 'string' && parsed.message ? parsed.message : null,
      };
    } catch (err) {
      lastError = err;
      if (err.message.includes('invalide') || err.message.includes('JSON')) throw err;
    }
  }

  throw lastError ?? new Error('Toutes les clés GROQ ont échoué');
}
