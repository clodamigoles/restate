import { formatPrice as _formatPrice, formatPriceShort as _formatPriceShort } from '@/lib/currencies';

// ─── Types de biens ────────────────────────────────────────────
export const PROPERTY_TYPES = [
  'apartment', 'villa', 'studio', 'gite', 'house', 'space',
  'chambre_hotes', 'chalet', 'camping', 'ferme', 'bungalow',
  'hotel', 'rare', 'village', 'bateau',
];

export const PROPERTY_TYPE_LABELS = {
  apartment:     { fr: 'Appartement de vacances', en: 'Vacation apartment', de: 'Ferienwohnung',     es: 'Apartamento vacacional', it: 'Appartamento vacanze', pt: 'Apartamento ferias', nl: 'Vakantieappartement' },
  villa:         { fr: 'Villa',                   en: 'Villa',              de: 'Villa',              es: 'Villa',                  it: 'Villa',               pt: 'Vila',              nl: 'Villa' },
  studio:        { fr: 'Studio',                  en: 'Studio',             de: 'Studio',             es: 'Estudio',                it: 'Monolocale',          pt: 'Estudio',           nl: 'Studio' },
  gite:          { fr: 'Gite / Maison vacances',  en: 'Gite / Holiday home',de: 'Ferienhaus',         es: 'Casa rural',             it: 'Casale',              pt: 'Casa de campo',     nl: 'Vakantiehuis' },
  house:         { fr: 'Maison',                  en: 'House',              de: 'Haus',               es: 'Casa',                   it: 'Casa',                pt: 'Casa',              nl: 'Huis' },
  space:         { fr: 'Espace atypique',         en: 'Unique space',       de: 'Besonderer Raum',    es: 'Espacio atipico',        it: 'Spazio atipico',      pt: 'Espaco atipico',    nl: 'Bijzondere ruimte' },
  chambre_hotes: { fr: "Chambre d'hotes",         en: 'Bed & Breakfast',    de: 'Gastezimmer',        es: 'Casa de huespedes',      it: 'Bed & Breakfast',     pt: 'Quarto de hospedes',nl: 'Bed & Breakfast' },
  chalet:        { fr: 'Chalet',                  en: 'Chalet',             de: 'Chalet',             es: 'Chalet',                 it: 'Chalet',              pt: 'Chale',             nl: 'Chalet' },
  camping:       { fr: 'Camping',                 en: 'Camping',            de: 'Camping',            es: 'Camping',                it: 'Campeggio',           pt: 'Camping',           nl: 'Camping' },
  ferme:         { fr: 'Ferme & agritourisme',    en: 'Farm & agritourism', de: 'Bauernhof',          es: 'Granja y agroturismo',   it: 'Agriturismo',         pt: 'Agroturismo',       nl: 'Boerderij' },
  bungalow:      { fr: 'Bungalow',                en: 'Bungalow',           de: 'Bungalow',           es: 'Bungalow',               it: 'Bungalow',            pt: 'Bungalow',          nl: 'Bungalow' },
  hotel:         { fr: 'Hotel',                   en: 'Hotel',              de: 'Hotel',              es: 'Hotel',                  it: 'Hotel',               pt: 'Hotel',             nl: 'Hotel' },
  rare:          { fr: 'Propriete rare',          en: 'Unique property',    de: 'Besondere Unterkunft',es: 'Propiedad especial',    it: 'Proprieta speciale',  pt: 'Propriedade unica', nl: 'Bijzonder verblijf' },
  village:       { fr: 'Village de vacances',     en: 'Holiday village',    de: 'Feriendorf',         es: 'Pueblo vacacional',      it: 'Villaggio vacanze',   pt: 'Aldeia de ferias',  nl: 'Vakantiedorp' },
  bateau:        { fr: 'Bateau',                  en: 'Boat',               de: 'Boot',               es: 'Barco',                  it: 'Barca',               pt: 'Barco',             nl: 'Boot' },
};

