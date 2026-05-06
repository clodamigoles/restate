import Head from 'next/head';
import Link from 'next/link';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { SITE_DEFAULTS } from '@/lib/contexts/SiteSettingsContext';

const SETTINGS_FIELDS = [
  'siteName', 'siteDescription',
  'contactEmail', 'contactPhone', 'contactAddress',
  'legalDirector', 'legalCompanyType', 'legalSiret',
];

export default function Confidentialite({ settings }) {
  const s = { ...SITE_DEFAULTS, ...settings };
  const year = new Date().getFullYear();
  const city = s.contactAddress?.split(',')[0]?.trim() || 'Paris';

  return (
    <>
      <Head>
        <title>Politique de confidentialité — {s.siteName}</title>
        <meta name="description" content={`Politique de confidentialité et protection des données personnelles de ${s.siteName}.`} />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Politique de confidentialité
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dernière mise à jour : 1er janvier {year} — conforme au RGPD (Règlement UE 2016/679) et à la loi
            Informatique et Libertés du 6 janvier 1978 modifiée.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-7 text-foreground">

          {/* 1 — Responsable */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">1. Responsable du traitement</h2>
            <p className="text-muted-foreground">
              Le responsable du traitement de vos données personnelles est{' '}
              <strong className="text-foreground">{s.siteName}</strong>
              {s.legalCompanyType && <>, {s.legalCompanyType}</>}
              {s.legalSiret && <>, SIRET {s.legalSiret}</>}
              {s.contactAddress && <>, dont le siège social est situé à {s.contactAddress}</>}.
            </p>
            {s.contactEmail && (
              <p className="mt-2 text-muted-foreground">
                Contact délégué à la protection des données (DPO) :{' '}
                <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">{s.contactEmail}</a>
              </p>
            )}
          </section>

          {/* 2 — Données collectées */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">2. Données collectées</h2>
            <p className="text-muted-foreground">Dans le cadre de l&apos;utilisation de la plateforme {s.siteName}, nous collectons les données suivantes :</p>

            <div className="mt-4 space-y-4">
              <DataBlock title="Données de compte">
                Nom, prénom, adresse email, mot de passe (chiffré), numéro de téléphone, photo de profil (optionnelle).
              </DataBlock>
              <DataBlock title="Données de réservation">
                Dates de séjour, nombre de voyageurs, logement réservé, historique des réservations, échanges avec l&apos;hôte.
              </DataBlock>
              <DataBlock title="Données de paiement">
                Informations de transaction (montant, devise, statut). Les données bancaires sont traitées directement
                par nos prestataires de paiement (PayPal) et ne sont jamais stockées sur nos serveurs.
              </DataBlock>
              <DataBlock title="Données de navigation">
                Adresse IP, type et version du navigateur, pages visitées, durée de session, langue préférée,
                devise sélectionnée (via cookies techniques).
              </DataBlock>
              <DataBlock title="Données des annonceurs">
                Informations relatives aux biens publiés (adresse, photos, tarifs, disponibilités), coordonnées bancaires pour
                le versement des revenus locatifs.
              </DataBlock>
            </div>
          </section>

          {/* 3 — Finalités */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">3. Finalités et bases légales</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2.5 text-left font-semibold text-foreground">Finalité</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-foreground">Base légale</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ['Création et gestion de votre compte', 'Exécution du contrat (art. 6.1.b RGPD)'],
                    ['Traitement des réservations et paiements', 'Exécution du contrat (art. 6.1.b RGPD)'],
                    ['Envoi d\'emails transactionnels (confirmation, rappel)', 'Exécution du contrat (art. 6.1.b RGPD)'],
                    ['Lutte contre la fraude et sécurité', 'Intérêt légitime (art. 6.1.f RGPD)'],
                    ['Amélioration de la plateforme et analyses statistiques', 'Intérêt légitime (art. 6.1.f RGPD)'],
                    ['Respect des obligations légales (comptabilité, fiscalité)', 'Obligation légale (art. 6.1.c RGPD)'],
                    ['Envoi de newsletters et offres promotionnelles', 'Consentement (art. 6.1.a RGPD)'],
                  ].map(([f, b]) => (
                    <tr key={f} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2.5">{f}</td>
                      <td className="px-3 py-2.5">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 — Durée de conservation */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">4. Durée de conservation</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Données de compte actif :</strong> conservées pendant toute la durée de la relation contractuelle, puis 3 ans après la dernière activité.</p>
              <p><strong className="text-foreground">Données de réservation :</strong> 5 ans à compter de la date du séjour (obligations comptables et fiscales).</p>
              <p><strong className="text-foreground">Données de paiement :</strong> 5 ans (code de commerce et obligations fiscales).</p>
              <p><strong className="text-foreground">Logs de connexion :</strong> 12 mois (conformément à la loi n° 2004-575 LCEN).</p>
              <p><strong className="text-foreground">Données marketing (newsletter) :</strong> 3 ans après le dernier consentement ou le dernier contact commercial.</p>
            </div>
          </section>

          {/* 5 — Destinataires */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">5. Destinataires des données</h2>
            <p className="text-muted-foreground">
              Vos données sont traitées par {s.siteName} et peuvent être partagées avec les sous-traitants
              suivants, dans le strict cadre de l&apos;exécution de leurs missions :
            </p>
            <ul className="mt-3 ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">Vercel Inc.</strong> — hébergement de la plateforme (États-Unis, décision d&apos;adéquation ou clauses contractuelles types)</li>
              <li><strong className="text-foreground">MongoDB Atlas</strong> — base de données (selon région configurée)</li>
              <li><strong className="text-foreground">PayPal</strong> — traitement des paiements</li>
              <li><strong className="text-foreground">Prestataire d&apos;envoi d&apos;emails</strong> — communications transactionnelles</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Vos données ne sont jamais vendues à des tiers ni utilisées à des fins publicitaires sans votre
              consentement explicite. Aucun transfert hors UE n&apos;est effectué sans garanties appropriées.
            </p>
          </section>

          {/* 6 — Vos droits */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">6. Vos droits</h2>
            <p className="text-muted-foreground">
              Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Droit d\'accès', 'Obtenir une copie des données que nous détenons sur vous (art. 15).'],
                ['Droit de rectification', 'Corriger des données inexactes ou incomplètes (art. 16).'],
                ['Droit à l\'effacement', 'Demander la suppression de vos données (art. 17), sous réserve d\'obligations légales.'],
                ['Droit à la limitation', 'Restreindre le traitement de vos données dans certains cas (art. 18).'],
                ['Droit à la portabilité', 'Recevoir vos données dans un format structuré et lisible (art. 20).'],
                ['Droit d\'opposition', 'Vous opposer au traitement fondé sur l\'intérêt légitime (art. 21).'],
                ['Droit de retrait du consentement', 'Retirer votre consentement à tout moment sans affecter les traitements antérieurs.'],
                ['Droit de recours', 'Introduire une réclamation auprès de la CNIL (cnil.fr).'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-medium text-foreground text-xs">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-muted-foreground">
              Pour exercer vos droits, envoyez votre demande (avec copie d&apos;un justificatif d&apos;identité si
              nécessaire) à :{' '}
              {s.contactEmail && (
                <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">{s.contactEmail}</a>
              )}.
              Nous répondrons dans un délai maximum de 30 jours.
            </p>
          </section>

          {/* 7 — Cookies */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">7. Cookies et traceurs</h2>
            <p className="text-muted-foreground mb-4">
              Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du service.
              Aucun cookie publicitaire ou de profilage tiers n&apos;est déposé.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2.5 text-left font-semibold text-foreground">Cookie</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-foreground">Finalité</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-foreground">Durée</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ['next-auth.session-token', 'Authentification et maintien de session', 'Session / 30 jours'],
                    ['admin-token', 'Session administrateur', 'Session'],
                    ['locale', 'Mémorisation de la langue préférée', '1 an'],
                    ['currency', 'Mémorisation de la devise préférée', '1 an'],
                  ].map(([name, purpose, duration]) => (
                    <tr key={name} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-mono">{name}</td>
                      <td className="px-3 py-2.5">{purpose}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Vous pouvez désactiver les cookies dans les paramètres de votre navigateur. La désactivation des
              cookies de session empêchera la connexion à votre compte.
            </p>
          </section>

          {/* 8 — Sécurité */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">8. Sécurité des données</h2>
            <p className="text-muted-foreground">
              {s.siteName} met en œuvre des mesures techniques et organisationnelles adaptées pour protéger
              vos données contre tout accès non autorisé, perte, altération ou divulgation :
            </p>
            <ul className="mt-3 ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Chiffrement des mots de passe (bcrypt)</li>
              <li>Communications chiffrées via HTTPS / TLS</li>
              <li>Accès aux données restreint aux personnels habilités</li>
              <li>Journalisation des accès et détection d&apos;anomalies</li>
              <li>Sauvegardes régulières de la base de données</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits et libertés,
              nous vous en informerons dans les meilleurs délais, conformément à l&apos;article 34 du RGPD.
            </p>
          </section>

          {/* 9 — Mineurs */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">9. Mineurs</h2>
            <p className="text-muted-foreground">
              La plateforme {s.siteName} est destinée à des utilisateurs âgés de 18 ans et plus. Nous ne
              collectons pas sciemment de données personnelles relatives à des mineurs. Si vous avez
              connaissance qu&apos;un mineur nous a fourni des données sans autorisation parentale, contactez-nous
              afin que nous procédions à leur suppression.
            </p>
          </section>

          {/* 10 — Modifications */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">10. Modifications de la politique</h2>
            <p className="text-muted-foreground">
              {s.siteName} se réserve le droit de modifier la présente politique de confidentialité à tout
              moment. Les utilisateurs seront informés de toute modification substantielle par email ou par
              une notification visible sur la plateforme. La date de dernière mise à jour est indiquée en
              haut de ce document.
            </p>
          </section>

          {/* 11 — Contact */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">11. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative à cette politique ou pour exercer vos droits :
            </p>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              {s.contactEmail && (
                <li>Email : <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">{s.contactEmail}</a></li>
              )}
              {s.contactPhone && (
                <li>Téléphone : <a href={`tel:${s.contactPhone}`} className="hover:underline text-foreground">{s.contactPhone}</a></li>
              )}
              {s.contactAddress && <li>Courrier : {s.contactAddress}</li>}
              <li>
                CNIL :{' '}
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  cnil.fr/fr/plaintes
                </a>
              </li>
            </ul>
          </section>

          {/* Pied */}
          <div className="border-t border-border pt-8 text-xs text-muted-foreground">
            <p>
              Dernière mise à jour : 1er janvier {year} — &copy; {year} {s.siteName}. Tous droits réservés.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
              <Link href="/listings" className="hover:text-foreground transition-colors">Voir les annonces</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function DataBlock({ title, children }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    await dbConnect();
    const raw = await Settings.findOne({ key: 'global' }).lean();
    if (!raw) return { props: { settings: {} } };
    const settings = SETTINGS_FIELDS.reduce((acc, k) => ({ ...acc, [k]: raw[k] ?? '' }), {});
    return { props: { settings } };
  } catch {
    return { props: { settings: {} } };
  }
}
