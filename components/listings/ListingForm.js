import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  PROPERTY_TYPES, PROPERTY_TYPE_LABELS,
  AMENITY_LABELS, AMENITY_CATEGORIES,
  DISTANCE_FIELDS,
  getLabel,
} from '@/lib/constants';
import { SUPPORTED_LOCALES, createLocalizedField } from '@/lib/i18n';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { Upload, X, Loader2, Globe } from 'lucide-react';

const LOCALE_NAMES = {
  fr: 'Francais', en: 'English', de: 'Deutsch',
  es: 'Espanol', it: 'Italiano', pt: 'Portugues', nl: 'Nederlands',
};

function initI18n(initial, field) {
  if (!initial?.[field]) return createLocalizedField('');
  if (typeof initial[field] === 'string') return createLocalizedField(initial[field]);
  return { ...createLocalizedField(''), ...initial[field] };
}

function initDistances(initial) {
  const d = initial?.distances || {};
  const result = {};
  DISTANCE_FIELDS.forEach(({ key }) => {
    // Stocker en km dans le form, en metres dans la BDD
    result[key] = d[key] != null ? (d[key] / 1000).toString() : '';
  });
  return result;
}

export default function ListingForm({ initial = {} }) {
  const router = useRouter();
  const isEdit = Boolean(initial._id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeLocale, setActiveLocale] = useState('fr');

  const [form, setForm] = useState({
    title: initI18n(initial, 'title'),
    description: initI18n(initial, 'description'),
    rules: initI18n(initial, 'rules'),
    type: initial.type || 'gite',
    currency: initial.currency || 'EUR',
    pricePerNight: initial.pricePerNight ? (initial.pricePerNight / 100).toString() : '',
    cleaningFee: initial.cleaningFee ? (initial.cleaningFee / 100).toString() : '0',
    weekendPricePerNight: initial.weekendPricePerNight ? (initial.weekendPricePerNight / 100).toString() : '',
    minNights: initial.minNights?.toString() || '1',
    maxNights: initial.maxNights?.toString() || '90',
    'location.address': initial.location?.address || '',
    'location.city': initial.location?.city || '',
    'location.region': initial.location?.region || '',
    'location.zipCode': initial.location?.zipCode || '',
    'location.country': initial.location?.country || 'France',
    capacity: initial.capacity?.toString() || '2',
    bedrooms: initial.bedrooms?.toString() || '1',
    bathrooms: initial.bathrooms?.toString() || '1',
    beds: initial.beds?.toString() || '1',
    checkInTime: initial.checkInTime || '15:00',
    checkOutTime: initial.checkOutTime || '11:00',
    amenities: initial.amenities || [],
    distances: initDistances(initial),
    images: initial.images || [],
    instantBooking: initial.instantBooking || false,
    isPublished: initial.isPublished || false,
    isFeatured: initial.isFeatured || false,
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setI18n = (field, locale, value) =>
    setForm((f) => ({ ...f, [field]: { ...f[field], [locale]: value } }));
  const setDistance = (key, value) =>
    setForm((f) => ({ ...f, distances: { ...f.distances, [key]: value } }));

  const toggleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  // Image upload
  const [uploading, setUploading] = useState(false);
  const handleImageUpload = async (files) => {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      for (const file of files) {
        fd.append('images', file);
      }
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erreur upload (${res.status})`);
        return;
      }
      if (data.data?.length) {
        set('images', [...form.images, ...data.data]);
      } else if (data.url) {
        set('images', [...form.images, data.url]);
      }
    } catch (e) {
      setError("Erreur lors de l'upload des images : " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => set('images', form.images.filter((_, i) => i !== idx));

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Convertir distances de km -> metres (null si vide)
    const distances = {};
    DISTANCE_FIELDS.forEach(({ key }) => {
      const v = form.distances[key];
      distances[key] = v !== '' && v != null ? Math.round(parseFloat(v) * 1000) : null;
    });

    const body = {
      title: form.title,
      description: form.description,
      rules: form.rules,
      type: form.type,
      currency: form.currency,
      pricePerNight: Math.round(parseFloat(form.pricePerNight || '0') * 100),
      cleaningFee: Math.round(parseFloat(form.cleaningFee || '0') * 100),
      weekendPricePerNight: form.weekendPricePerNight
        ? Math.round(parseFloat(form.weekendPricePerNight) * 100)
        : null,
      minNights: parseInt(form.minNights) || 1,
      maxNights: parseInt(form.maxNights) || 90,
      location: {
        address: form['location.address'],
        city: form['location.city'],
        region: form['location.region'],
        zipCode: form['location.zipCode'],
        country: form['location.country'],
      },
      capacity: parseInt(form.capacity) || 2,
      bedrooms: parseInt(form.bedrooms) || 1,
      bathrooms: parseInt(form.bathrooms) || 1,
      beds: parseInt(form.beds) || 1,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      amenities: form.amenities,
      distances,
      images: form.images,
      instantBooking: form.instantBooking,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
    };

    try {
      const url = isEdit ? `/api/listings/${initial._id}` : '/api/listings';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      router.push('/dlt/listings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ─── 1 : Contenu multilingue ─── */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4.5 w-4.5 text-primary" />
          <h2 className="text-base font-semibold">Contenu multilingue</h2>
        </div>

        <div className="flex gap-1 rounded-lg bg-muted/50 p-1 mb-5 flex-wrap">
          {SUPPORTED_LOCALES.map((loc) => {
            const hasContent = form.title[loc] || form.description[loc];
            return (
              <button
                key={loc}
                type="button"
                onClick={() => setActiveLocale(loc)}
                className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeLocale === loc
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {loc.toUpperCase()}
                <span className={`h-1.5 w-1.5 rounded-full ${hasContent ? 'bg-success' : 'bg-muted-foreground/30'}`} />
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre ({LOCALE_NAMES[activeLocale]}) {activeLocale === 'fr' && '*'}</Label>
            <Input
              value={form.title[activeLocale] || ''}
              onChange={(e) => setI18n('title', activeLocale, e.target.value)}
              placeholder={activeLocale === 'fr' ? "Titre de l'annonce" : `Title (${activeLocale.toUpperCase()})`}
              required={activeLocale === 'fr'}
            />
          </div>
          <div className="space-y-2">
            <Label>Description ({LOCALE_NAMES[activeLocale]}) {activeLocale === 'fr' && '*'}</Label>
            <textarea
              value={form.description[activeLocale] || ''}
              onChange={(e) => setI18n('description', activeLocale, e.target.value)}
              placeholder={activeLocale === 'fr' ? 'Description detaillee...' : `Description (${activeLocale.toUpperCase()})`}
              rows={5}
              required={activeLocale === 'fr'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label>Regles ({LOCALE_NAMES[activeLocale]})</Label>
            <textarea
              value={form.rules[activeLocale] || ''}
              onChange={(e) => setI18n('rules', activeLocale, e.target.value)}
              placeholder="Regles de la maison..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* ─── 2 : Type & Tarification ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">Type & Tarification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Type de bien *</Label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{getLabel(PROPERTY_TYPE_LABELS, t)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Devise</Label>
            <select
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Prix / nuit ({form.currency}) *</Label>
            <Input type="number" step="0.01" min="0" value={form.pricePerNight} onChange={(e) => set('pricePerNight', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Frais de menage ({form.currency})</Label>
            <Input type="number" step="0.01" min="0" value={form.cleaningFee} onChange={(e) => set('cleaningFee', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prix weekend / nuit (optionnel)</Label>
            <Input type="number" step="0.01" min="0" value={form.weekendPricePerNight} onChange={(e) => set('weekendPricePerNight', e.target.value)} placeholder="Laisser vide = meme prix" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min nuits</Label>
              <Input type="number" min="1" value={form.minNights} onChange={(e) => set('minNights', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max nuits</Label>
              <Input type="number" min="1" value={form.maxNights} onChange={(e) => set('maxNights', e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3 : Localisation ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">Localisation</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Adresse *</Label>
            <Input value={form['location.address']} onChange={(e) => set('location.address', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Ville *</Label>
            <Input value={form['location.city']} onChange={(e) => set('location.city', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Region / Departement</Label>
            <Input value={form['location.region']} onChange={(e) => set('location.region', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Code postal</Label>
            <Input value={form['location.zipCode']} onChange={(e) => set('location.zipCode', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pays</Label>
            <Input value={form['location.country']} onChange={(e) => set('location.country', e.target.value)} />
          </div>
        </div>
      </section>

      {/* ─── 4 : Capacite ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">Capacite</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Voyageurs *</Label>
            <Input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Chambres *</Label>
            <Input type="number" min="0" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Sdb</Label>
            <Input type="number" min="1" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Lits</Label>
            <Input type="number" min="1" value={form.beds} onChange={(e) => set('beds', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Arrivee</Label>
            <Input type="time" value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Depart</Label>
            <Input type="time" value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} />
          </div>
        </div>
      </section>

      {/* ─── 5 : Equipements par categorie ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-5">Equipements</h2>
        <div className="space-y-6">
          {AMENITY_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.label.fr}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.amenities.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.amenities.includes(a)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {getLabel(AMENITY_LABELS, a)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6 : Distances ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-1">Distances</h2>
        <p className="text-xs text-muted-foreground mb-4">En kilometres — laisser vide si non applicable</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {DISTANCE_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label.fr}</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.distances[key]}
                  onChange={(e) => setDistance(key, e.target.value)}
                  placeholder="—"
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">km</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7 : Images ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">Images</h2>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-muted/30">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Upload en cours...' : 'Cliquer ou glisser des images'}
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.length && handleImageUpload(Array.from(e.target.files))}
          />
        </label>

        {form.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {form.images.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 8 : Options ─── */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">Options</h2>
        <div className="space-y-3">
          <ToggleSwitch
            label="Reservation instantanee"
            description="Les reservations sont confirmees automatiquement"
            checked={form.instantBooking}
            onChange={(v) => set('instantBooking', v)}
          />
          <ToggleSwitch
            label="Publier l'annonce"
            description="L'annonce sera visible sur le site"
            checked={form.isPublished}
            onChange={(v) => set('isPublished', v)}
          />
          <ToggleSwitch
            label="Mettre en vedette"
            description="Afficher dans la section vedette de la page d'accueil"
            checked={form.isFeatured}
            onChange={(v) => set('isFeatured', v)}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Enregistrer' : "Creer l'annonce"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      >
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );
}