// ─── Amenities — liste complète ─────────────────────────────────
export const AMENITY_LABELS = {
  // Essentiels
  wifi:                 { fr: 'WiFi',                              en: 'WiFi',                   de: 'WLAN',                    es: 'WiFi',                     it: 'WiFi',                   pt: 'WiFi',                  nl: 'WiFi' },
  kitchen:              { fr: 'Cuisine equipee',                   en: 'Kitchen',                de: 'Kueche',                  es: 'Cocina',                   it: 'Cucina',                 pt: 'Cozinha',               nl: 'Keuken' },
  parking:              { fr: 'Parking',                           en: 'Parking',                de: 'Parkplatz',               es: 'Aparcamiento',             it: 'Parcheggio',             pt: 'Estacionamento',        nl: 'Parkeerplaats' },
  tv:                   { fr: 'TV',                                en: 'TV',                     de: 'TV',                      es: 'TV',                       it: 'TV',                     pt: 'TV',                    nl: 'TV' },
  air_conditioning:     { fr: 'Climatisation',                     en: 'Air conditioning',       de: 'Klimaanlage',             es: 'Aire acondicionado',       it: 'Aria condizionata',      pt: 'Ar condicionado',       nl: 'Airconditioning' },
  heating:              { fr: 'Chauffage',                         en: 'Heating',                de: 'Heizung',                 es: 'Calefaccion',              it: 'Riscaldamento',          pt: 'Aquecimento',           nl: 'Verwarming' },
  workspace:            { fr: 'Espace de travail',                 en: 'Workspace',              de: 'Arbeitsplatz',            es: 'Zona de trabajo',          it: 'Spazio lavoro',          pt: 'Area de trabalho',      nl: 'Werkruimte' },
  // Cuisine
  dishwasher:           { fr: 'Lave-vaisselle',                    en: 'Dishwasher',             de: 'Geschirrspuler',          es: 'Lavavajillas',             it: 'Lavastoviglie',          pt: 'Maquina de lavar louca',nl: 'Vaatwasser' },
  fridge:               { fr: 'Refrigerateur',                     en: 'Fridge',                 de: 'Kuehlschrank',            es: 'Nevera',                   it: 'Frigorifero',            pt: 'Frigorifico',           nl: 'Koelkast' },
  microwave:            { fr: 'Micro-ondes',                       en: 'Microwave',              de: 'Mikrowelle',              es: 'Microondas',               it: 'Microonde',              pt: 'Micro-ondas',           nl: 'Magnetron' },
  bbq:                  { fr: 'Barbecue',                          en: 'BBQ',                    de: 'Grill',                   es: 'Barbacoa',                 it: 'Barbecue',               pt: 'Churrasqueira',         nl: 'Barbecue' },
  breakfast:            { fr: 'Petit-dejeuner inclus',             en: 'Breakfast included',     de: 'Fruhstuck inklusive',     es: 'Desayuno incluido',        it: 'Colazione inclusa',      pt: 'Pequeno-almoco incluido',nl: 'Ontbijt inbegrepen' },
  // Exterieur & piscine
  pool:                 { fr: 'Piscine commune',                   en: 'Shared pool',            de: 'Gemeinschaftspool',       es: 'Piscina comun',            it: 'Piscina condivisa',      pt: 'Piscina partilhada',    nl: 'Gedeeld zwembad' },
  private_pool:         { fr: 'Piscine privee',                    en: 'Private pool',           de: 'Privater Pool',           es: 'Piscina privada',          it: 'Piscina privata',        pt: 'Piscina privada',       nl: 'Prive zwembad' },
  garden:               { fr: 'Jardin',                            en: 'Garden',                 de: 'Garten',                  es: 'Jardin',                   it: 'Giardino',               pt: 'Jardim',                nl: 'Tuin' },
  balcony:              { fr: 'Balcon / Terrasse',                 en: 'Balcony / Terrace',      de: 'Balkon / Terrasse',       es: 'Balcon / Terraza',         it: 'Balcone / Terrazza',     pt: 'Varanda / Terraco',     nl: 'Balkon / Terras' },
  fenced:               { fr: 'Propriete cloturee',                en: 'Fenced property',        de: 'Eingezauntes Grundstuck', es: 'Propiedad cercada',        it: 'Proprieta recintata',    pt: 'Propriedade vedada',    nl: 'Omheind terrein' },
  bike_rental:          { fr: 'Location de velo',                  en: 'Bike rental',            de: 'Fahrradvermietung',       es: 'Alquiler de bicicletas',   it: 'Noleggio biciclette',    pt: 'Aluguer de bicicletas', nl: 'Fietsverhuur' },
  // Bien-etre
  hot_tub:              { fr: 'Jacuzzi',                           en: 'Hot tub / Jacuzzi',      de: 'Whirlpool',               es: 'Jacuzzi',                  it: 'Vasca idromassaggio',    pt: 'Jacuzzi',               nl: 'Jacuzzi' },
  sauna:                { fr: 'Sauna',                             en: 'Sauna',                  de: 'Sauna',                   es: 'Sauna',                    it: 'Sauna',                  pt: 'Sauna',                 nl: 'Sauna' },
  gym:                  { fr: 'Salle de sport',                    en: 'Gym',                    de: 'Fitnessstudio',           es: 'Gimnasio',                 it: 'Palestra',               pt: 'Ginasio',               nl: 'Sportschool' },
  fireplace:            { fr: 'Cheminee',                          en: 'Fireplace',              de: 'Kamin',                   es: 'Chimenea',                 it: 'Camino',                 pt: 'Lareira',               nl: 'Open haard' },
  // Linge
  washer:               { fr: 'Lave-linge',                        en: 'Washing machine',        de: 'Waschmaschine',           es: 'Lavadora',                 it: 'Lavatrice',              pt: 'Maquina de lavar',      nl: 'Wasmachine' },
  dryer:                { fr: 'Seche-linge',                       en: 'Dryer',                  de: 'Trockner',                es: 'Secadora',                 it: 'Asciugatrice',           pt: 'Secadora',              nl: 'Droger' },
  // Vues
  sea_view:             { fr: 'Vue sur mer',                       en: 'Sea view',               de: 'Meerblick',               es: 'Vista al mar',             it: 'Vista mare',             pt: 'Vista mar',             nl: 'Zeezicht' },
  lake_view:            { fr: 'Vue sur lac',                       en: 'Lake view',              de: 'Seeblick',                es: 'Vista al lago',            it: 'Vista lago',             pt: 'Vista lago',            nl: 'Meer uitzicht' },
  mountain_view:        { fr: 'Vue sur montagne',                  en: 'Mountain view',          de: 'Bergblick',               es: 'Vista montana',            it: 'Vista montagna',         pt: 'Vista montanha',        nl: 'Bergzicht' },
  // Accessibilite
  wheelchair_accessible:{ fr: 'Accessible PMR',                    en: 'Wheelchair accessible',  de: 'Rollstuhlgerecht',        es: 'Accesible PMR',            it: 'Accessibile disabili',   pt: 'Acessivel PMR',         nl: 'Rolstoeltoegankelijk' },
  elevator:             { fr: 'Ascenseur',                         en: 'Elevator',               de: 'Aufzug',                  es: 'Ascensor',                 it: 'Ascensore',              pt: 'Elevador',              nl: 'Lift' },
  ev_charger:           { fr: 'Borne recharge vehicule electrique',en: 'EV charger',             de: 'Elektroauto-Ladestation', es: 'Cargador vehiculo electrico',it: 'Ricarica auto elettrica',pt: 'Carregador eletrico',  nl: 'EV lader' },
  // Pour les enfants
  cot:                  { fr: 'Lit bebe',                          en: 'Baby cot',               de: 'Babybett',                es: 'Cuna bebe',                it: 'Lettino bambino',        pt: 'Berco bebe',            nl: 'Babybedje' },
  high_chair:           { fr: 'Chaise haute',                      en: 'High chair',             de: 'Hochstuhl',               es: 'Trona',                    it: 'Seggiolone',             pt: 'Cadeira alta',          nl: 'Kinderstoel' },
  playground:           { fr: 'Terrain de jeux',                   en: 'Playground',             de: 'Spielplatz',              es: 'Parque infantil',          it: 'Area giochi',            pt: 'Parque infantil',       nl: 'Speeltuin' },
  family_friendly:      { fr: 'Adapte aux familles',               en: 'Family friendly',        de: 'Familienfreundlich',      es: 'Apto familias',            it: 'Adatto famiglie',        pt: 'Adequado familias',     nl: 'Gezinsvriendelijk' },
  childcare:            { fr: "Garde d'enfants disponible",         en: 'Childcare available',    de: 'Kinderbetreuung',         es: 'Guarderia disponible',     it: 'Babysitter disponibile', pt: 'Guarda criancas',       nl: 'Kinderopvang' },
  // Regles & politique
  pets_allowed:         { fr: 'Animaux acceptes',                  en: 'Pets allowed',           de: 'Haustiere erlaubt',       es: 'Mascotas permitidas',      it: 'Animali ammessi',        pt: 'Animais permitidos',    nl: 'Huisdieren toegestaan' },
  no_pets:              { fr: 'Animaux interdits',                  en: 'No pets',                de: 'Keine Haustiere',         es: 'Sin mascotas',             it: 'Animali vietati',        pt: 'Sem animais',           nl: 'Geen huisdieren' },
  smoking_allowed:      { fr: 'Fumeurs acceptes',                  en: 'Smoking allowed',        de: 'Rauchen erlaubt',         es: 'Se permite fumar',         it: 'Fumatori ammessi',       pt: 'Permitido fumar',       nl: 'Roken toegestaan' },
  non_smoking:          { fr: 'Non-fumeur',                        en: 'Non-smoking',            de: 'Nichtraucher',            es: 'No fumadores',             it: 'Non fumatori',           pt: 'Nao fumador',           nl: 'Niet roken' },
};

