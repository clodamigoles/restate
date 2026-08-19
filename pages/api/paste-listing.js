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

${url ? `URL : ${url}\n` : ''}
Contenu de la page :
---
${text}
---

Retourne un objet JSON complet. Utilise null pour tout champ non trouvé (jamais de chaîne vide).

{
  "title_fr": "titre exact de l'annonce",
  "description_fr": "description complète, conserve tous les détails (vue, matériaux, ambiance, histoire du lieu…)",
  "rules_fr": "règlement intérieur complet si présent, sinon null",
  "type": "le type le plus précis parmi : ${VALID_TYPES.join(', ')}",
  "label": "label/certification exact (ex: 'Gîtes de France 3 épis', 'Clévacances 4 clés', 'Meublé de tourisme 3 étoiles', 'Chambre d'hôtes de France') ou null",
  "stars": null,
  "location": {
    "address": "adresse complète (numéro + rue) ou null",
    "city": "nom de la commune",
    "region": "région administrative (ex: Nouvelle-Aquitaine) ou département",
    "zipCode": "code postal 5 chiffres ou null",
    "country": "France"
  },
  "pricePerNight": null,
  "cleaningFee": null,
  "deposit": null,
  "taxeSejour": null,
  "weekendPricePerNight": null,
  "minNights": null,
  "maxNights": null,
  "checkInTime": null,
  "checkOutTime": null,
  "cancellationPolicy": null,
  "instantBooking": false,
  "capacity": null,
  "bedrooms": null,
  "bathrooms": null,
  "beds": null,
  "toilets": null,
  "floors": null,
  "surface": null,
  "amenities": ["uniquement les clés exactes parmi : ${VALID_AMENITIES.join(', ')}"],
  "themes": ["ex: famille, romantique, nature, luxe…"],
  "activities": ["ex: surf, randonnée, vélo, ski…"],
  "environment": ["ex: mer, montagne, campagne, forêt…"],
  "host": {
    "name": null,
    "languages": []
  },
  "distances": {
    "beach": null,
    "center": null,
    "ski": null,
    "lake": null,
    "coast": null,
    "transport": null
  },
  "reviews": [
    {
      "title": null,
      "reviewerName": "prénom ou pseudo du voyageur",
      "rating": 8,
      "comment": "texte complet de l'avis",
      "subRatings": {
        "cleanliness": null,
        "communication": null,
        "equipment": null,
        "valueForMoney": null
      }
    }
  ],
  "extras": {
    "heatingType": null,
    "orientation": null,
    "gardenSurface": null,
    "nearbyAttractions": [],
    "includedServices": [],
    "optionalServices": [],
    "accessibility": null,
    "parkingDetails": null,
    "internetDetails": null,
    "viewDetails": null,
    "architectureStyle": null,
    "yearBuilt": null,
    "renovationYear": null,
    "maxChildAge": null,
    "babyEquipment": [],
    "petDetails": null,
    "additionalNotes": null
  }
}

