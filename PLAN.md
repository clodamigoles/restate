# Restate — Plan de Développement

## Contexte
Plateforme web de location courte durée (type Airbnb) pour agence immobilière.
Next.js 16 | Pages Router | JavaScript | MongoDB/Mongoose | Tailwind v4 + shadcn/ui

---

## Stack technique
| Composant | Choix |
|-----------|-------|
| Frontend | Next.js 16 (Pages Router) |
| Langage | JavaScript |
| Style | Tailwind CSS v4 + shadcn/ui |
| Base de données | MongoDB + Mongoose |
| Auth | NextAuth.js v4 (email/password + OAuth) |
| Emails | Nodemailer + SMTP |
| Paiement | PayPal API + virement bancaire |
| Data fetching | SWR |

---

## Structure du projet

```
restate/
├── components/
│   ├── ui/              # shadcn/ui (Button, Input, Card, Dialog, Table, etc.)
│   ├── layout/          # Header, Footer, Layout, AdminLayout, Sidebar
│   ├── listings/        # ListingCard, ListingGrid, ListingGallery, ListingForm
│   ├── search/          # SearchBar, SearchFilters, SortSelect, DateRangePicker
│   ├── bookings/        # AvailabilityCalendar, BookingForm, BookingSummary
│   ├── payments/        # PaymentMethodSelect, PayPalButton, BankTransferInfo
│   ├── reviews/         # ReviewForm, ReviewCard, StarRating
│   └── auth/            # LoginForm, RegisterForm, ResetPasswordForm
├── lib/
│   ├── db.js            # Connexion MongoDB singleton
│   ├── auth.js          # Config NextAuth
│   ├── mail.js          # Nodemailer transporter
│   ├── paypal.js        # PayPal SDK
│   ├── constants.js     # Amenities, types, statuts
│   └── utils.js         # cn() pour shadcn/ui, helpers
├── models/              # User, Listing, Booking, Payment, Review
├── middleware/           # withAuth, withAdmin, withValidation, errorHandler
├── hooks/               # useAuth, useListings, useBookings, useDebounce
├── email-templates/     # welcome, booking-confirmation, reset-password, etc.
├── pages/
│   ├── index.js         # Homepage (hero + recherche + featured)
│   ├── auth/            # login, register, forgot-password, reset-password, verify-email
│   ├── listings/        # index (recherche), [id] (détail)
│   ├── bookings/        # index (historique), [id] (détail + paiement)
│   ├── account/         # index (dashboard user), settings
│   ├── admin/           # index (dashboard), users, listings/*, bookings, payments
│   └── api/             # auth/, users/, listings/, bookings/, payments/, admin/, upload
├── styles/globals.css   # Tailwind v4 + variables shadcn/ui
├── middleware.js         # Edge middleware (protection routes)
└── .env.local
```

---

## Modèles MongoDB

### User
`name, email (unique), password (bcrypt), role (user|admin|owner), phone, avatar, emailVerified, emailVerifyToken, resetPasswordToken, resetPasswordExpires, timestamps`

### Listing
`title, slug (unique), description, type (apartment|villa|studio|gite|house|space), images[], location{address, city, region, country, zipCode, coordinates{lat,lng}}, capacity, bedrooms, bathrooms, beds, pricePerNight (cents), cleaningFee, amenities[], rules, checkInTime, checkOutTime, instantBooking, isPublished, isFeatured, owner (ref User), averageRating, reviewCount, blockedDates[{start,end}], timestamps`

### Booking
`listing (ref), user (ref), checkIn, checkOut, guests, nights, pricePerNight (snapshot), cleaningFee, totalPrice, status (pending|confirmed|cancelled|completed), paymentStatus (unpaid|pending|paid|refunded), cancellationReason, cancelledBy, specialRequests, timestamps`

### Payment
`booking (ref), user (ref), amount (cents), method (paypal|bank_transfer), status (pending|completed|failed|refunded), paypalOrderId, paypalCaptureId, transferReference, transferProof, validatedBy (ref), validatedAt, notes, timestamps`

### Review
`listing (ref), user (ref), booking (ref), rating (1-5), comment, response, timestamps` — Index unique: user+listing

---

## API Endpoints

### Auth
- `[...nextauth]` — NextAuth catch-all

