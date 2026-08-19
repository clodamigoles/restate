import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { groqChatJSON, ALL_GROQ_KEYS } from '@/lib/groq';

const VALID_TYPES = [
  'apartment', 'villa', 'studio', 'gite', 'house', 'space',
  'chambre_hotes', 'chalet', 'camping', 'ferme', 'bungalow',
  'hotel', 'rare', 'village', 'bateau',
];

const VALID_AMENITIES = [
  'wifi', 'kitchen', 'parking', 'tv', 'air_conditioning', 'heating', 'workspace',
  'dishwasher', 'fridge', 'microwave', 'bbq', 'breakfast',
  'pool', 'private_pool', 'garden', 'balcony', 'fenced', 'bike_rental',
  'hot_tub', 'sauna', 'gym', 'fireplace', 'washer', 'dryer',
  'sea_view', 'lake_view', 'mountain_view',
  'wheelchair_accessible', 'elevator', 'ev_charger',
  'cot', 'high_chair', 'playground', 'family_friendly', 'childcare',
  'pets_allowed', 'no_pets', 'smoking_allowed', 'non_smoking',
];

function buildPrompt(text, url) {
  return `Tu es un expert en extraction de données pour des annonces de location saisonnière française. Analyse minutieusement le contenu de cette page et extrais TOUTES les informations disponibles.

URL : ${url}

Contenu de la page :
---
${text}
---

Retourne un objet JSON complet. Utilise null pour tout champ non trouvé (jamais de chaîne vide).

{
  /* ── Identité ── */
  "title_fr": "titre exact de l'annonce",
  "description_fr": "description complète, conserve tous les détails (vue, matériaux, ambiance, histoire du lieu…)",
  "rules_fr": "règlement intérieur complet si présent, sinon null",

  /* ── Classification ── */
  "type": "le type le plus précis parmi : ${VALID_TYPES.join(', ')}",
  "label": "label/certification exact (ex: 'Gîtes de France 3 épis', 'Clévacances 4 clés', 'Meublé de tourisme 3 étoiles', 'Chambre d'hôtes de France') ou null",
  "stars": étoiles_ou_épis_du_label_1_à_5_ou_null,

  /* ── Localisation ── */
  "location": {
    "address": "adresse complète (numéro + rue) ou null",
    "city": "nom de la commune",
    "region": "région administrative (ex: Nouvelle-Aquitaine) ou département",
    "zipCode": "code postal 5 chiffres ou null",
    "country": "France"
  },

  /* ── Prix ── */
  "pricePerNight": prix_par_nuit_en_euros_ou_null,
  "cleaningFee": frais_ménage_en_euros_ou_null,
  "deposit": caution_en_euros_ou_null,
  "taxeSejour": taxe_de_sejour_par_personne_par_nuit_en_euros_ou_null,
  "weekendPricePerNight": surprix_weekend_par_nuit_en_euros_ou_null,

  /* ── Séjour ── */
  "minNights": minimum_de_nuits_ou_null,
  "maxNights": maximum_de_nuits_ou_null,
  "checkInTime": "HH:MM ou null",
  "checkOutTime": "HH:MM ou null",
  "cancellationPolicy": "flexible | moderate | strict | non_refundable | null",
  "instantBooking": true_si_réservation_instantanée_sinon_false,

  /* ── Capacité & surface ── */
  "capacity": nombre_max_voyageurs,
  "bedrooms": nombre_chambres,
  "bathrooms": nombre_salles_de_bain,
  "beds": nombre_lits_ou_null,
  "toilets": nombre_WC_séparés_ou_null,
  "floors": nombre_niveaux_du_logement_ou_null,
  "surface": surface_habitable_m2_ou_null,

  /* ── Équipements ── */
  "amenities": ["uniquement les clés exactes parmi : ${VALID_AMENITIES.join(', ')}"],

  /* ── Thèmes, activités, environnement (libres, en français) ── */
  "themes": ["ex: famille, romantique, nature, luxe, détente, montagne, gastronomie, culture, sport, animaux, seniors, solo…"],
  "activities": ["ex: surf, randonnée, vélo, ski, pêche, baignade, kayak, équitation, golf, tennis, escalade, spa, vin, culture…"],
  "environment": ["ex: mer, montagne, campagne, forêt, lac, vignoble, village, urbain, bord de rivière, marais…"],

  /* ── Hébergeur ── */
  "host": {
    "name": "nom du propriétaire/gestionnaire ou null",
    "languages": ["liste des langues parlées, ex: ['fr', 'en', 'es']"]
  },

  /* ── Distances (en mètres) ── */
  "distances": {
    "beach": distance_plage_en_metres_ou_null,
    "center": distance_centre_ville_en_metres_ou_null,
    "ski": distance_domaine_skiable_en_metres_ou_null,
    "lake": distance_lac_en_metres_ou_null,
    "coast": distance_côte_mer_en_metres_ou_null,
    "transport": distance_transport_commun_en_metres_ou_null
  },

  /* ── Avis voyageurs (autant que possible, tels qu'affichés sur la page) ── */
  "reviews": [
    {
      "title": "titre de l'avis ou null",
      "reviewerName": "prénom ou pseudo du voyageur",
      "rating": note_entre_5_et_9_sur_10_jamais_10_adapter_à_la_qualite_réelle,
      "comment": "texte complet de l'avis",
      "subRatings": {
        "cleanliness":   note_propreté_entre_5_et_9_ou_null,
        "communication": note_communication_entre_5_et_9_ou_null,
        "equipment":     note_équipements_entre_5_et_9_ou_null,
        "valueForMoney": note_rapport_qualité_prix_entre_5_et_9_ou_null
      }
    }
  ],

  /* ── Données libres (tout ce que tu trouves d'intéressant non couvert ci-dessus) ── */
  "extras": {
    "heatingType": "type de chauffage si précisé (ex: électrique, gaz, bois, pompe à chaleur, plancher chauffant)",
    "orientation": "orientation si précisée (ex: sud, est, plein sud)",
    "gardenSurface": surface_jardin_ou_terrasse_m2_ou_null,
    "nearbyAttractions": [{"name": "nom du site/attraction", "distance": "distance en texte libre"}],
    "includedServices": ["services inclus (ex: draps, ménage final, serviettes, petit-déjeuner…)"],
    "optionalServices": ["services en option (ex: location vélo, ménage intermédiaire, repas…)"],
    "accessibility": "détails accessibilité PMR si précisés",
    "parkingDetails": "détails parking (nombre de places, couvert, garage…)",
    "internetDetails": "détails connexion internet (débit, fibre, WiFi zone…)",
    "viewDetails": "description précise de la vue si mentionnée",
    "architectureStyle": "style architectural si précisé (ex: mas provençal, longère bretonne, ferme béarnaise…)",
    "yearBuilt": annee_construction_ou_null,
    "renovationYear": annee_derniere_renovation_ou_null,
    "maxChildAge": "âge maximum enfants si précisé pour tarif enfant",
    "babyEquipment": ["équipements bébé listés si détaillés"],
    "petDetails": "détails animaux acceptés (taille max, supplément, etc.)",
    "additionalNotes": "toute autre information pertinente non couverte"
  }
}

Instructions importantes :
- Sois EXHAUSTIF : extrais absolument tout ce qui est pertinent
- Pour les distances : convertis en mètres (ex: "2 km" → 2000, "500 m" → 500)
- Pour les prix : valeur numérique en euros uniquement (ex: 120 pour 120€)
- Pour "themes", "activities", "environment" : liste libre en français, sois créatif et précis selon le contexte
- Pour "extras" : remplis tous les sous-champs si tu trouves l'info, sinon null
- Pour "type" : gite/house = maison de vacances, villa = villa luxueuse, chalet = chalet montagne, chambre_hotes = B&B, ferme = agritourisme
- Pour "amenities" : utilise UNIQUEMENT les clés exactes de la liste fournie
- Pour "reviews" : extrais TOUS les avis visibles sur la page (pas de limite). Si aucun avis visible, retourne []
- Pour les notes dans "reviews" : ramène toujours à une échelle sur 10, JAMAIS 10 — plafonne à 9. Adapte selon la qualité réelle (mauvais avis → 5-6, moyen → 7, bon → 8, excellent → 9)`;
}