Instructions importantes :
- Sois EXHAUSTIF : extrais absolument tout ce qui est pertinent
- Pour les distances : convertis en mètres (ex: "2 km" → 2000, "500 m" → 500)
- Pour les prix : valeur numérique en euros uniquement
- Pour "amenities" : utilise UNIQUEMENT les clés exactes de la liste fournie
- Pour les notes dans "reviews" : ramène à une échelle sur 10, JAMAIS 10 — plafonne à 9`;
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
- Ton humain et naturel : même les bons avis mentionnent un petit défaut
- Prénoms français variés (hommes et femmes mélangés)
- Longueurs variées : certains très courts (1 phrase), d'autres plus détaillés (3-4 phrases)
- Mentionner des éléments concrets liés à ce logement précis
- Pas de ton publicitaire ni de formules génériques

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

async function pasteHandler(req, res) {
  const { text, url } = req.body;
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ success: false, error: 'Contenu trop court — collez le texte complet de la page.' });
  }

  if (!ALL_GROQ_KEYS.length) return res.status(500).json({ success: false, error: 'Aucune clé GROQ configurée dans .env.local (GROQ_API / GROQ_API1-3)' });

  // Nettoyer et limiter le texte
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 9000);

  // Appel Groq
  let rawJson;
  try {
    rawJson = await groqChatJSON({
      messages: [{ role: 'user', content: buildPrompt(cleanText, url) }],
      temperature: 0,
      maxTokens: 3500,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: `Erreur IA : ${e.message}` });
  }

  const data = {
    title:       { fr: rawJson.title_fr || 'Annonce importée' },
    description: { fr: rawJson.description_fr || '' },
    ...(rawJson.rules_fr ? { rules: { fr: rawJson.rules_fr } } : {}),
    type:  VALID_TYPES.includes(rawJson.type) ? rawJson.type : 'gite',
    label: rawJson.label || null,
    stars: rawJson.stars ? Number(rawJson.stars) : null,
    location: {
      address: rawJson.location?.address || '',
      city:    rawJson.location?.city    || '',
      region:  rawJson.location?.region  || '',
      zipCode: rawJson.location?.zipCode || '',
      country: rawJson.location?.country || 'France',
    },
    pricePerNight:        rawJson.pricePerNight        ? Math.round(Number(rawJson.pricePerNight) * 100)        : 0,
    cleaningFee:          rawJson.cleaningFee          ? Math.round(Number(rawJson.cleaningFee) * 100)          : 0,
    deposit:              rawJson.deposit              ? Math.round(Number(rawJson.deposit) * 100)              : null,
    taxeSejour:           rawJson.taxeSejour           ? Math.round(Number(rawJson.taxeSejour) * 100)           : null,
    weekendPricePerNight: rawJson.weekendPricePerNight ? Math.round(Number(rawJson.weekendPricePerNight) * 100) : null,
    minNights:          rawJson.minNights    ? Number(rawJson.minNights)    : 1,
    maxNights:          rawJson.maxNights    ? Number(rawJson.maxNights)    : 90,
    checkInTime:        rawJson.checkInTime  || '15:00',
    checkOutTime:       rawJson.checkOutTime || '11:00',
    cancellationPolicy: rawJson.cancellationPolicy || null,
    instantBooking:     Boolean(rawJson.instantBooking),
    capacity:  Number(rawJson.capacity)  || 2,
    bedrooms:  Number(rawJson.bedrooms)  || 1,
    bathrooms: Number(rawJson.bathrooms) || 1,
    beds:      rawJson.beds    ? Number(rawJson.beds)    : null,
    toilets:   rawJson.toilets ? Number(rawJson.toilets) : null,
    floors:    rawJson.floors  ? Number(rawJson.floors)  : null,
    surface:   rawJson.surface ? Number(rawJson.surface) : null,
    amenities: (rawJson.amenities || []).filter((a) => VALID_AMENITIES.includes(a)),
    themes:      Array.isArray(rawJson.themes)      ? rawJson.themes      : [],
    activities:  Array.isArray(rawJson.activities)  ? rawJson.activities  : [],
    environment: Array.isArray(rawJson.environment) ? rawJson.environment : [],
    host: {
      name:      rawJson.host?.name      || null,
      languages: Array.isArray(rawJson.host?.languages) ? rawJson.host.languages : [],
    },
    distances: {
      beach:     rawJson.distances?.beach     ?? null,
      center:    rawJson.distances?.center    ?? null,
      ski:       rawJson.distances?.ski       ?? null,
      lake:      rawJson.distances?.lake      ?? null,
      coast:     rawJson.distances?.coast     ?? null,
      transport: rawJson.distances?.transport ?? null,
    },
    extras: rawJson.extras || {},
    mapUrl: (() => {
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
    images:      [],
    isPublished: false,
    isFeatured:  false,
  };

  const clampRating = (n) => Math.min(9, Math.max(5, Math.round(Number(n))));

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

  const target = Math.floor(Math.random() * 26) + 5;
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
      console.error('[PASTE] Génération avis échouée:', e.message);
    }
  }

  return res.json({ success: true, data, reviews });
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  return withAdminOrAuth(pasteHandler)(req, res);
}

export default errorHandler(handler);
