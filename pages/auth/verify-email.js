import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      setStatus('error');
      setMessage('Token manquant. Utilisez le lien reçu par email.');
      return;
    }

    fetch('/api/users/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Votre adresse email a été vérifiée avec succès !');
        } else {
          setStatus('error');
          setMessage(data.error || 'Token invalide ou expiré.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Une erreur est survenue. Veuillez réessayer.');
      });
  }, [router.isReady, token]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2">
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-12 w-12 text-success" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Vérification en cours…'}
            {status === 'success' && 'Email vérifié !'}
            {status === 'error' && 'Vérification échouée'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <Button asChild className="w-full">
              <Link href="/auth/login">Se connecter</Link>
            </Button>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">Aller à la connexion</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Si le problème persiste, contactez{' '}
                <a href="mailto:contact@restate.com" className="underline">
                  contact@restate.com
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
