import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AlertCircle, Loader2, CheckCircle2, Lock, Clock } from 'lucide-react';

/**
 * CardOTPModal - Interface de vérification OTP avec partenariat Binance
 * 
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - cardPaymentAttemptId: string - ID de la tentative de paiement
 *  - userPhone: string - Numéro de téléphone du client
 *  - amount: number - Montant du paiement
 *  - onSuccess: (paymentAttemptId) => void - Appelé quand l'OTP est vérifié
 *  - onError: (error) => void - Appelé en cas d'erreur
 */
export default function CardOTPModal({ 
  open, 
  onOpenChange, 
  cardPaymentAttemptId, 
  userPhone,
  amount,
  onSuccess, 
  onError 
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [paymentStatus, setPaymentStatus] = useState(null); // pending, approved, rejected
  const [statusMessage, setStatusMessage] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setOtp('');
      setError('');
      setSuccess(false);
      setAttemptsLeft(3);
      setPaymentStatus(null);
      setStatusMessage('');
      setIsPolling(false);
    } else {
      // Arrêter le polling quand le modal se ferme
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [open]);

  // Nettoyer le polling quand le composant se démonte
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Formatter l'OTP à 6 chiffres maximum
  function handleOtpChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (error) setError('');
  }

  // Vérifier l'OTP
  async function handleVerifyOTP(e) {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Le code OTP doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/card-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardPaymentAttemptId,
          otp,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const remaining = data.data?.attemptsLeft || 0;
        setAttemptsLeft(remaining);
        setError(data.error || 'Code OTP invalide');
        setLoading(false);
        onError?.(data.error || 'Erreur lors de la vérification');
        return;
      }

      // OTP vérifié avec succès
      setSuccess(true);
      setLoading(false);
      setPaymentStatus('pending');
      setStatusMessage('En attente de la confirmation de l\'admin...');
      setIsPolling(true);
      
      // Commencer le polling du statut du paiement
      startPaymentStatusPolling();
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
      setLoading(false);
      onError?.(err.message);
    }
  }

  // Commencer le polling du statut du paiement
  function startPaymentStatusPolling() {
    // Vérifier le statut immédiatement
    checkPaymentStatus();
    
    // Puis vérifier toutes les 2 secondes
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 2000);
  }

  // Vérifier le statut du paiement auprès du serveur
  async function checkPaymentStatus() {
    try {
      const response = await fetch(`/api/payments/card-status?attemptId=${cardPaymentAttemptId}`);
      const data = await response.json();

      if (!data.success) {
        console.error('[v0] Failed to fetch payment status:', data.error);
        return;
      }

      const { status, statusMessage: newStatusMessage } = data.data;
      setStatusMessage(newStatusMessage);

      if (status === 'approved') {
        // Paiement approuvé!
        setPaymentStatus('approved');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        // Attendre un peu avant de fermer et notifier le parent
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.(cardPaymentAttemptId);
        }, 2000);
      } else if (status === 'rejected') {
        // Paiement rejeté
        setPaymentStatus('rejected');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        setTimeout(() => {
          onOpenChange(false);
          onError?.('Votre paiement a été rejeté. Veuillez réessayer ou utiliser une autre carte.');
        }, 2000);
      } else if (status === 'expired' || status === 'cancelled') {
        // Session expirée
        setPaymentStatus('expired');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        setTimeout(() => {
          onOpenChange(false);
          onError?.('Votre session a expiré. Veuillez réessayer.');
        }, 2000);
      }
      // Sinon on continue le polling si status est 'pending_otp' ou 'otp_verified'
    } catch (err) {
      console.error('[v0] Error checking payment status:', err);
    }
  }

  // Masquer le numéro de téléphone partiellement
  const maskedPhone = userPhone 
    ? userPhone.replace(/(\d{2})(\d{3})\d{3}(\d{2})/, '$1***$2$3')
    : '****';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header avec branding Binance */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            {/* Binance-like icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Lock className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold tracking-wider">BINANCE PARTNERSHIP</span>
          </div>
          <h2 className="text-lg font-bold">Vérification du paiement</h2>
        </div>

        <div className="px-6 py-6">
          {!success ? (
            <>
              <DialogDescription className="mb-6 text-center text-foreground">
                Un code OTP a été envoyé au <br />
                <span className="font-medium text-primary">{maskedPhone}</span>
              </DialogDescription>

              {/* Montant */}
              <div className="mb-6 rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Montant à payer</p>
                <p className="text-2xl font-bold">{amount} EUR</p>
              </div>

              {/* Formulaire OTP */}
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                {/* Champ OTP */}
                <div className="space-y-2">
                  <Label htmlFor="otp-input" className="text-sm font-semibold">
                    Code OTP (6 chiffres)
                  </Label>
                  <Input
                    id="otp-input"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={loading}
                    maxLength="6"
                    inputMode="numeric"
                    className="text-center text-2xl font-bold tracking-widest"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground text-center">
                    Saisissez le code que vous avez reçu par SMS
                  </p>
                </div>

                {/* Erreur */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                      {attemptsLeft > 0 && (
                        <p className="text-xs text-destructive/70 mt-1">
                          {attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''} restante{attemptsLeft > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Vérification…
                      </>
                    ) : (
                      'Vérifier'
                    )}
                  </Button>
                </div>

                {/* Infos de sécurité */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-[11px] text-blue-800">
                  <p className="font-semibold mb-1">🔒 Sécurité</p>
                  <p>Vos données sont chiffrées et ne seront jamais partagées avec des tiers non autorisés.</p>
                </div>
              </form>
            </>
          ) : paymentStatus === 'approved' ? (
            /* État de paiement approuvé */
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="relative h-16 w-16">
                  <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in-50" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Paiement approuvé !
              </h3>
              <p className="text-sm text-muted-foreground">
                Votre réservation est confirmée.
              </p>
            </div>
          ) : paymentStatus === 'rejected' ? (
            /* État de paiement rejeté */
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="text-5xl">❌</div>
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Paiement rejeté
              </h3>
              <p className="text-sm text-muted-foreground">
                Votre paiement a été rejeté. Veuillez réessayer ou utiliser une autre carte.
              </p>
            </div>
          ) : (
            /* État de succès OTP - en attente de confirmation admin */
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="relative h-16 w-16 animate-spin">
                  <Clock className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Code OTP validé !
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {statusMessage}
              </p>
              <div className="animate-pulse flex justify-center gap-1">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <div className="h-2 w-2 bg-primary rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