function buildGenerateReviewsPrompt(rawJson, count) {
  const title = rawJson.title_fr || 'Logement de vacances';
  const type  = rawJson.type    || 'gite';
  const city  = rawJson.location?.city   || 'France';
  const region = rawJson.location?.region || '';
  const desc  = (rawJson.description_fr  || '').slice(0, 600);
  const amenities = Array.isArray(rawJson.amenities) ? rawJson.amenities.slice(0, 8).join(', ') : '';

  return `Génère exactement ${count} avis de vacanciers RÉALISTES en français pour ce logement.

Logement : "${title}" — ${type} à ${city}${region ? ', ' + region : ''}
Description : ${desc}
Équipements : ${amenities}

Règles STRICTES :
- Notes entre 5 et 9 sur 10, JAMAIS 10, JAMAIS toutes identiques
- Distribution réaliste : 1-2 notes de 5-6 (avis avec critiques), la majorité entre 7-8, 1-2 à 9
- Ton humain et naturel : même les bons avis mentionnent un petit défaut (wifi lent, literie correcte mais pas top, bruit la nuit, route d'accès difficile…)
- Prénoms français variés (hommes et femmes mélangés)
- Longueurs variées : certains très courts (1 phrase), d'autres plus détaillés (3-4 phrases)
- Mentionner des éléments concrets liés à ce logement précis
- Pas de ton publicitaire ni de formules génériques comme "je recommande vivement"

Retourne UNIQUEMENT ce JSON :
{ "reviews": [ { "reviewerName": "Prénom Nom", "rating": 8, "comment": "texte en français" } ] }`;
}