export const AMENITIES = Object.keys(AMENITY_LABELS);

// Categories d'equipements pour le formulaire
export const AMENITY_CATEGORIES = [
  {
    key: 'essentials',
    label: { fr: 'Essentiels', en: 'Essentials' },
    amenities: ['wifi', 'kitchen', 'parking', 'tv', 'air_conditioning', 'heating', 'workspace'],
  },
  {
    key: 'kitchen',
    label: { fr: 'Cuisine & repas', en: 'Kitchen & meals' },
    amenities: ['dishwasher', 'fridge', 'microwave', 'bbq', 'breakfast'],
  },
  {
    key: 'outdoor',
    label: { fr: 'Exterieur & piscine', en: 'Outdoor & pool' },
    amenities: ['pool', 'private_pool', 'garden', 'balcony', 'fenced', 'bike_rental'],
  },
  {
    key: 'wellness',
    label: { fr: 'Bien-etre & loisirs', en: 'Wellness & leisure' },
    amenities: ['hot_tub', 'sauna', 'gym', 'fireplace'],
  },
  {
    key: 'laundry',
    label: { fr: 'Linge & entretien', en: 'Laundry' },
    amenities: ['washer', 'dryer'],
  },
  {
    key: 'views',
    label: { fr: 'Vues', en: 'Views' },
    amenities: ['sea_view', 'lake_view', 'mountain_view'],
  },
  {
    key: 'accessibility',
    label: { fr: 'Accessibilite', en: 'Accessibility' },
    amenities: ['wheelchair_accessible', 'elevator', 'ev_charger'],
  },
  {
    key: 'children',
    label: { fr: 'Pour les enfants', en: 'For children' },
    amenities: ['cot', 'high_chair', 'playground', 'family_friendly', 'childcare'],
  },
  {
    key: 'rules',
    label: { fr: 'Regles & politique', en: 'Rules & policy' },
    amenities: ['pets_allowed', 'no_pets', 'smoking_allowed', 'non_smoking'],
  },
];

