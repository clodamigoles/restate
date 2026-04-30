import { useState } from 'react';
import useSWR from 'swr';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Landmark, CheckCircle2 } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/settings', fetcher);
  const settings = data?.data;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Initialise le formulaire une seule fois quand les données arrivent
  const values = form ?? settings ?? { bankIban: '', bankBic: '', bankBeneficiary: '' };

  function handleChange(e) {
    setSaved(false);
    setForm((prev) => ({ ...(prev ?? settings ?? {}), [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) return setError(d.error || 'Erreur lors de la sauvegarde');
    mutate();
    setForm(null);
    setSaved(true);
  }

  return (
    <AdminLayout title="Paramètres">
      <div className="max-w-xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4 text-primary" />
              Coordonnées bancaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bankBeneficiary">Bénéficiaire</Label>
                  <Input
                    id="bankBeneficiary"
                    name="bankBeneficiary"
                    value={values.bankBeneficiary}
                    onChange={handleChange}
                    placeholder="Restate SAS"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bankIban">IBAN</Label>
                  <Input
                    id="bankIban"
                    name="bankIban"
                    value={values.bankIban}
                    onChange={handleChange}
                    placeholder="FR76 0000 0000 0000 0000 0000 000"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bankBic">BIC / SWIFT</Label>
                  <Input
                    id="bankBic"
                    name="bankBic"
                    value={values.bankBic}
                    onChange={handleChange}
                    placeholder="XXXXXXXX"
                    className="font-mono"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {saved && (
                  <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Coordonnées enregistrées
                  </p>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
