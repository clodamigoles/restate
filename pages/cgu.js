import Head from 'next/head';
import Link from 'next/link';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { SITE_DEFAULTS } from '@/lib/contexts/SiteSettingsContext';

const SETTINGS_FIELDS = [
  'siteName', 'siteDescription',
  'contactEmail', 'contactPhone', 'contactAddress',
  'legalCompanyType', 'legalSiret',
];

export default function CGU({ settings }) {
  const s = { ...SITE_DEFAULTS, ...settings };
  const year = new Date().getFullYear();
  const city = s.contactAddress?.split(',')[0]?.trim() || 'Paris';

  return (
    <>
      <Head>
        <title>Conditions Générales d&apos;Utilisation — {s.siteName}</title>
        <meta name="description" content={`Conditions générales d'utilisation de la plateforme ${s.siteName}.`} />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Version en vigueur au 1er janvier {year}. En utilisant la plateforme {s.siteName}, vous acceptez
            sans réserve les présentes CGU.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-7 text-foreground">

          {/* 1 — Objet */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">1. Objet</h2>
            <p className="text-muted-foreground">
              Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») ont pour objet de définir
              les modalités et conditions d&apos;utilisation de la plateforme{' '}
              <strong className="text-foreground">{s.siteName}</strong>
              {s.legalCompanyType && <> ({s.legalCompanyType})</>}
              {s.legalSiret && <>, SIRET {s.legalSiret}</>}, accessible à l&apos;adresse{' '}
              <span className="font-medium text-foreground">{s.siteName.toLowerCase().replace(/\s/g, '')}.com</span>{' '}
              et sur l&apos;ensemble de ses sous-domaines et applications associées (ci-après la « Plateforme »).
            </p>
            <p className="mt-3 text-muted-foreground">
              {s.siteName} est une plateforme de mise en relation entre des propriétaires ou gestionnaires
              de biens immobiliers (ci-après les « Hôtes ») et des personnes à la recherche d&apos;hébergements
              de courte durée (ci-après les « Voyageurs »). {s.siteName} agit en qualité d&apos;intermédiaire
              et n&apos;est pas partie au contrat de location conclu entre l&apos;Hôte et le Voyageur.
            </p>
          </section>

          {/* 2 — Acceptation */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">2. Acceptation des CGU</h2>
            <p className="text-muted-foreground">
              L&apos;accès et l&apos;utilisation de la Plateforme impliquent l&apos;acceptation pleine et entière des
              présentes CGU. Toute personne qui n&apos;accepte pas ces conditions doit s&apos;abstenir d&apos;utiliser
              la Plateforme.
            </p>
            <p className="mt-3 text-muted-foreground">
              {s.siteName} se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
              seront informés de toute modification substantielle. La poursuite de l&apos;utilisation de la
              Plateforme après notification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          {/* 3 — Inscription */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">3. Inscription et compte utilisateur</h2>
            <p className="text-muted-foreground">
              L&apos;utilisation complète de la Plateforme nécessite la création d&apos;un compte personnel. L&apos;utilisateur
              s&apos;engage à :
            </p>
            <ul className="mt-3 ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>Fournir des informations exactes, complètes et à jour lors de son inscription</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              <li>Notifier immédiatement {s.siteName} de toute utilisation non autorisée de son compte</li>
              <li>Ne pas créer plusieurs comptes ou usurper l&apos;identité d&apos;un tiers</li>
              <li>Être âgé d&apos;au moins 18 ans et avoir la capacité juridique de contracter</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              {s.siteName} se réserve le droit de suspendre ou supprimer tout compte en cas de violation
              des présentes CGU, sans préavis ni indemnité.
            </p>
          </section>

          {/* 4 — Hôtes */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">4. Conditions applicables aux Hôtes</h2>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">4.1 Publication d&apos;annonces</h3>
            <p className="text-muted-foreground">
              Pour publier une annonce, l&apos;Hôte doit disposer des droits nécessaires sur le bien mis en
              location (propriétaire, mandataire, locataire autorisé). L&apos;Hôte s&apos;engage à :
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Fournir des descriptions exactes et des photographies fidèles du bien</li>
              <li>Respecter la réglementation applicable à la location de courte durée (déclaration en mairie, plafond de 120 nuits/an pour les résidences principales, etc.)</li>
              <li>S&apos;acquitter de la taxe de séjour applicable et de toute obligation fiscale</li>
              <li>Maintenir le bien dans un état conforme à la description publiée</li>
              <li>Répondre aux demandes de réservation dans un délai raisonnable</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Toute annonce est soumise à validation par {s.siteName} avant publication. {s.siteName} se
              réserve le droit de refuser ou retirer toute annonce sans avoir à en justifier les raisons.
            </p>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">4.2 Tarification et disponibilités</h3>
            <p className="text-muted-foreground">
              L&apos;Hôte est seul responsable de la définition de ses tarifs et de la mise à jour de son
              calendrier de disponibilités. Les prix affichés sont en euros toutes taxes comprises, hors
              frais de ménage et taxe de séjour, sauf indication contraire.
            </p>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">4.3 Commission de la plateforme</h3>
            <p className="text-muted-foreground">
              En contrepartie des services rendus, {s.siteName} prélève une commission sur chaque réservation
              confirmée. Le montant de cette commission est communiqué à l&apos;Hôte lors de son inscription et
              peut évoluer sous réserve de notification préalable.
            </p>
          </section>

          {/* 5 — Voyageurs */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">5. Conditions applicables aux Voyageurs</h2>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">5.1 Processus de réservation</h3>
            <p className="text-muted-foreground">
              La réservation est constituée des étapes suivantes :
            </p>
            <ol className="mt-2 ml-4 list-decimal space-y-1 text-muted-foreground">
              <li>Sélection du logement, des dates et du nombre de voyageurs</li>
              <li>Vérification des disponibilités et du prix total</li>
              <li>Paiement sécurisé via la Plateforme</li>
              <li>Confirmation de réservation par email</li>
            </ol>
            <p className="mt-3 text-muted-foreground">
              La réservation n&apos;est définitive qu&apos;après confirmation par email et débit du paiement.
              Pour les réservations à approbation manuelle, la demande reste soumise à validation par l&apos;Hôte.
            </p>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">5.2 Obligations du Voyageur</h3>
            <p className="text-muted-foreground">Le Voyageur s&apos;engage à :</p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Respecter le règlement intérieur du logement</li>
              <li>Ne pas sous-louer le logement ou le céder à des tiers non déclarés</li>
              <li>Traiter le logement et son contenu avec soin</li>
              <li>Signaler tout dommage causé pendant le séjour</li>
              <li>Libérer le logement à l&apos;heure de départ convenue</li>
              <li>Ne pas dépasser le nombre de personnes indiqué dans la réservation</li>
            </ul>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">5.3 Dépôt de garantie</h3>
            <p className="text-muted-foreground">
              Certains logements peuvent requérir un dépôt de garantie dont le montant est indiqué sur
              l&apos;annonce. Ce dépôt est restitué dans un délai de 7 jours ouvrés après le départ, déduction
              faite des éventuelles réparations ou compensations dues.
            </p>
          </section>

          {/* 6 — Paiement */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">6. Prix et paiement</h2>
            <p className="text-muted-foreground">
              Les paiements sont effectués exclusivement via les moyens de paiement proposés sur la
              Plateforme (PayPal, virement bancaire). Tout paiement effectué en dehors de la Plateforme
              est effectué sous la seule responsabilité des parties et ne bénéficie d&apos;aucune garantie
              de {s.siteName}.
            </p>
            <p className="mt-3 text-muted-foreground">
              Le prix total affiché comprend le prix de la location, les frais de ménage le cas échéant,
              et la taxe de séjour applicable. Les frais de service de la Plateforme sont inclus dans
              le prix affiché au Voyageur.
            </p>
            <p className="mt-3 text-muted-foreground">
              En cas de refus de paiement ou de paiement frauduleux, la réservation est automatiquement
              annulée. {s.siteName} se réserve le droit de suspendre le compte concerné.
            </p>
          </section>

          {/* 7 — Annulation */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">7. Politique d&apos;annulation</h2>

            <p className="text-muted-foreground">
              Chaque annonce précise sa politique d&apos;annulation parmi les options suivantes :
            </p>

            <div className="mt-4 space-y-3">
              {[
                {
                  name: 'Flexible',
                  desc: 'Remboursement intégral si annulation au moins 24 heures avant l\'arrivée. Passé ce délai, la première nuit est retenue.',
                },
                {
                  name: 'Modérée',
                  desc: 'Remboursement intégral si annulation au moins 5 jours avant l\'arrivée. Entre 5 jours et 24 heures, remboursement de 50 %. Moins de 24 heures : aucun remboursement.',
                },
                {
                  name: 'Stricte',
                  desc: 'Remboursement de 50 % si annulation au moins 7 jours avant l\'arrivée. Aucun remboursement passé ce délai.',
                },
                {
                  name: 'Non remboursable',
                  desc: 'Aucun remboursement quelle que soit la date d\'annulation. En contrepartie, le tarif affiché peut être réduit.',
                },
              ].map((p) => (
                <div key={p.name} className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="mt-1 text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-muted-foreground">
              En cas de force majeure dûment justifiée (catastrophe naturelle, décès, maladie grave),
              {s.siteName} peut, à sa discrétion, accorder un remboursement ou un avoir indépendamment
              de la politique d&apos;annulation applicable.
            </p>
          </section>

          {/* 8 — Avis */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">8. Système d&apos;avis</h2>
            <p className="text-muted-foreground">
              Suite à chaque séjour, le Voyageur peut laisser un avis sur le logement. L&apos;Hôte peut
              également évaluer le Voyageur. Ces avis doivent être objectifs, honnêtes et respectueux.
            </p>
            <p className="mt-3 text-muted-foreground">
              {s.siteName} se réserve le droit de modérer ou supprimer tout avis contenant des propos
              diffamatoires, injurieux, discriminatoires ou contraires aux présentes CGU.
              Les avis publiés ne sauraient engager la responsabilité de {s.siteName}.
            </p>
          </section>

          {/* 9 — Responsabilités */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">9. Responsabilités</h2>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">9.1 Responsabilité de {s.siteName}</h3>
            <p className="text-muted-foreground">
              {s.siteName} agit en qualité d&apos;intermédiaire technique et ne peut être tenu responsable :
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Du contenu des annonces publiées par les Hôtes</li>
              <li>De l&apos;exactitude des informations fournies par les utilisateurs</li>
              <li>De la qualité des hébergements ou des services proposés</li>
              <li>Des litiges survenant directement entre Hôtes et Voyageurs</li>
              <li>Des interruptions de service liées à des cas de force majeure ou maintenance</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              La responsabilité de {s.siteName} est en tout état de cause limitée au montant des sommes
              effectivement perçues au titre de la réservation concernée.
            </p>

            <h3 className="mt-4 mb-2 font-semibold text-foreground">9.2 Responsabilité des utilisateurs</h3>
            <p className="text-muted-foreground">
              Chaque utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait de la Plateforme,
              des informations qu&apos;il publie et des engagements qu&apos;il prend envers les autres utilisateurs.
              L&apos;utilisateur garantit {s.siteName} contre tout recours, plainte ou réclamation de tiers
              résultant de son utilisation de la Plateforme.
            </p>
          </section>

          {/* 10 — Comportements interdits */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">10. Comportements interdits</h2>
            <p className="text-muted-foreground">Il est strictement interdit :</p>
            <ul className="mt-3 ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>De contourner la Plateforme pour conclure des transactions directes entre Hôtes et Voyageurs afin d&apos;éviter les frais de service</li>
              <li>De publier des annonces fictives, trompeuses ou relatives à des biens que l&apos;on n&apos;est pas autorisé à louer</li>
              <li>D&apos;utiliser la Plateforme à des fins illicites, frauduleuses ou contraires à l&apos;ordre public</li>
              <li>De diffuser du contenu offensant, discriminatoire, pornographique ou portant atteinte aux droits de tiers</li>
              <li>D&apos;utiliser des robots, scrapers ou tout outil automatisé pour accéder à la Plateforme</li>
              <li>De tenter de compromettre la sécurité ou l&apos;intégrité de la Plateforme</li>
              <li>De harceler, menacer ou nuire à d&apos;autres utilisateurs</li>
            </ul>
          </section>

          {/* 11 — Propriété intellectuelle */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">11. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L&apos;ensemble des éléments de la Plateforme (marques, logos, textes, design, code source) est
              la propriété exclusive de {s.siteName} et est protégé par le droit de la propriété
              intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.
            </p>
            <p className="mt-3 text-muted-foreground">
              En publiant du contenu (photos, textes, avis) sur la Plateforme, l&apos;utilisateur accorde à
              {s.siteName} une licence mondiale, non exclusive, gratuite et pour la durée de protection
              légale, d&apos;utiliser ce contenu dans le cadre de l&apos;exploitation de la Plateforme.
            </p>
          </section>

          {/* 12 — Résiliation */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">12. Suspension et résiliation</h2>
            <p className="text-muted-foreground">
              L&apos;utilisateur peut clôturer son compte à tout moment en faisant la demande auprès de{' '}
              {s.contactEmail && (
                <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">{s.contactEmail}</a>
              )}. La suppression du compte n&apos;affecte pas les réservations en cours.
            </p>
            <p className="mt-3 text-muted-foreground">
              {s.siteName} peut suspendre ou résilier un compte sans préavis en cas de :
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Violation des présentes CGU</li>
              <li>Comportement frauduleux ou trompeur</li>
              <li>Manquement grave aux obligations contractuelles</li>
              <li>Décision judiciaire ou administrative</li>
            </ul>
          </section>

          {/* 13 — Droit applicable */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">13. Droit applicable et litiges</h2>
            <p className="text-muted-foreground">
              Les présentes CGU sont régies par le droit français. En cas de litige relatif à leur
              interprétation ou à leur exécution, les parties s&apos;engagent à rechercher une solution amiable
              avant tout recours judiciaire.
            </p>
            <p className="mt-3 text-muted-foreground">
              En cas de litige non résolu amiablement, les tribunaux compétents de{' '}
              <span className="font-medium text-foreground">{city}</span> seront seuls compétents.
            </p>
            <p className="mt-3 text-muted-foreground">
              Conformément à l&apos;article L.612-1 du Code de la consommation, tout consommateur a le droit
              de recourir gratuitement à un médiateur de la consommation. La plateforme de règlement en
              ligne des litiges de la Commission européenne est accessible à :{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                ec.europa.eu/consumers/odr
              </a>.
            </p>
          </section>

          {/* 14 — Contact */}
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider">14. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative aux présentes CGU :
            </p>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              {s.contactEmail && (
                <li>Email : <a href={`mailto:${s.contactEmail}`} className="text-primary hover:underline">{s.contactEmail}</a></li>
              )}
              {s.contactPhone && (
                <li>Téléphone : <a href={`tel:${s.contactPhone}`} className="hover:underline text-foreground">{s.contactPhone}</a></li>
              )}
              {/* {s.contactAddress && <li>Courrier : {s.contactAddress}</li>} */}
            </ul>
          </section>

          {/* Pied */}
          <div className="border-t border-border pt-8 text-xs text-muted-foreground">
            <p>
              Version du 1er janvier {year} — &copy; {year} {s.siteName}. Tous droits réservés.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
              <Link href="/listings" className="hover:text-foreground transition-colors">Voir les annonces</Link>
            </div>
          </div>

        </div>
      </div>
    </>
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
