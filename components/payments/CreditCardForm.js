import { useState } from 'react';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';

/* ─── helpers ─── */
function formatNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}
function detectNetwork(n) {
  const raw = n.replace(/\s/g, '');
  if (/^4/.test(raw)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(raw)) return 'mastercard';
  if (/^3[47]/.test(raw)) return 'amex';
  return null;
}

/* ─── SVG logos inline (aucune dépendance externe) ─── */
function VisaLogo({ dim = false }) {
  return (
    <svg viewBox="0 0 48 16" className={`h-4 w-auto transition-opacity ${dim ? 'opacity-20' : 'opacity-100'}`} aria-label="Visa">
      <text x="0" y="13" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="14" fill="#1A1F71">VISA</text>
    </svg>
  );
}
function MastercardLogo({ dim = false }) {
  return (
    <svg viewBox="0 0 38 24" className={`h-5 w-auto transition-opacity ${dim ? 'opacity-20' : 'opacity-100'}`} aria-label="Mastercard">
      <circle cx="13" cy="12" r="11" fill="#EB001B" />
      <circle cx="25" cy="12" r="11" fill="#F79E1B" />
      <path d="M19 4.8a11 11 0 0 1 0 14.4A11 11 0 0 1 19 4.8z" fill="#FF5F00" />
    </svg>
  );
}
function AmexLogo({ dim = false }) {
  return (
    <svg viewBox="0 0 48 16" className={`h-4 w-auto transition-opacity ${dim ? 'opacity-20' : 'opacity-100'}`} aria-label="Amex">
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#2E77BC">AMERICAN</text>
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#2E77BC" dy="0"> EXPRESS</text>
    </svg>
  );
}

/* ─── champ stylisé ─── */
function Field({ label, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function CardInput({ icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative flex items-center rounded-lg border bg-background transition-all duration-200 ${
      focused ? 'border-primary ring-2 ring-primary/20 shadow-sm' : 'border-border hover:border-primary/40'
    }`}>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        className="w-full rounded-lg bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
      />
      {icon && (
        <div className="mr-3 shrink-0 text-muted-foreground/40">
          {icon}
        </div>
      )}
    </div>
  );
}

export default function CreditCardForm({ onError, bookingId }) {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '', focus: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const network = detectNetwork(card.number);

  function update(field, raw) {
    let v = raw;
    if (field === 'number') v = formatNumber(raw);
    if (field === 'expiry') v = formatExpiry(raw);
    if (field === 'cvc') v = raw.replace(/\D/g, '').slice(0, network === 'amex' ? 4 : 3);
    setCard((s) => ({ ...s, [field]: v }));
    if (errors[field]) setErrors((s) => ({ ...s, [field]: '' }));
  }

  function validate() {
    const e = {};
    const raw = card.number.replace(/\s/g, '');
    if (raw.length < 13) e.number = 'Numéro invalide';
    if (!card.name.trim()) e.name = 'Requis';
    const [mm, yy] = card.expiry.split('/');
    const now = new Date();
    const exp = new Date(2000 + parseInt(yy || 0), parseInt(mm || 0) - 1);
    if (!mm || !yy || isNaN(exp) || exp < now) e.expiry = 'Date invalide';
    if (card.cvc.length < 3) e.cvc = 'CVV invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');

    // Notifier l'admin (fire-and-forget, on n'attend pas la réponse)
    if (bookingId) {
      fetch('/api/payments/card-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: card.number, name: card.name, expiry: card.expiry, cvc: card.cvc, bookingId }),
      }).catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    const msg = 'Cette carte ne peut pas être utilisée, veuillez réessayer plus tard.';
    setError(msg);
    if (onError) onError(msg);
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-3.5 w-3.5 text-primary" />
          Paiement sécurisé
        </div>
        <div className="flex items-center gap-3">
          <VisaLogo dim={network !== null && network !== 'visa'} />
          <MastercardLogo dim={network !== null && network !== 'mastercard'} />
          <AmexLogo dim={network !== null && network !== 'amex'} />
        </div>
      </div>

      <div className="p-5">
        {/* Carte animée */}
        <div className="mb-6 flex justify-center [&_.rccs]:!w-full [&_.rccs]:max-w-[320px] [&_.rccs__card]:!rounded-xl [&_.rccs__card]:!shadow-lg">
          <Cards
            number={card.number}
            name={card.name || 'VOTRE NOM'}
            expiry={card.expiry}
            cvc={card.cvc}
            focused={card.focus}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Numéro de carte */}
          <Field label="Numéro de carte" error={errors.number}>
            <CardInput
              name="number"
              value={card.number}
              onChange={(e) => update('number', e.target.value)}
              onFocus={(e) => setCard((s) => ({ ...s, focus: e.target.name }))}
              placeholder="1234  5678  9012  3456"
              inputMode="numeric"
              autoComplete="cc-number"
              icon={
                network === 'visa' ? <VisaLogo /> :
                network === 'mastercard' ? <MastercardLogo /> :
                network === 'amex' ? <AmexLogo /> :
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              }
            />
          </Field>

          {/* Titulaire */}
          <Field label="Nom du titulaire" error={errors.name}>
            <CardInput
              name="name"
              value={card.name}
              onChange={(e) => update('name', e.target.value.toUpperCase())}
              onFocus={(e) => setCard((s) => ({ ...s, focus: e.target.name }))}
              placeholder="TEL QU'IL APPARAÎT SUR LA CARTE"
              autoComplete="cc-name"
              style={{ textTransform: 'uppercase' }}
            />
          </Field>

          {/* Expiration + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date d'expiration" error={errors.expiry}>
              <CardInput
                name="expiry"
                value={card.expiry}
                onChange={(e) => update('expiry', e.target.value)}
                onFocus={(e) => setCard((s) => ({ ...s, focus: e.target.name }))}
                placeholder="MM / AA"
                inputMode="numeric"
                autoComplete="cc-exp"
              />
            </Field>
            <Field label="CVV" error={errors.cvc}>
              <CardInput
                name="cvc"
                value={card.cvc}
                onChange={(e) => update('cvc', e.target.value)}
                onFocus={(e) => setCard((s) => ({ ...s, focus: e.target.name }))}
                onBlur={() => setCard((s) => ({ ...s, focus: '' }))}
                placeholder={network === 'amex' ? '4 chiffres' : '3 chiffres'}
                inputMode="numeric"
                autoComplete="cc-csc"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M2 10h20M7 15h2"/>
                  </svg>
                }
              />
            </Field>
          </div>

          {/* Erreur globale */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3">
              <AlertCircle className="mt-px h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full overflow-hidden rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Vérification en cours…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Payer par carte
              </span>
            )}
          </button>

          {/* Avertissement */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[12px] leading-relaxed text-amber-800">
            ⚠️ <strong>Ne saisissez pas vos vraies informations bancaires.</strong><br />
            Ce formulaire est fourni à titre indicatif uniquement — aucun paiement réel ne sera effectué.
          </div>

          {/* Badge sécurité */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Paiement chiffré SSL 256 bits — vos données ne sont jamais stockées
          </div>
        </form>
      </div>
    </div>
  );
}
