import { useState } from 'react';
import useSWR from 'swr';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Landmark, CheckCircle2, Globe, Mail, Phone, MapPin, Loader2,
} from 'lucide-react';

function IconFacebook({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
}
function IconInstagram({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" /></svg>;
}
function IconTwitter({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function IconYoutube({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" /></svg>;
}

const fetcher = (url) => fetch(url).then((r) => r.json());

const EMPTY = {
  siteName: '', tagline: '', siteDescription: '',
  contactEmail: '', contactPhone: '', contactAddress: '',
  emailFrom: '',
  socialFacebook: '', socialInstagram: '', socialTwitter: '', socialYoutube: '',
  bankIban: '', bankBic: '', bankBeneficiary: '',
};

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/settings', fetcher);
  const settings = data?.data;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const values = form ?? settings ?? EMPTY;

  function set(e) {
    setSaved(false);
    setForm((prev) => ({ ...(prev ?? settings ?? EMPTY), [e.target.name]: e.target.value }));
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

  if (isLoading) {
    return (
      <AdminLayout title="Paramètres">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Paramètres"
      breadcrumb={[{ label: 'Dashboard', href: '/dlt' }, { label: 'Paramètres' }]}
    >
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

        {/* ── Identité du site ── */}
        <Section icon={<Globe className="h-4 w-4 text-primary" />} title="Identité du site">
          <Field label="Nom du site" id="siteName" name="siteName"
            value={values.siteName} onChange={set} placeholder="Maxo Destinations" />
          <Field label="Slogan / tagline" id="tagline" name="tagline"
            value={values.tagline} onChange={set} placeholder="Premium Living" />
          <Field label="Description courte" id="siteDescription" name="siteDescription"
            value={values.siteDescription} onChange={set}
            placeholder="Votre partenaire de confiance pour la location courte durée." />
        </Section>

        {/* ── Contact ── */}
        <Section icon={<Phone className="h-4 w-4 text-primary" />} title="Contact">
          <Field label="Email de contact" id="contactEmail" name="contactEmail"
            type="email" value={values.contactEmail} onChange={set}
            placeholder="contact@monsite.com"
            icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />} />
          <Field label="Téléphone" id="contactPhone" name="contactPhone"
            value={values.contactPhone} onChange={set} placeholder="+33 1 23 45 67 89"
            icon={<Phone className="h-3.5 w-3.5 text-muted-foreground" />} />
          <Field label="Adresse / localisation" id="contactAddress" name="contactAddress"
            value={values.contactAddress} onChange={set} placeholder="Paris, France"
            icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />} />
        </Section>

        {/* ── Email expéditeur ── */}
        <Section icon={<Mail className="h-4 w-4 text-primary" />} title="Email expéditeur">
          <p className="text-xs text-muted-foreground -mt-1">
            Adresse affichée dans le champ « De : » des emails envoyés aux utilisateurs.
            Si vide, la variable d'environnement <code className="font-mono">SMTP_FROM</code> est utilisée.
          </p>
          <Field label='Adresse "De :"' id="emailFrom" name="emailFrom"
            type="email" value={values.emailFrom} onChange={set}
            placeholder="noreply@monsite.com" />
        </Section>

        {/* ── Réseaux sociaux ── */}
        <Section icon={<Globe className="h-4 w-4 text-primary" />} title="Réseaux sociaux">
          <Field label="Facebook" id="socialFacebook" name="socialFacebook"
            value={values.socialFacebook} onChange={set}
            placeholder="https://facebook.com/monsite"
            icon={<IconFacebook className="h-3.5 w-3.5 text-muted-foreground" />} />
          <Field label="Instagram" id="socialInstagram" name="socialInstagram"
            value={values.socialInstagram} onChange={set}
            placeholder="https://instagram.com/monsite"
            icon={<IconInstagram className="h-3.5 w-3.5 text-muted-foreground" />} />
          <Field label="Twitter / X" id="socialTwitter" name="socialTwitter"
            value={values.socialTwitter} onChange={set}
            placeholder="https://twitter.com/monsite"
            icon={<IconTwitter className="h-3.5 w-3.5 text-muted-foreground" />} />
          <Field label="YouTube" id="socialYoutube" name="socialYoutube"
            value={values.socialYoutube} onChange={set}
            placeholder="https://youtube.com/@monsite"
            icon={<IconYoutube className="h-3.5 w-3.5 text-muted-foreground" />} />
        </Section>

        {/* ── Coordonnées bancaires ── */}
        <Section icon={<Landmark className="h-4 w-4 text-primary" />} title="Coordonnées bancaires">
          <Field label="Bénéficiaire" id="bankBeneficiary" name="bankBeneficiary"
            value={values.bankBeneficiary} onChange={set} placeholder="Maxo Destinations SAS" />
          <Field label="IBAN" id="bankIban" name="bankIban"
            value={values.bankIban} onChange={set}
            placeholder="FR76 0000 0000 0000 0000 0000 000" mono />
          <Field label="BIC / SWIFT" id="bankBic" name="bankBic"
            value={values.bankBic} onChange={set} placeholder="XXXXXXXX" mono />
        </Section>

        {/* ── Actions ── */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Paramètres enregistrés
          </p>
        )}
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : 'Enregistrer les paramètres'}
        </Button>
      </form>
    </AdminLayout>
  );
}

function Section({ icon, title, children }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, id, name, value, onChange, placeholder, type = 'text', mono, icon }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {icon}
          </span>
        )}
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${icon ? 'pl-8' : ''} ${mono ? 'font-mono' : ''}`}
        />
      </div>
    </div>
  );
}