### Users
- `POST /api/users` — Register
- `GET/PUT /api/users/me` — Profil courant
- `GET /api/users` — Liste (admin)
- `GET/PUT/DELETE /api/users/[id]` — Gestion (admin)
- `POST /api/users/forgot-password`
- `POST /api/users/reset-password`
- `POST /api/users/verify-email`

### Listings
- `GET /api/listings` — Recherche + filtres + pagination
- `POST /api/listings` — Créer
- `GET /api/listings/featured` — Annonces vedettes
- `GET/PUT/DELETE /api/listings/[id]` — CRUD unitaire
- `GET /api/listings/[id]/availability` — Disponibilité
- `GET/POST /api/listings/[id]/reviews` — Avis

### Bookings
- `GET /api/bookings` — Liste (user: propres, admin: tous)
- `POST /api/bookings` — Créer
- `GET/PUT /api/bookings/[id]` — Détail / mise à jour statut
- `POST /api/bookings/[id]/payment` — Initier paiement

### Payments
- `GET /api/payments` — Liste (admin)
- `PUT /api/payments/[id]/validate` — Valider virement (admin)
- `POST /api/payments/paypal/create-order`
- `POST /api/payments/paypal/capture-order`
- `POST /api/payments/webhook`

### Admin
- `GET /api/admin/stats` — Statistiques dashboard

### Upload
- `POST /api/upload` — Upload images

---

## Phases de développement

### Phase 1 — Fondation (Auth + DB + Structure) ✅
- [x] Installer deps : `mongoose next-auth@4 bcryptjs jsonwebtoken swr clsx class-variance-authority lucide-react @radix-ui/react-slot tailwind-merge`
- [x] Connexion MongoDB singleton (`lib/db.js`)
- [x] Constantes (`lib/constants.js`) : amenities, types, statuts
- [x] Utilitaire cn() (`lib/utils.js`)
- [x] Modèle User avec hashing bcrypt
- [x] Config NextAuth (CredentialsProvider, JWT, callbacks) (`lib/auth.js` + `pages/api/auth/[...nextauth].js`)
- [x] Middleware API : withAuth, withAdmin, withValidation, errorHandler
- [x] Proxy (ex-middleware Next.js 16) : protection routes `/account/*`, `/admin/*`, `/bookings/*` (`proxy.js`)
- [x] Setup shadcn/ui : CSS variables dans globals.css, composants Button + Input + Label + Card
- [x] Layout : Header (nav + auth state + mobile menu) + Footer
- [x] Pages auth : login, register, forgot-password, reset-password
- [x] API users : register, me, forgot/reset password, verify-email
- [x] `.env.local` avec variables placeholder
- [x] Homepage redesignée (hero + types de biens + comment ça marche)
- **Checkpoint** : Build OK. User peut s'inscrire, se connecter, voir son nom dans le Header

### Phase 2 — Annonces (CRUD + Images + Recherche) ✅
- [x] Installer deps : `slugify formidable` (sharp intégré Next.js 16)
- [x] Modèle Listing (slugify auto), Modèle Booking, Modèle Review
- [x] API upload images (formidable, `public/uploads/`)
- [x] API listings : CRUD + recherche + filtres + pagination
- [x] API listings/featured, /[id]/availability, /[id]/reviews
- [x] Composants : ListingCard, ListingGrid (skeleton), ListingGallery (lightbox), ListingForm
- [x] Composants search : SearchBar, SearchFilters (panel), SortSelect
- [x] Page recherche `/listings` (SSR) : filtres, tri, grille, pagination
- [x] Page détail `/listings/[id]` (SSR) : galerie, infos, formulaire réservation inline
- [x] AdminLayout (sidebar desktop + mobile)
- [x] Pages admin listings : liste, création, édition
- [x] Dashboard admin (stats cards + réservations récentes)
- [x] Config `next.config.mjs` : remotePatterns + headers sécurité
- **Checkpoint** : Build OK — 27 routes compilées sans erreur

### Phase 3 — Réservations (Calendrier + Disponibilité) ✅
- [x] Installer deps : `date-fns react-day-picker`
- [x] Modèle Booking (déjà créé Phase 2)
- [x] `lib/availability.js` : checkAvailability, getBookedRanges, expandDateRange
- [x] API bookings : index (liste/créer) + [id] (détail/modifier/supprimer)
- [x] Composant AvailabilityCalendar (react-day-picker, dates désactivées)
- [x] Composants : BookingCard, BookingSummary, BookingStatusBadge
- [x] Formulaire réservation intégré dans `/listings/[id]`
- [x] Page `/bookings` : historique avec onglets par statut
- [x] Page `/bookings/[id]` : détail + annulation
- [x] Page `/admin/bookings` : tableau + confirmer/annuler/terminer
- **Checkpoint** : Build OK — 32 routes compilées sans erreur