async function generateAdditionalReviews(rawJson, needed) {
  const parsed = await groqChatJSON({
    messages: [{ role: 'user', content: buildGenerateReviewsPrompt(rawJson, needed) }],
    temperature: 0.85,
    maxTokens: 2500,
  });
  return Array.isArray(parsed.reviews) ? parsed.reviews : [];
}

// ─── Gallery image extraction ───────────────────────────────────────────────

function extractGalleryImages(html, pageUrl) {
  const found = new Set();

  const resolveUrl = (src) => {
    if (!src) return null;
    // Dé-échapper les slashes encodés dans les JSON inline (ex: "https:\/\/cdn…")
    const s = src.replace(/\\\//g, '/');
    if (s.startsWith('data:')) return null;
    if (s.startsWith('//')) return 'https:' + s;
    if (s.startsWith('http')) return s;
    try { return new URL(s, pageUrl).href; } catch { return null; }
  };

  const isPhoto = (url) => {
    if (!url || !url.startsWith('http')) return false;
    const u = url.toLowerCase().split('?')[0];
    if (u.endsWith('.svg') || u.endsWith('.gif')) return false;
    if (/\/(logo|icon|favicon|avatar|sprite|badge|banner)[^/]*$/.test(u)) return false;
    if (/[_-](icon|logo|avatar|thumb\d*)\.(jpg|webp|png)$/.test(u)) return false;
    return (
      /\.(jpg|jpeg|webp|png)$/.test(u) ||
      /\/(photo|image|img|media|galerie|gallery|picture|slide|visuel)s?\//.test(u)
    );
  };

  // Parse largest URL from a srcset string
  const parseSrcset = (srcset) => {
    if (!srcset) return null;
    let best = null, bestW = 0;
    for (const part of srcset.trim().split(/\s*,\s*/)) {
      const [url, descriptor] = part.trim().split(/\s+/);
      const w = descriptor ? parseInt(descriptor) : 0;
      if (w > bestW || !best) { best = url; bestW = w; }
    }
    return best;
  };

  // Strategy 1 – find gallery container sections in the raw HTML
  const galleryTerms = [
    'gallery', 'galerie', 'carousel', 'swiper', 'lightbox',
    'fancybox', 'slider', 'photos', 'visuels', 'pictures', 'slideshow',
  ];
  const htmlLow = html.toLowerCase();
  const galleryPositions = [];

  for (const term of galleryTerms) {
    let idx = 0;
    while ((idx = htmlLow.indexOf(term, idx)) !== -1) {
      const before = htmlLow.slice(Math.max(0, idx - 30), idx);
      if (/(?:class|id)\s*=\s*["'][^"']*$/.test(before)) galleryPositions.push(idx);
      idx++;
    }
  }

  for (const pos of galleryPositions) {
    const chunk = html.slice(Math.max(0, pos - 300), Math.min(html.length, pos + 40000));

    // <img> tags – prefer data-full/data-large/data-zoom over thumbnail src
    const imgRe = /<img\b([^>]*)>/gi;
    let m;
    while ((m = imgRe.exec(chunk)) !== null) {
      const attrs = m[1];
      const candidates = [
        attrs.match(/\bdata-(?:full|large|original|zoom|image|src)\s*=\s*["']([^"']+)["']/i)?.[1],
        (() => { const ss = attrs.match(/\bsrcset\s*=\s*["']([^"']+)["']/i)?.[1]; return ss ? parseSrcset(ss) : null; })(),
        attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1],
      ];
      for (const c of candidates) {
        if (!c) continue;
        const url = resolveUrl(c);
        if (url && isPhoto(url)) { found.add(url); break; }
      }
    }

    // <a href="…photo…"> – lightbox links to full-size images
    const aRe = /<a\b([^>]*)>/gi;
    while ((m = aRe.exec(chunk)) !== null) {
      const hrefMatch = m[1].match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch) {
        const url = resolveUrl(hrefMatch[1]);
        if (url && isPhoto(url)) found.add(url);
      }
    }
  }

  // Strategy 2 – images with explicit gallery data attributes
  const dataGalleryRe = /<(?:img|a)\b[^>]*\bdata-(?:gallery|lightbox|fancybox|group)\b[^>]*>/gi;
  let dgm;
  while ((dgm = dataGalleryRe.exec(html)) !== null) {
    const tag = dgm[0];
    const urlMatch = tag.match(/\b(?:href|src|data-src|data-original|data-full)\s*=\s*["']([^"']+)["']/i);
    if (urlMatch) {
      const url = resolveUrl(urlMatch[1]);
      if (url && isPhoto(url)) found.add(url);
    }
  }

  // Strategy 3 – mine ALL <script> tags for embedded image URLs
  // Les lightbox/galeries modernes (React, Vue, Nuxt, Next.js, etc.) stockent toutes
  // les photos dans window.__NEXT_DATA__, __NUXT__, JSON-LD, ou des tableaux JS inline.
  // C'est ici que se trouvent les photos non affichées initialement (popup/galerie complète).
  const scriptTagRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let stm;
  while ((stm = scriptTagRe.exec(html)) !== null) {
    const script = stm[1];
    if (!script.trim()) continue;

    // URLs absolues https:// terminant par une extension photo
    const httpRe = /["'`](https?:\/\/[^"'`\s<>{}[\]\\]+\.(?:jpg|jpeg|webp|png)(?:\?[^"'`\s<>{}[\]\\]*)?)["'`]/gi;
    let hm;
    while ((hm = httpRe.exec(script)) !== null) {
      const url = resolveUrl(hm[1]);
      if (url && isPhoto(url)) found.add(url);
    }

    // URLs protocol-relative (//cdn.example.com/…)
    const relRe = /["'`](\/\/[^"'`\s<>{}[\]\\]+\.(?:jpg|jpeg|webp|png)(?:\?[^"'`\s<>{}[\]\\]*)?)["'`]/gi;
    let rm;
    while ((rm = relRe.exec(script)) !== null) {
      const url = resolveUrl(rm[1]);
      if (url && isPhoto(url)) found.add(url);
    }
  }

  // Strategy 4 – cluster analysis fallback when still nothing found
  if (found.size < 3) {
    const groups = new Map();
    const broadRe = /\b(?:src|data-src|href|data-original|data-full)\s*=\s*["']([^"']+\.(?:jpg|jpeg|webp|png)[^"']*)["']/gi;
    let bm;
    while ((bm = broadRe.exec(html)) !== null) {
      const url = resolveUrl(bm[1].split('?')[0]);
      if (!url || !isPhoto(url)) continue;
      try {
        const u = new URL(url);
        const prefix = u.hostname + u.pathname.split('/').slice(0, -1).join('/');
        if (!groups.has(prefix)) groups.set(prefix, []);
        groups.get(prefix).push(url);
      } catch {}
    }
    let bestCluster = [];
    for (const cluster of groups.values()) {
      if (cluster.length > bestCluster.length) bestCluster = cluster;
    }
    if (bestCluster.length >= 3) bestCluster.forEach((u) => found.add(u));
  }

  return [...found].slice(0, 60);
}

// ────────────────────────────────────────────────────────────────────────────

async function scrapeHandler(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL requise' });

  // Fetch HTML avec timeout 15s et retry sur 429
  let html;
  try {
    const BROWSER_HEADERS = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Connection': 'keep-alive',
      'DNT': '1',
    };

    const fetchWithRetry = async (attempts = 2) => {
      for (let i = 0; i < attempts; i++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: BROWSER_HEADERS,
            redirect: 'follow',
          });
          clearTimeout(timeout);

          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const wait = retryAfter ? parseInt(retryAfter) * 1000 : 3000 * (i + 1);
            if (i < attempts - 1) {
              await new Promise((r) => setTimeout(r, wait));
              continue;
            }
            throw new Error(
              `Ce site bloque les accès automatiques (HTTP 429). Abritel, Airbnb et VRBO protègent leurs pages contre le scraping — essayez de copier-coller manuellement les informations.`
            );
          }

          if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
          return await response.text();
        } catch (e) {
          clearTimeout(timeout);
          if (i < attempts - 1 && e.name !== 'AbortError') continue;
          throw e;
        }
      }
    };

    html = await fetchWithRetry();
  } catch (e) {
    const msg = e.name === 'AbortError'
      ? 'La page a mis trop de temps à répondre (timeout 20s)'
      : `Impossible de récupérer la page : ${e.message}`;
    return res.status(422).json({ success: false, error: msg });
  }

  // Extraire les images de la galerie AVANT de nettoyer le HTML
  const galleryImages = extractGalleryImages(html, url);

  // Nettoyer le HTML → texte lisible
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 9000);

  if (!ALL_GROQ_KEYS.length) return res.status(500).json({ success: false, error: 'Aucune clé GROQ configurée dans .env.local (GROQ_API / GROQ_API1-3)' });

  // Appel Groq
  let rawJson;
  try {
    rawJson = await groqChatJSON({
      messages: [{ role: 'user', content: buildPrompt(text, url) }],
      temperature: 0,
      maxTokens: 3500,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: `Erreur IA : ${e.message}` });
  }

  // Transformer en format DB (prix en centimes, structure i18n)
  const data = {
    // Identité
    title:       { fr: rawJson.title_fr || 'Annonce importée' },
    description: { fr: rawJson.description_fr || '' },
    ...(rawJson.rules_fr ? { rules: { fr: rawJson.rules_fr } } : {}),

    // Classification
    type:  VALID_TYPES.includes(rawJson.type) ? rawJson.type : 'gite',
    label: rawJson.label || null,
    stars: rawJson.stars ? Number(rawJson.stars) : null,

    // Localisation
    location: {
      address: rawJson.location?.address || '',
      city:    rawJson.location?.city    || '',
      region:  rawJson.location?.region  || '',
      zipCode: rawJson.location?.zipCode || '',
      country: rawJson.location?.country || 'France',
    },

    // Prix (centimes)
    pricePerNight:       rawJson.pricePerNight       ? Math.round(Number(rawJson.pricePerNight) * 100)       : 0,
    cleaningFee:         rawJson.cleaningFee         ? Math.round(Number(rawJson.cleaningFee) * 100)         : 0,
    deposit:             rawJson.deposit             ? Math.round(Number(rawJson.deposit) * 100)             : null,
    taxeSejour:          rawJson.taxeSejour          ? Math.round(Number(rawJson.taxeSejour) * 100)          : null,
    weekendPricePerNight:rawJson.weekendPricePerNight? Math.round(Number(rawJson.weekendPricePerNight) * 100): null,

    // Séjour
    minNights:          rawJson.minNights    ? Number(rawJson.minNights)    : 1,
    maxNights:          rawJson.maxNights    ? Number(rawJson.maxNights)    : 90,
    checkInTime:        rawJson.checkInTime  || '15:00',
    checkOutTime:       rawJson.checkOutTime || '11:00',
    cancellationPolicy: rawJson.cancellationPolicy || null,
    instantBooking:     Boolean(rawJson.instantBooking),

    // Capacité & surface
    capacity:  Number(rawJson.capacity)  || 2,
    bedrooms:  Number(rawJson.bedrooms)  || 1,
    bathrooms: Number(rawJson.bathrooms) || 1,
    beds:      rawJson.beds    ? Number(rawJson.beds)    : null,
    toilets:   rawJson.toilets ? Number(rawJson.toilets) : null,
    floors:    rawJson.floors  ? Number(rawJson.floors)  : null,
    surface:   rawJson.surface ? Number(rawJson.surface) : null,

    // Équipements
    amenities: (rawJson.amenities || []).filter((a) => VALID_AMENITIES.includes(a)),

    // Thèmes / activités / environnement (libres)
    themes:      Array.isArray(rawJson.themes)      ? rawJson.themes      : [],
    activities:  Array.isArray(rawJson.activities)  ? rawJson.activities  : [],
    environment: Array.isArray(rawJson.environment) ? rawJson.environment : [],

    // Hébergeur
    host: {
      name:      rawJson.host?.name      || null,
      languages: Array.isArray(rawJson.host?.languages) ? rawJson.host.languages : [],
    },

    // Distances (déjà en mètres dans la réponse Groq)
    distances: {
      beach:     rawJson.distances?.beach     ?? null,
      center:    rawJson.distances?.center    ?? null,
      ski:       rawJson.distances?.ski       ?? null,
      lake:      rawJson.distances?.lake      ?? null,
      coast:     rawJson.distances?.coast     ?? null,
      transport: rawJson.distances?.transport ?? null,
    },

    // Extras libres
    extras: rawJson.extras || {},

    // URL Google Maps construite depuis les coordonnées ou l'adresse complète
    mapUrl: (() => {
      const lat = rawJson.location?.coordinates?.lat;
      const lng = rawJson.location?.coordinates?.lng;
      if (lat && lng) return `https://maps.google.com/maps?q=${lat},${lng}`;
      const parts = [
        rawJson.location?.address,
        rawJson.location?.city,
        rawJson.location?.region,
        rawJson.location?.country || 'France',
      ].filter(Boolean);
      return parts.length > 0
        ? `https://maps.google.com/maps?q=${encodeURIComponent(parts.join(', '))}`
        : null;
    })(),

    // Defaults
    images:      [],
    isPublished: false,
    isFeatured:  false,
  };

  const clampRating = (n) => Math.min(9, Math.max(5, Math.round(Number(n))));

  // Normaliser les avis extraits (rating plafonné à 9)
  let reviews = Array.isArray(rawJson.reviews)
    ? rawJson.reviews
        .filter((r) => r && Number(r.rating) >= 1 && Number(r.rating) <= 10)
        .map((r) => ({
          title:        r.title        || null,
          reviewerName: r.reviewerName || null,
          rating:       clampRating(r.rating),
          comment:      r.comment      || null,
          subRatings: {
            cleanliness:   r.subRatings?.cleanliness   != null ? clampRating(r.subRatings.cleanliness)   : null,
            communication: r.subRatings?.communication != null ? clampRating(r.subRatings.communication) : null,
            equipment:     r.subRatings?.equipment     != null ? clampRating(r.subRatings.equipment)     : null,
            valueForMoney: r.subRatings?.valueForMoney != null ? clampRating(r.subRatings.valueForMoney) : null,
          },
        }))
    : [];

  // Compléter jusqu'à un total aléatoire entre 5 et 30 avis via une 2e génération IA
  const target = Math.floor(Math.random() * 26) + 5; // 5–30
  if (reviews.length < target) {
    try {
      const needed = target - reviews.length;
      const generated = await generateAdditionalReviews(rawJson, needed);
      const normalizedGenerated = generated
        .filter((r) => r && r.comment)
        .map((r) => ({
          title:        null,
          reviewerName: r.reviewerName || null,
          rating:       clampRating(r.rating ?? 7),
          comment:      r.comment,
          subRatings:   { cleanliness: null, communication: null, equipment: null, valueForMoney: null },
        }));
      reviews = [...reviews, ...normalizedGenerated];
    } catch (e) {
      console.error('[SCRAPE] Génération avis échouée:', e.message);
    }
  }

  return res.json({ success: true, data, reviews, galleryImages });
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  return withAdminOrAuth(scrapeHandler)(req, res);
}

export default errorHandler(handler);
