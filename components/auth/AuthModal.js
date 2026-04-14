import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

/**
 * Modal d'authentification (connexion / inscription) utilisé pour
 * débloquer une action (ex : réservation) sans quitter la page.
 *
 * Props :
 *  - open        : boolean
 *  - onOpenChange: (open) => void
 *  - onSuccess   : () => void  — appelé après connexion/inscription réussie
 *  - title       : string      — titre contextuel affiché dans le modal
 */
export default function AuthModal({ open, onOpenChange, onSuccess, title }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{title || 'Connexion requise'}</DialogTitle>
          <DialogDescription>
            Connectez-vous ou créez un compte pour continuer.
          </DialogDescription>
        </DialogHeader>

        {/* Onglets */}
        <div className="flex border-b mx-6 mt-4">
          <button
            className={`pb-2 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('login')}
          >
            Se connecter
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('register')}
          >
            S&apos;inscrire
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          {tab === 'login' ? (
            <LoginForm onSuccess={onSuccess} onSwitchTab={() => setTab('register')} />
          ) : (
            <RegisterForm onSuccess={onSuccess} onSwitchTab={() => setTab('login')} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoginForm({ onSuccess, onSwitchTab }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (result?.error) {
      setError('Email ou mot de passe incorrect');
    } else {
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Mot de passe</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Connexion…' : 'Se connecter'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitchTab} className="text-primary hover:underline font-medium">
          S&apos;inscrire
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSuccess, onSwitchTab }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    if (!data.success) {
      setLoading(false);
      return setError(data.error);
    }
    // Connexion automatique après inscription
    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (result?.error) {
      setError('Inscription réussie, mais connexion automatique échouée. Veuillez vous connecter.');
    } else {
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Nom complet</Label>
        <Input
          id="reg-name"
          name="name"
          placeholder="Jean Dupont"
          value={form.name}
          onChange={handleChange}
          required
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          name="email"
          type="email"
          placeholder="votre@email.com"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Mot de passe</Label>
        <Input
          id="reg-password"
          name="password"
          type="password"
          placeholder="Min. 6 caractères"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm">Confirmer le mot de passe</Label>
        <Input
          id="reg-confirm"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Inscription…' : "Créer mon compte et réserver"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitchTab} className="text-primary hover:underline font-medium">
          Se connecter
        </button>
      </p>
    </form>
  );
}
