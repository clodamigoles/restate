import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useToastContext } from '@/components/ui/Toaster';
import { ArrowLeft, User, Lock } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function AccountSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { data, mutate } = useSWR('/api/users/me', fetcher);
  const { toast } = useToastContext();

  const user = data?.data;

  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // Populate profile form once data loads
  if (user && !profileLoaded) {
    setProfile({ name: user.name || '', phone: user.phone || '' });
    setProfileLoaded(true);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, phone: profile.phone }),
    });
    const json = await res.json();
    setSavingProfile(false);
    if (json.success) {
      toast({ title: 'Profil mis à jour', variant: 'success' });
      mutate();
      await updateSession({ name: profile.name });
    } else {
      toast({ title: 'Erreur', description: json.error, variant: 'destructive' });
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast({ title: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    if (passwords.next.length < 6) {
      toast({ title: 'Le mot de passe doit contenir au moins 6 caractères', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
    });
    const json = await res.json();
    setSavingPassword(false);
    if (json.success) {
      toast({ title: 'Mot de passe modifié', variant: 'success' });
      setPasswords({ current: '', next: '', confirm: '' });
    } else {
      toast({ title: 'Erreur', description: json.error, variant: 'destructive' });
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link href="/account">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Mon espace
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Paramètres du compte</h1>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || session?.user?.email || ''}
                disabled
                className="mt-1.5 bg-muted"
              />
              <p className="mt-1 text-xs text-muted-foreground">L&apos;email ne peut pas être modifié.</p>
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1.5"
                placeholder="+33 6 00 00 00 00"
              />
            </div>
            <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto">
              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <Label htmlFor="current-pw">Mot de passe actuel</Label>
              <Input
                id="current-pw"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-pw">Nouveau mot de passe</Label>
              <Input
                id="new-pw"
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                className="mt-1.5"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirm-pw">Confirmer le mot de passe</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                className="mt-1.5"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={savingPassword} className="w-full sm:w-auto">
              {savingPassword ? 'Modification…' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
