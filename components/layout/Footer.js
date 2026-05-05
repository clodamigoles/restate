import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/lib/contexts/SiteSettingsContext';

function IconFacebook({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconInstagram({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconTwitter({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function IconYoutube({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
    </svg>
  );
}

export default function Footer() {
  const s = useSiteSettings();
  const initial = (s.siteName || 'R').charAt(0).toUpperCase();

  return (
    <footer className="border-t bg-secondary/50">
      <div className="divider-gold" />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">{initial}</span>
              </div>
              <span className="font-display text-xl font-semibold tracking-tight">
                {s.siteName || 'Maxo Destinations'}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {s.siteDescription || 'Votre partenaire de confiance pour la location courte durée. Des séjours d\'exception, à portée de clic.'}
            </p>

            {/* Réseaux sociaux */}
            {(s.socialFacebook || s.socialInstagram || s.socialTwitter || s.socialYoutube) && (
              <div className="mt-4 flex items-center gap-3">
                {s.socialFacebook && (
                  <a href={s.socialFacebook} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground">
                    <IconFacebook className="h-4 w-4" />
                  </a>
                )}
                {s.socialInstagram && (
                  <a href={s.socialInstagram} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground">
                    <IconInstagram className="h-4 w-4" />
                  </a>
                )}
                {s.socialTwitter && (
                  <a href={s.socialTwitter} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground">
                    <IconTwitter className="h-4 w-4" />
                  </a>
                )}
                {s.socialYoutube && (
                  <a href={s.socialYoutube} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground">
                    <IconYoutube className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Explorer
            </h4>
            <ul className="mt-4 space-y-2.5">
              <FooterLink href="/listings">Toutes les annonces</FooterLink>
              <FooterLink href="/listings?type=villa">Villas</FooterLink>
              <FooterLink href="/listings?type=apartment">Appartements</FooterLink>
              <FooterLink href="/listings?type=gite">Gîtes</FooterLink>
            </ul>
          </div>

          {/* Compte */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Mon espace
            </h4>
            <ul className="mt-4 space-y-2.5">
              <FooterLink href="/auth/login">Connexion</FooterLink>
              <FooterLink href="/auth/register">Créer un compte</FooterLink>
              <FooterLink href="/bookings">Mes réservations</FooterLink>
              <FooterLink href="/account">Mon profil</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {s.contactEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-accent" />
                  <a href={`mailto:${s.contactEmail}`} className="hover:text-foreground transition-colors">
                    {s.contactEmail}
                  </a>
                </li>
              )}
              {s.contactPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  <a href={`tel:${s.contactPhone}`} className="hover:text-foreground transition-colors">
                    {s.contactPhone}
                  </a>
                </li>
              )}
              {s.contactAddress && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {s.contactAddress}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {s.siteName || 'Maxo Destinations'}. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span className="cursor-pointer transition-colors hover:text-foreground">Mentions légales</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">Confidentialité</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">CGU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
