import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';

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

  /* ── Avis voyageurs (max 10, tels qu'affichés sur la page) ── */
  "reviews": [
    {
      "title": "titre de l'avis ou null",
      "reviewerName": "prénom ou pseudo du voyageur",
      "rating": note_sur_10,
      "comment": "texte complet de l'avis",
      "subRatings": {
        "cleanliness":   note_propreté_sur_10_ou_null,
        "communication": note_communication_sur_10_ou_null,
        "equipment":     note_équipements_sur_10_ou_null,
        "valueForMoney": note_rapport_qualité_prix_sur_10_ou_null
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
- Pour "reviews" : extrais au maximum 10 avis. Si aucun avis visible sur la page, retourne []
- Pour les notes dans "reviews" : si la page affiche des notes sur 5, multiplie par 2 pour normaliser sur 10`;
}

async function scrapeHandler(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL requise' });

  // Fetch HTML avec timeout 15s
  let html;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    html = await response.text();
  } catch (e) {
    const msg = e.name === 'AbortError'
      ? 'La page a mis trop de temps à répondre (timeout 15s)'
      : `Impossible de récupérer la page : ${e.message}`;
    return res.status(422).json({ success: false, error: msg });
  }

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
    .slice(0, 14000);

  const groqKey = process.env.GROQ_API || process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ success: false, error: 'GROQ_API non configurée dans .env.local' });

  // Appel Groq
  let rawJson;
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: buildPrompt(text, url) }],
        temperature: 0,
        response_format: { type: 'json_object' },
        max_tokens: 4500,
      }),
    });
    const groqData = await groqRes.json();
    if (!groqRes.ok) throw new Error(groqData.error?.message || `Groq error ${groqRes.status}`);
    rawJson = JSON.parse(groqData.choices[0].message.content);
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

    // Defaults
    images:      [],
    isPublished: false,
    isFeatured:  false,
  };

  // Normaliser les avis extraits
  const reviews = Array.isArray(rawJson.reviews)
    ? rawJson.reviews
        .filter((r) => r && r.rating >= 1 && r.rating <= 10)
        .slice(0, 10)
        .map((r) => ({
          title:        r.title        || null,
          reviewerName: r.reviewerName || null,
          rating:       Number(r.rating),
          comment:      r.comment      || null,
          subRatings: {
            cleanliness:   r.subRatings?.cleanliness   ?? null,
            communication: r.subRatings?.communication ?? null,
            equipment:     r.subRatings?.equipment     ?? null,
            valueForMoney: r.subRatings?.valueForMoney ?? null,
          },
        }))
    : [];

  return res.json({ success: true, data, reviews });
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  return withAdminOrAuth(scrapeHandler)(req, res);
}

export default errorHandler(handler);