// ─── Distances — champs et valeurs possibles ───────────────────
export const DISTANCE_FIELDS = [
  { key: 'transport', label: { fr: 'Transports en commun', en: 'Public transport' } },
  { key: 'beach',     label: { fr: 'Plage', en: 'Beach' } },
  { key: 'center',    label: { fr: 'Centre-ville / village', en: 'Town center' } },
  { key: 'coast',     label: { fr: 'Cote / bord de mer', en: 'Coast / seafront' } },
  { key: 'lake',      label: { fr: 'Lac', en: 'Lake' } },
  { key: 'ski',       label: { fr: 'Domaine skiable', en: 'Ski resort' } },
];

// ─── Statuts reservations ──────────────────────────────────────
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export const BOOKING_STATUS_LABELS = {
  pending:   { fr: 'En attente', en: 'Pending',   de: 'Ausstehend', es: 'Pendiente',  it: 'In attesa',  pt: 'Pendente',    nl: 'In afwachting' },
  confirmed: { fr: 'Confirmee',  en: 'Confirmed', de: 'Bestaetigt', es: 'Confirmada', it: 'Confermata', pt: 'Confirmada',  nl: 'Bevestigd' },
  cancelled: { fr: 'Annulee',    en: 'Cancelled', de: 'Storniert',  es: 'Cancelada',  it: 'Annullata',  pt: 'Cancelada',   nl: 'Geannuleerd' },
  completed: { fr: 'Terminee',   en: 'Completed', de: 'Abgeschlossen', es: 'Completada', it: 'Completata', pt: 'Concluida', nl: 'Voltooid' },
};

