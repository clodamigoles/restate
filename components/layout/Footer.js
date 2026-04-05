import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      {/* Divider doré */}
      <div className="divider-gold" />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <span className="font-display text-xl font-semibold tracking-tight">
                Restate
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Votre partenaire de confiance pour la location courte durée.
              Des séjours d'exception, à portée de clic.
            </p>
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
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                contact@restate.com
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                +33 1 23 45 67 89
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Paris, France
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Restate. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Mentions légales
            </span>
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Confidentialité
            </span>
            <span className="cursor-pointer transition-colors hover:text-foreground">
              CGU
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
