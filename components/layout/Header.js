import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, User, LogOut, ChevronRight, ChevronDown,
  Globe, Coins, Search, Home, Building2, CalendarDays, UserCircle,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useCurrency } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/lib/contexts/SiteSettingsContext';

const LANGUAGES = [
  { code: 'fr', label: 'Francais', flag: 'FR' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'es', label: 'Espanol', flag: 'ES' },
  { code: 'it', label: 'Italiano', flag: 'IT' },
  { code: 'pt', label: 'Portugues', flag: 'PT' },
  { code: 'nl', label: 'Nederlands', flag: 'NL' },
];

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const { currency, setCurrency, currencies, currencyCodes } = useCurrency(locale);
  const siteSettings = useSiteSettings();
  const siteName = siteSettings.siteName || 'Maxo Destinations';
  const siteTagline = siteSettings.tagline || 'Premium Living';
  const siteInitial = siteName.charAt(0).toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const currentCurrency = currencies[currency] || currencies.EUR;
  const CURRENCY_LIST = currencyCodes.map((code) => currencies[code]);

  const userMenuRef = useRef(null);
  const langRef = useRef(null);
  const currencyRef = useRef(null);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRoute = () => setMobileOpen(false);
    router.events.on('routeChangeStart', handleRoute);
    return () => router.events.off('routeChangeStart', handleRoute);
  }, [router]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  function submitSearch(e) {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/listings?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? 'glass border-b shadow-lg shadow-black/[0.03]'
            : 'bg-background/0'
        }`}
      >
        {/* Top bar — lang/currency */}
        <div
          className={`hidden border-b border-border/50 transition-all duration-300 lg:block ${
            scrolled ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-10 opacity-100'
          }`}
        >
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" />
              Locations d&apos;exception &mdash; Decouvrez nos biens premium
            </p>
            <div className="flex items-center gap-1">
              {/* Language picker */}
              <div ref={langRef} className="relative">
                <button
                  onClick={() => { setLangOpen(!langOpen); setCurrencyOpen(false); }}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{currentLang.flag}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                <Dropdown open={langOpen}>
                  {LANGUAGES.map((lang) => (
                    <DropdownItem
                      key={lang.code}
                      active={locale === lang.code}
                      onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                    >
                      <span className="font-medium">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              <div className="mx-1 h-4 w-px bg-border" />

              {/* Currency picker */}
              <div ref={currencyRef} className="relative">
                <button
                  onClick={() => { setCurrencyOpen(!currencyOpen); setLangOpen(false); }}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>{currentCurrency.symbol} {currency}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
                </button>
                <Dropdown open={currencyOpen}>
                  {CURRENCY_LIST.map((cur) => (
                    <DropdownItem
                      key={cur.code}
                      active={currency === cur.code}
                      onClick={() => { setCurrency(cur.code); setCurrencyOpen(false); }}
                    >
                      <span className="w-8 font-medium">{cur.symbol}</span>
                      <span>{cur.name}</span>
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* Main nav bar */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:h-[4.25rem]">
          {/* Logo */}
          <Link href="/" className="group relative flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
              <span className="font-display text-xl font-bold text-primary-foreground transition-transform duration-300 group-hover:scale-110">{siteInitial}</span>
              <div className="absolute -inset-1 rounded-xl bg-accent/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                {siteName}
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-accent lg:block">
                {siteTagline}
              </span>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            <DesktopNavLink href="/listings" active={isActive('/listings')}>
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
              Annonces
            </DesktopNavLink>

            {session && (
              <>
                <DesktopNavLink href="/bookings" active={isActive('/bookings')}>
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  Reservations
                </DesktopNavLink>
              </>
            )}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground lg:flex"
              aria-label="Rechercher"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Compact lang/currency for scrolled state */}
            <div className={`hidden items-center gap-1 transition-all duration-300 lg:flex ${scrolled ? 'w-auto opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
              <div ref={scrolled ? langRef : undefined} className="relative">
                <button
                  onClick={() => { setLangOpen(!langOpen); setCurrencyOpen(false); }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={currentLang.label}
                >
                  {currentLang.flag}
                </button>
              </div>
              <div ref={scrolled ? currencyRef : undefined} className="relative">
                <button
                  onClick={() => { setCurrencyOpen(!currencyOpen); setLangOpen(false); }}
                  className="flex h-9 items-center justify-center rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={currentCurrency.name}
                >
                  {currentCurrency.symbol}
                </button>
              </div>
            </div>

            <div className="hidden h-6 w-px bg-border/60 lg:block" />

            {/* Auth / User section */}
            {session ? (
              <div ref={userMenuRef} className="relative hidden lg:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-muted"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white shadow-sm">
                    {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" />
                  </div>
                  <div className="hidden flex-col items-start xl:flex">
                    <span className="text-sm font-medium text-foreground">{session.user.name || 'Utilisateur'}</span>
                    <span className="text-[10px] text-muted-foreground">{session.user.email}</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User dropdown */}
                <div className={`absolute right-0 top-full mt-2 w-56 origin-top-right transition-all duration-200 ${
                  userMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                }`}>
                  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/[0.08]">
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <UserMenuItem href="/account" icon={UserCircle}>
                        Mon compte
                      </UserMenuItem>
                      <UserMenuItem href="/bookings" icon={CalendarDays}>
                        Mes reservations
                      </UserMenuItem>
                    </div>
                    <div className="border-t border-border p-1.5">
                      <button
                        onClick={() => { signOut({ callbackUrl: '/' }); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Deconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                  <Link href="/auth/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild className="group shadow-md shadow-primary/20">
                  <Link href="/auth/register">
                    Inscription
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <div className="flex w-5 flex-col items-end gap-[5px]">
                <span className={`block h-[2px] rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? 'w-5 translate-y-[7px] rotate-45' : 'w-5'}`} />
                <span className={`block h-[2px] rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? 'w-0 opacity-0' : 'w-3.5'}`} />
                <span className={`block h-[2px] rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? 'w-5 -translate-y-[7px] -rotate-45' : 'w-5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Search bar expandable */}
        <div className={`overflow-hidden border-t border-border/50 transition-all duration-300 ${
          searchOpen ? 'max-h-16 opacity-100' : 'max-h-0 border-t-transparent opacity-0'
        }`}>
          <form
            onSubmit={submitSearch}
            className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Villa avec piscine, chalet en montagne, appartement bord de mer..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus={searchOpen}
            />
            {searchQuery.trim() && (
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <Search className="h-3.5 w-3.5" />
                Rechercher
              </button>
            )}
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile menu — full screen overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 lg:hidden ${
          mobileOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-background shadow-2xl transition-transform duration-500 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-lg font-bold text-primary-foreground">{siteInitial}</span>
              </div>
              <span className="font-display text-lg font-semibold">{siteName}</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile nav links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-1">
              <MobileNavItem href="/" icon={Home} active={router.pathname === '/'} onClick={() => setMobileOpen(false)}>
                Accueil
              </MobileNavItem>
              <MobileNavItem href="/listings" icon={Building2} active={isActive('/listings')} onClick={() => setMobileOpen(false)}>
                Annonces
              </MobileNavItem>

              {session && (
                <>
                  <MobileNavItem href="/bookings" icon={CalendarDays} active={isActive('/bookings')} onClick={() => setMobileOpen(false)}>
                    Mes reservations
                  </MobileNavItem>
                  <MobileNavItem href="/account" icon={UserCircle} active={isActive('/account')} onClick={() => setMobileOpen(false)}>
                    Mon compte
                  </MobileNavItem>
                </>
              )}
            </div>

            {/* Lang & Currency in mobile */}
            <div className="mt-8">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Preferences
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Language */}
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Langue
                  </p>
                  <div className="space-y-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                          locale === lang.code
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="font-medium">{lang.flag}</span>
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency */}
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    Devise
                  </p>
                  <div className="space-y-1">
                    {CURRENCY_LIST.map((cur) => (
                      <button
                        key={cur.code}
                        onClick={() => setCurrency(cur.code)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                          currency === cur.code
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="w-6 font-medium">{cur.symbol}</span>
                        {cur.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile footer / auth */}
          <div className="border-t border-border px-4 py-4">
            {session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                    {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Deconnexion
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button className="flex-1 shadow-md" asChild>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                    Inscription
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Sub-components ─── */

function DesktopNavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {/* Animated underline */}
      <span
        className={`absolute -bottom-0.5 left-3.5 right-3.5 h-[2px] rounded-full bg-accent transition-all duration-300 ${
          active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-75 group-hover:opacity-60'
        }`}
      />
    </Link>
  );
}

function MobileNavItem({ href, icon: Icon, active, onClick, children }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <span>{children}</span>
      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
    </Link>
  );
}

function Dropdown({ open, children }) {
  return (
    <div className={`absolute right-0 top-full mt-1.5 min-w-[160px] origin-top-right transition-all duration-200 ${
      open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
    }`}>
      <div className="overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/[0.08]">
        {children}
      </div>
    </div>
  );
}

function DropdownItem({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
        active
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      {children}
      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
    </button>
  );
}

function UserMenuItem({ href, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </Link>
  );
}
