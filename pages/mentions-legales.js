import Head from 'next/head';
import Link from 'next/link';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { SITE_DEFAULTS } from '@/lib/contexts/SiteSettingsContext';

const LEGAL_DEFAULTS = {
  legalDirector: '', legalCompanyType: '', legalCapital: '',
  legalSiret: '', legalRcs: '', legalVat: '',
};

function val(v, fallback) {
  return v?.trim() ? v.trim() : <span className="rounded bg-amber-100 px-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">{fallback}</span>;
}

export default function MentionsLegales({ settings }) {
  const s = { ...SITE_DEFAULTS, ...LEGAL_DEFAULTS, ...settings };
  const year = new Date().getFullYear();

  return (
    <>
      <Head>
        <title>Mentions légales — {s.siteName}</title>
        <meta name="description" content={`Mentions légales du site ${s.siteName}.`} />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* En-tête */}
        <div className="mb-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Mentions légales
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            En vigueur au 1er janvier {year} — conformément aux articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l&apos;Économie Numérique (LCEN).
          </p>
        </div>

        <div className="space-y-10 text-sm leading-7 text-foreground">

          {/* 1 — Éditeur */}
          <section>
            <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-foreground">
              1. Éditeur du site
            </h2>
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2 text-muted-foreground">
              <Row label="Nom du site" value={s.siteName} />
              <Row label="Forme juridique" value={val(s.legalCompanyType, 'à compléter dans Admin › Paramètres')} />
              <Row label="Capital social" value={val(s.legalCapital, 'à compléter dans Admin › Paramètres')} />
              <Row label="Siège social" value={val(s.contactAddress, 'à compléter dans Admin › Paramètres')} />
              <Row label="SIRET" value={val(s.legalSiret, 'à compléter dans Admin › Paramètres')} />
              <Row label="RCS" value={val(s.legalRcs, 'à compléter dans Admin › Paramètres')} />
              <Row label="Numéro de TVA" value={val(s.legalVat, 'à compléter dans Admin › Paramètres')} />
              {s.contactEmail && <Row label="Email" value={<a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">{s.contactEmail}</a>} />}
              {s.contactPhone && <Row label="Téléphone" value={<a href={`tel:${s.contactPhone}`} className="hover:underline">{s.contactPhone}</a>} />}
            </div>
            {(!s.legalSiret || !s.legalRcs || !s.legalDirector) && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                <span className="shrink-0 font-bold">⚠</span>
                Des informations légales obligatoires sont manquantes.{' '}
                <a href="/dlt/settings" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                  Compléter dans Admin › Paramètres
                </a>.
              </p>
            )}
          </section>

          {/* 2 — Directeur de la publication */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              2. Directeur de la publication
            </h2>
            <p className="text-muted-foreground">
              Le directeur de la publication du site <strong className="text-foreground">{s.siteName}</strong> est{' '}
              <span className="font-medium text-foreground">
                {val(s.legalDirector, 'à compléter dans Admin › Paramètres')}
              </span>
              {s.contactEmail && (
                <>, joignable à l&apos;adresse email{' '}
                <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">
                  {s.contactEmail}
                </a></>
              )}.
            </p>
          </section>

          {/* 3 — Hébergement */}
          <section>
            <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-foreground">
              3. Hébergement
            </h2>
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2 text-muted-foreground">
              <Row label="Hébergeur" value="Vercel Inc." />
              <Row label="Adresse" value="340 Pine Street, Suite 1201 — San Francisco, CA 94104, États-Unis" />
              <Row label="Site web" value={<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a>} />
            </div>
          </section>

          {/* 4 — Activité */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              4. Activité du site
            </h2>
            <p className="text-muted-foreground">
              {s.siteName} est une plateforme de location de courte durée permettant la mise en relation entre des
              propriétaires de biens immobiliers (villas, appartements, gîtes, chalets, etc.) et des voyageurs
              à la recherche d&apos;hébergements de qualité.
              {s.siteDescription && (
                <> {s.siteDescription}</>
              )}
            </p>
            <p className="mt-3 text-muted-foreground">
              Les annonces publiées sur le site sont soumises à validation par l&apos;équipe de {s.siteName} avant
              leur mise en ligne. La plateforme agit en qualité d&apos;intermédiaire entre les parties et ne peut être
              tenue responsable des informations communiquées par les annonceurs.
            </p>
          </section>

          {/* 5 — Propriété intellectuelle */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              5. Propriété intellectuelle
            </h2>
            <p className="text-muted-foreground">
              L&apos;ensemble des éléments constituant le site <strong className="text-foreground">{s.siteName}</strong> (structure, textes, logos, graphismes,
              photographies, images, sons et tout autre contenu) est la propriété exclusive de {s.siteName} ou
              de ses partenaires et est protégé par les lois françaises et internationales relatives au droit d&apos;auteur
              et à la propriété intellectuelle.
            </p>
            <p className="mt-3 text-muted-foreground">
              Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale
              ou partielle, du site ou de son contenu, par quelque procédé que ce soit, est interdite sans
              autorisation écrite préalable de {s.siteName}.
            </p>
            <p className="mt-3 text-muted-foreground">
              Les annonceurs conservent l&apos;intégralité des droits sur les photographies et textes qu&apos;ils publient.
              En les déposant sur la plateforme, ils accordent à {s.siteName} une licence non exclusive d&apos;utilisation
              dans le cadre de la diffusion des annonces.
            </p>
          </section>

          {/* 6 — Données personnelles */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              6. Protection des données personnelles
            </h2>
            <p className="text-muted-foreground">
              {s.siteName} collecte et traite des données personnelles dans le cadre de la gestion des comptes
              utilisateurs, des réservations et de la relation client. Ces traitements sont conformes au
              Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi
              Informatique et Libertés du 6 janvier 1978 modifiée.
            </p>
            <p className="mt-3 text-muted-foreground">
              Conformément à la réglementation en vigueur, vous disposez des droits suivants concernant
              vos données personnelles :
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Droit d&apos;accès et de rectification (art. 15 et 16 RGPD)</li>
              <li>Droit à l&apos;effacement (art. 17 RGPD)</li>
              <li>Droit à la limitation du traitement (art. 18 RGPD)</li>
              <li>Droit à la portabilité (art. 20 RGPD)</li>
              <li>Droit d&apos;opposition (art. 21 RGPD)</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Pour exercer ces droits ou pour toute question relative à vos données personnelles, contactez-nous
              à l&apos;adresse{' '}
              <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">
                {s.contactEmail}
              </a>.
              Vous pouvez également introduire une réclamation auprès de la CNIL ({' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                cnil.fr
              </a>
              ).
            </p>
          </section>

          {/* 7 — Cookies */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              7. Politique de cookies
            </h2>
            <p className="text-muted-foreground">
              Le site <strong className="text-foreground">{s.siteName}</strong> utilise des cookies techniques nécessaires à son bon fonctionnement
              (gestion de session, authentification, préférences de langue et de devise). Ces cookies ne
              nécessitent pas de consentement préalable car ils sont strictement nécessaires à la fourniture
              du service.
            </p>
            <p className="mt-3 text-muted-foreground">
              Aucun cookie de traçage ou de publicité tierce n&apos;est déposé sans votre consentement. Vous pouvez
              configurer votre navigateur pour refuser les cookies, ce qui peut toutefois affecter certaines
              fonctionnalités du site.
            </p>
          </section>

          {/* 8 — Liens hypertextes */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              8. Liens hypertextes
            </h2>
            <p className="text-muted-foreground">
              Le site <strong className="text-foreground">{s.siteName}</strong> peut contenir des liens vers des sites tiers. Ces liens sont fournis
              à titre informatif. {s.siteName} n&apos;exerce aucun contrôle sur ces sites et décline toute
              responsabilité quant à leur contenu, leurs pratiques de confidentialité ou leur disponibilité.
            </p>
            <p className="mt-3 text-muted-foreground">
              Tout lien hypertexte pointant vers {s.siteName} doit faire l&apos;objet d&apos;une autorisation écrite
              préalable. Pour toute demande, contactez{' '}
              <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">
                {s.contactEmail}
              </a>.
            </p>
          </section>

          {/* 9 — Responsabilité */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              9. Limitation de responsabilité
            </h2>
            <p className="text-muted-foreground">
              {s.siteName} s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur son
              site. Cependant, {s.siteName} ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des
              informations mises à disposition et décline toute responsabilité pour toute imprécision, inexactitude
              ou omission portant sur des informations disponibles sur le site.
            </p>
            <p className="mt-3 text-muted-foreground">
              {s.siteName} ne saurait être tenu responsable des dommages directs ou indirects pouvant survenir
              suite à l&apos;accès au site ou à l&apos;utilisation de son contenu. Le site peut être temporairement
              indisponible pour des raisons de maintenance technique ou de force majeure, sans que cela puisse
              engager la responsabilité de {s.siteName}.
            </p>
          </section>

          {/* 10 — Droit applicable */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              10. Droit applicable et juridiction compétente
            </h2>
            <p className="text-muted-foreground">
              Les présentes mentions légales sont régies par le droit français. En cas de litige relatif à
              l&apos;interprétation ou à l&apos;exécution des présentes, les parties s&apos;engagent à rechercher une solution
              amiable avant toute action en justice. À défaut d&apos;accord amiable, le litige sera soumis aux
              tribunaux compétents de{' '}
              <span className="font-medium text-foreground">{s.contactAddress?.split(',')[0] || 'Paris'}</span>.
            </p>
          </section>

          {/* 11 — Contact */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-foreground">
              11. Contact
            </h2>
            <p className="text-muted-foreground">
              Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :
            </p>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              {s.contactEmail && (
                <li>
                  Par email :{' '}
                  <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">
                    {s.contactEmail}
                  </a>
                </li>
              )}
              {s.contactPhone && (
                <li>
                  Par téléphone :{' '}
                  <a href={`tel:${s.contactPhone}`} className="hover:underline text-foreground">
                    {s.contactPhone}
                  </a>
                </li>
              )}
              {s.contactAddress && (
                <li>Par courrier : {s.contactAddress}</li>
              )}
            </ul>
          </section>

          {/* Pied */}
          <div className="border-t border-border pt-8 text-xs text-muted-foreground">
            <p>
              Document généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} —{' '}
              &copy; {year} {s.siteName}. Tous droits réservés.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/listings" className="hover:text-foreground transition-colors">Voir les annonces</Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">Connexion</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <span className="font-medium text-foreground min-w-[160px]">{label} :</span>
      <span>{value}</span>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    await dbConnect();
    const raw = await Settings.findOne({ key: 'global' }).lean();
    if (!raw) return { props: { settings: {} } };

    const fields = [
      'siteName', 'tagline', 'siteDescription',
      'contactEmail', 'contactPhone', 'contactAddress',
      'legalDirector', 'legalCompanyType', 'legalCapital',
      'legalSiret', 'legalRcs', 'legalVat',
    ];
    const settings = fields.reduce((acc, k) => ({ ...acc, [k]: raw[k] ?? '' }), {});
    return { props: { settings } };
  } catch {
    return { props: { settings: {} } };
  }
}