### Phase 4 — Paiements (PayPal + Virement) ✅
- [x] Installer deps : `@paypal/react-paypal-js @paypal/paypal-server-sdk`
- [x] Modèle Payment
- [x] `lib/paypal.js` : createPayPalOrder, capturePayPalOrder, verifyWebhookSignature (API REST native)
- [x] API PayPal : create-order, capture-order, webhook (avec vérification signature)
- [x] API virement : `POST /api/bookings/[id]/payment` (génère référence unique)
- [x] API admin : `PUT /api/payments/[id]/validate`
- [x] Composants : PaymentMethodSelect, PayPalButton (dynamic import), BankTransferInfo (copy fields), PaymentStatusBadge
- [x] Page `/bookings/[id]` mise à jour avec flux paiement complet
- [x] PayPalScriptProvider dans `_app.js` (deferLoading)
- [x] Page `/admin/payments` : tableau filtrable + validation virements
- [x] `.env.local` complété (NEXT_PUBLIC_PAYPAL_CLIENT_ID, coordonnées bancaires)
- **Checkpoint** : Build OK — 39 routes compilées sans erreur

### Phase 5 — Emails (Nodemailer + Templates) ✅
- [x] Installer deps : `nodemailer`
- [x] `lib/mail.js` : transporter SMTP + fallback Ethereal en dev (preview URL dans console)
- [x] Templates HTML avec layout commun : welcome, reset-password, booking-confirmation, booking-cancellation, payment-received
- [x] Intégration dans register → welcome + lien vérification
- [x] Intégration dans forgot-password → reset-password
- [x] Intégration dans POST /api/bookings → confirmation (instant ou en attente)
- [x] Intégration dans PUT /api/bookings/[id] → annulation (user ou admin)
- [x] Intégration dans POST /api/payments/paypal/capture-order → reçu paiement
- [x] Intégration dans PUT /api/payments/[id]/validate → reçu paiement virement
- [x] Page `/auth/verify-email` avec vérification auto au chargement
- **Checkpoint** : Build OK — 40 routes compilées sans erreur

### Phase 6 — Back-office Admin
- [ ] Installer deps : `recharts`
- [ ] AdminLayout (sidebar + topbar)
- [ ] API stats (agrégations MongoDB)
- [ ] Dashboard admin : cartes stats + graphiques + activité récente
- [ ] Gestion users : table, recherche, filtres, changement rôle
- [ ] Dashboard user `/account` : bookings à venir/passés, stats perso
- [ ] Settings user `/account/settings` : profil, mot de passe
- [ ] Polish : tables shadcn/ui, dialogs confirmation, toasts
- **Checkpoint** : Dashboard admin avec vraies stats. Pages admin finalisées

### Phase 7 — Polish (SEO + Performance + Responsive)
- [ ] Installer deps : `next-seo`
- [ ] SEO : meta tags dynamiques, JSON-LD, sitemap, robots.txt
- [ ] Images : next/image partout, priority above-fold, sizes
- [ ] Performance : next/dynamic composants lourds, SWR caching, Cache-Control
- [ ] Responsive : mobile/tablette, hamburger menu, filtres collapsibles
- [ ] UX : page 404/500, skeletons loading, empty states, validation inline
- [ ] Sécurité : rate limiting, sanitisation, headers sécurité, validation ObjectId
- [ ] Config déploiement : env vars prod, MongoDB Atlas, SMTP prod, PayPal live
- **Checkpoint** : Application production-ready

---

## Points d'attention

- **shadcn/ui + Pages Router** : Copier composants manuellement (pas de CLI). Installer @radix-ui/* au cas par cas.
- **Tailwind v4 + shadcn/ui** : Variables CSS dans `@theme inline`, adaptation manuelle.
- **Prix en centimes** : Stockés en entiers. Affichage = valeur / 100.
- **NextAuth v4** : Pas v5. Stable avec Pages Router.
- **Disponibilité** : `checkIn < requestedCheckOut AND checkOut > requestedCheckIn` sur bookings pending/confirmed.
- **Next.js 16** : Consulter `node_modules/next/dist/docs/` avant d'écrire du code.