// ─── Statuts paiements ─────────────────────────────────────────
export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded'];

export const PAYMENT_STATUS_LABELS = {
  unpaid:   { fr: 'Non paye',   en: 'Unpaid',   de: 'Unbezahlt',  es: 'No pagado',    it: 'Non pagato',  pt: 'Nao pago',   nl: 'Onbetaald' },
  pending:  { fr: 'En attente', en: 'Pending',  de: 'Ausstehend', es: 'Pendiente',    it: 'In attesa',   pt: 'Pendente',   nl: 'In afwachting' },
  paid:     { fr: 'Paye',       en: 'Paid',     de: 'Bezahlt',    es: 'Pagado',       it: 'Pagato',      pt: 'Pago',       nl: 'Betaald' },
  refunded: { fr: 'Rembourse',  en: 'Refunded', de: 'Erstattet',  es: 'Reembolsado',  it: 'Rimborsato',  pt: 'Reembolsado',nl: 'Terugbetaald' },
};

// ─── Methodes de paiement ──────────────────────────────────────
export const PAYMENT_METHODS = ['paypal', 'bank_transfer'];

export const PAYMENT_METHOD_LABELS = {
  paypal:        { fr: 'PayPal',            en: 'PayPal',        de: 'PayPal',             es: 'PayPal',              it: 'PayPal',             pt: 'PayPal',             nl: 'PayPal' },
  bank_transfer: { fr: 'Virement bancaire', en: 'Bank transfer', de: 'Bankueberweisung',   es: 'Transferencia bancaria', it: 'Bonifico bancario', pt: 'Transferencia bancaria', nl: 'Bankoverschrijving' },
};

// ─── Roles ─────────────────────────────────────────────────────
export const USER_ROLES = ['user', 'admin', 'owner'];

// ─── Constantes booking ────────────────────────────────────────
export const PENDING_HOLD_MINUTES = 30;
export const PENDING_EXTEND_MINUTES = 15;

// ─── Helpers ───────────────────────────────────────────────────
export function getLabel(labelsMap, key, locale = 'fr') {
  const entry = labelsMap[key];
  if (!entry) return key;
  if (typeof entry === 'string') return entry;
  return entry[locale] || entry.fr || key;
}

// ─── Retrocompatibilite formatPrice ────────────────────────────
export function formatPrice(cents) {
  return _formatPrice(cents, 'EUR', 'fr');
}

export function formatPriceShort(cents) {
  return _formatPriceShort(cents, 'EUR', 'fr');
}
