import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  MapPin, Calendar, Users, Search, X, ChevronLeft, ChevronRight,
  Minus, Plus, Sparkles,
} from 'lucide-react';

const FALLBACK_DESTINATIONS = [
  { name: 'Sud de la France', region: 'France' },
  { name: 'Bretagne', region: 'France' },
  { name: 'Normandie', region: 'France' },
  { name: 'Pyrenees', region: 'France' },
  { name: 'Ardeche', region: 'France' },
  { name: 'Cote d\'Azur', region: 'France' },
  { name: 'Alsace', region: 'France' },
  { name: 'Provence', region: 'France' },
];

const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MONTHS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

export default function HeroSearch({ cities = [] }) {
  const router = useRouter();
  const DESTINATIONS = cities.length > 0
    ? cities.map((c) => ({ name: c.name, region: c.region || 'France' }))
    : FALLBACK_DESTINATIONS;

  // 'destination' | 'arrival' | 'departure' | 'guests' | null
  const [activeField, setActiveField] = useState(null);
  const [destination, setDestination] = useState('');
  const [arrivalDate, setArrivalDate] = useState(null);
  const [departureDate, setDepartureDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const [guests, setGuests] = useState({ adults: 0, children: 0, rooms: 0 });
  const [filteredDestinations, setFilteredDestinations] = useState(DESTINATIONS);

  const containerRef = useRef(null);
  const destinationInputRef = useRef(null);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter destinations as user types
  useEffect(() => {
    if (!destination.trim()) {
      setFilteredDestinations(DESTINATIONS);
      return;
    }
    const q = destination.toLowerCase();
    setFilteredDestinations(
      DESTINATIONS.filter(
        (d) => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
      )
    );
  }, [destination]);

  const selectDestination = (dest) => {
    setDestination(dest.name);
    setActiveField('arrival');
  };

  const clearDestination = () => {
    setDestination('');
    destinationInputRef.current?.focus();
  };

  // ─── Calendar logic ───
  const getCalendarDays = (month, year) => {
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getSecondMonth = () => {
    let m = calendarMonth.month + 1;
    let y = calendarMonth.year;
    if (m > 11) { m = 0; y++; }
    return { month: m, year: y };
  };

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      return { month: m, year: y };
    });
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      return { month: m, year: y };
    });
  };

  const isToday = (day, month, year) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const isPast = (day, month, year) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(year, month, day) < now;
  };

  const isInRange = (day, month, year) => {
    if (!arrivalDate || !departureDate) return false;
    const d = new Date(year, month, day);
    return d > arrivalDate && d < departureDate;
  };

  const isSelected = (day, month, year) => {
    if (!day) return false;
    const d = new Date(year, month, day).toDateString();
    return (arrivalDate && arrivalDate.toDateString() === d) ||
           (departureDate && departureDate.toDateString() === d);
  };

  const isArrival = (day, month, year) => {
    if (!arrivalDate || !day) return false;
    return arrivalDate.toDateString() === new Date(year, month, day).toDateString();
  };

  const isDeparture = (day, month, year) => {
    if (!departureDate || !day) return false;
    return departureDate.toDateString() === new Date(year, month, day).toDateString();
  };

  // Selecting a date — behaves differently depending on which field is active
  const selectDate = (day, month, year) => {
    if (!day || isPast(day, month, year)) return;
    const d = new Date(year, month, day);

    if (activeField === 'arrival') {
      // If picking arrival, clear departure if it falls before new arrival
      setArrivalDate(d);
      if (departureDate && d >= departureDate) {
        setDepartureDate(null);
      }
      // Auto-switch to departure picker
      setActiveField('departure');
    } else if (activeField === 'departure') {
      if (arrivalDate && d <= arrivalDate) {
        // If user picks a date before arrival, treat as new arrival
        setArrivalDate(d);
        setDepartureDate(null);
        return;
      }
      setDepartureDate(d);
      // Auto-switch to guests
      setActiveField('guests');
    }
  };

  const formatDateShort = (date) => {
    if (!date) return null;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // ─── Guest logic ───
  const updateGuest = (type, delta) => {
    setGuests((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  const totalGuests = guests.adults + guests.children;

  const guestSummary = () => {
    const parts = [];
    if (guests.adults) parts.push(`${guests.adults} adulte${guests.adults > 1 ? 's' : ''}`);
    if (guests.children) parts.push(`${guests.children} enfant${guests.children > 1 ? 's' : ''}`);
    if (guests.rooms) parts.push(`${guests.rooms} chambre${guests.rooms > 1 ? 's' : ''}`);
    return parts.join(', ') || null;
  };

  // ─── Search ───
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set('location', destination);
    if (arrivalDate) params.set('checkin', arrivalDate.toISOString().split('T')[0]);
    if (departureDate) params.set('checkout', departureDate.toISOString().split('T')[0]);
    if (guests.adults) params.set('adults', guests.adults);
    if (guests.children) params.set('children', guests.children);
    if (guests.rooms) params.set('rooms', guests.rooms);
    router.push(`/listings?${params.toString()}`);
  };

  const calendarOpen = activeField === 'arrival' || activeField === 'departure';

  const renderMonth = (monthData, key) => {
    const days = getCalendarDays(monthData.month, monthData.year);
    return (
      <div key={key} className="flex-1 min-w-0">
        <p className="mb-3 text-center text-sm font-semibold text-foreground">
          {MONTHS[monthData.month]} {monthData.year}
        </p>
        <div className="grid grid-cols-7 gap-0">
          {DAYS.map((d) => (
            <div key={d} className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const past = isPast(day, monthData.month, monthData.year);
            const selected = isSelected(day, monthData.month, monthData.year);
            const inRange = isInRange(day, monthData.month, monthData.year);
            const arrival = isArrival(day, monthData.month, monthData.year);
            const departure = isDeparture(day, monthData.month, monthData.year);
            const today = isToday(day, monthData.month, monthData.year);

            return (
              <button
                key={`d-${i}`}
                disabled={past}
                onClick={() => selectDate(day, monthData.month, monthData.year)}
                className={`relative flex h-9 items-center justify-center text-sm transition-all duration-150
                  ${past ? 'cursor-not-allowed text-muted-foreground/30' : 'cursor-pointer hover:bg-accent/10'}
                  ${inRange ? 'bg-accent/[0.07]' : ''}
                  ${selected ? 'z-10' : ''}
                  ${arrival && departureDate ? 'rounded-l-full bg-accent/[0.07]' : ''}
                  ${departure ? 'rounded-r-full bg-accent/[0.07]' : ''}
                  ${inRange && !selected ? 'rounded-none' : ''}
                `}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150
                  ${selected ? 'bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20' : ''}
                  ${today && !selected ? 'font-bold text-accent ring-1 ring-accent/40' : ''}
                  ${!past && !selected && !today ? 'text-foreground' : ''}
                `}>
                  {day}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Reusable panel content renderers ───

  const renderDestinationContent = () => (
    <>
      <div className="p-4">
        {!destination.trim() && (
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            Destinations populaires
          </p>
        )}
        {destination.trim() && filteredDestinations.length > 0 && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Suggestions
          </p>
        )}
        <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
          {filteredDestinations.map((dest) => (
            <button
              key={dest.name}
              onClick={() => selectDestination(dest)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-muted"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {highlightMatch(dest.name, destination)}
                </p>
                <p className="text-xs text-muted-foreground">{dest.region}</p>
              </div>
            </button>
          ))}
          {filteredDestinations.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Aucun resultat pour &laquo; {destination} &raquo;</p>
              <p className="mt-1 text-xs text-muted-foreground/70">La recherche portera sur le texte saisi</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderCalendarContent = () => {
    const hasArrival   = !!arrivalDate;
    const hasDeparture = !!departureDate;
    const step         = hasArrival && !hasDeparture ? 2 : 1;
    const nights       = hasArrival && hasDeparture
      ? Math.round((departureDate - arrivalDate) / 86400000)
      : 0;

    return (
      <>
        {/* ── Indicateur d'étapes ── */}
        <div className="grid grid-cols-2 divide-x border-b border-border">

          {/* Étape 1 — Arrivée */}
          <button
            onClick={() => setActiveField('arrival')}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeField === 'arrival' ? 'bg-primary/5' : 'hover:bg-muted/30'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              hasArrival
                ? 'bg-emerald-500 text-white'
                : 'bg-primary text-primary-foreground ring-2 ring-primary/30'
            }`}>
              {hasArrival ? '✓' : '1'}
            </span>
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                hasArrival ? 'text-emerald-600' : 'text-primary'
              }`}>
                Arrivée
              </p>
              <p className={`truncate text-sm font-semibold ${
                hasArrival ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {arrivalDate
                  ? arrivalDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                  : 'Choisissez votre arrivée'}
              </p>
            </div>
          </button>

          {/* Étape 2 — Départ */}
          <button
            onClick={() => hasArrival && setActiveField('departure')}
            disabled={!hasArrival}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeField === 'departure'
                ? 'bg-primary/5'
                : hasArrival
                ? 'hover:bg-muted/30'
                : 'cursor-default'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              hasDeparture
                ? 'bg-emerald-500 text-white'
                : step === 2
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                : 'border-2 border-muted-foreground/25 text-muted-foreground/40'
            }`}>
              {hasDeparture ? '✓' : '2'}
            </span>
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                hasDeparture ? 'text-emerald-600' : step === 2 ? 'text-primary' : 'text-muted-foreground/50'
              }`}>
                Départ
              </p>
              <p className={`truncate text-sm font-semibold ${
                hasDeparture
                  ? 'text-foreground'
                  : step === 2
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/40'
              }`}>
                {departureDate
                  ? departureDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                  : step === 2
                  ? 'Choisissez votre départ'
                  : 'Après votre arrivée'}
              </p>
            </div>
          </button>
        </div>

        {/* ── Navigation des mois ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-xs font-semibold text-muted-foreground">
            {MONTHS[calendarMonth.month]} {calendarMonth.year}
            <span className="mx-2">·</span>
            {MONTHS[getSecondMonth().month]} {getSecondMonth().year}
          </p>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── Grilles calendrier ── */}
        <div className="p-4 pt-3">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            {renderMonth(calendarMonth, 'left')}
            {renderMonth(getSecondMonth(), 'right')}
          </div>
        </div>

        {/* ── Barre récapitulative ── */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
          <div className="text-sm">
            {hasArrival && hasDeparture ? (
              <span className="flex items-center gap-2 text-foreground">
                <span className="font-semibold">{formatDateShort(arrivalDate)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold">{formatDateShort(departureDate)}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {nights} nuit{nights > 1 ? 's' : ''}
                </span>
              </span>
            ) : hasArrival ? (
              <span className="text-muted-foreground">
                Arrivée le{' '}
                <span className="font-semibold text-foreground">{formatDateShort(arrivalDate)}</span>
                {' '}— choisissez le départ
              </span>
            ) : (
              <span className="text-muted-foreground">Sélectionnez votre date d&apos;arrivée</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {(hasArrival || hasDeparture) && (
              <button
                onClick={() => { setArrivalDate(null); setDepartureDate(null); setActiveField('arrival'); }}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Effacer
              </button>
            )}
            {hasArrival && hasDeparture && (
              <button
                onClick={() => setActiveField('guests')}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                Appliquer
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderGuestsContent = () => (
    <>
      <div className="p-4">
        <GuestRow label="Adultes" sublabel="13 ans et plus" value={guests.adults} onChange={(d) => updateGuest('adults', d)} />
        <div className="my-3 h-px bg-border" />
        <GuestRow label="Enfants" sublabel="2 - 12 ans" value={guests.children} onChange={(d) => updateGuest('children', d)} />
        <div className="my-3 h-px bg-border" />
        <GuestRow label="Chambres" sublabel="Nombre de chambres" value={guests.rooms} onChange={(d) => updateGuest('rooms', d)} />
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
        <button
          onClick={() => setGuests({ adults: 0, children: 0, rooms: 0 })}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Reinitialiser
        </button>
        <button
          onClick={() => setActiveField(null)}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          Appliquer
        </button>
      </div>
    </>
  );

  /** Mobile inline panel wrapper — renders directly under the field */
  const MobilePanel = ({ visible, title, children }) => {
    if (!visible) return null;
    return (
      <div className="border-t border-border bg-card lg:hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
          <button
            onClick={() => setActiveField(null)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {children}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ─── Search bar ─── */}
      <div className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/[0.08] transition-all duration-300 lg:flex-row lg:rounded-full ${
        activeField ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border'
      }`}>
        {/* Destination */}
        <div
          className={`group relative flex flex-1 items-center gap-3 px-6 py-4 transition-all lg:py-0 ${
            activeField === 'destination' ? 'bg-muted/50' : 'hover:bg-muted/30'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            activeField === 'destination' ? 'bg-accent text-accent-foreground shadow-md shadow-accent/20' : 'bg-accent/10 text-accent'
          }`}>
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Destination</p>
            <input
              ref={destinationInputRef}
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setActiveField('destination'); }}
              onFocus={() => setActiveField('destination')}
              placeholder="Ou voulez-vous aller ?"
              className="w-full truncate bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          {destination && (
            <button
              onClick={clearDestination}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: destination dropdown inline */}
        <MobilePanel visible={activeField === 'destination'} title="Destination">
          {renderDestinationContent()}
        </MobilePanel>

        <div className="hidden h-10 w-px self-center bg-border/60 lg:block" />

        {/* Champ dates combiné — arrivée & départ */}
        <button
          onClick={() => {
            const next = !arrivalDate ? 'arrival' : !departureDate ? 'departure' : 'arrival';
            setActiveField(calendarOpen ? null : next);
          }}
          className={`group relative flex flex-[2] items-center gap-3 border-t border-border/50 px-6 py-4 text-left transition-all lg:border-t-0 lg:border-r lg:border-r-border/60 lg:py-0 ${
            calendarOpen ? 'bg-muted/50' : 'hover:bg-muted/30'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            calendarOpen ? 'bg-accent text-accent-foreground shadow-md shadow-accent/20' : 'bg-accent/10 text-accent'
          }`}>
            <Calendar className="h-4.5 w-4.5" />
          </div>

          {(arrivalDate || departureDate) ? (
            /* Dates sélectionnées — affichage bicolonne */
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Arrivée</p>
                <p className={`truncate text-sm font-medium ${arrivalDate ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {formatDateShort(arrivalDate) || 'Sélectionner'}
                </p>
              </div>
              <div className="shrink-0 px-1">
                {arrivalDate && departureDate ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary whitespace-nowrap">
                    {Math.round((departureDate - arrivalDate) / 86400000)} nuit{Math.round((departureDate - arrivalDate) / 86400000) > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/30">→</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Départ</p>
                <p className={`truncate text-sm font-medium ${departureDate ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {formatDateShort(departureDate) || 'Sélectionner'}
                </p>
              </div>
            </div>
          ) : (
            /* Aucune date */
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dates</p>
              <p className="truncate text-sm font-medium text-muted-foreground/60">Arrivée &amp; Départ</p>
            </div>
          )}

          {(arrivalDate || departureDate) && (
            <span
              onClick={(e) => { e.stopPropagation(); setArrivalDate(null); setDepartureDate(null); }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>

        {/* Mobile: panneau calendrier unique */}
        <MobilePanel visible={calendarOpen} title="Dates">
          {renderCalendarContent()}
        </MobilePanel>

        <div className="hidden h-10 w-px self-center bg-border/60 lg:block" />

        {/* Guests */}
        <button
          onClick={() => setActiveField(activeField === 'guests' ? null : 'guests')}
          className={`group relative flex flex-1 items-center gap-3 border-t border-border/50 px-6 py-4 text-left transition-all lg:border-t-0 lg:py-0 ${
            activeField === 'guests' ? 'bg-muted/50' : 'hover:bg-muted/30'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            activeField === 'guests' ? 'bg-accent text-accent-foreground shadow-md shadow-accent/20' : 'bg-accent/10 text-accent'
          }`}>
            <Users className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Invites</p>
            <p className={`truncate text-sm font-medium ${totalGuests > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}>
              {guestSummary() || 'Combien ?'}
            </p>
          </div>
        </button>

        {/* Mobile: guests inline */}
        <MobilePanel visible={activeField === 'guests'} title="Invites">
          {renderGuestsContent()}
        </MobilePanel>

        {/* Search button */}
        <div className="flex items-center border-t border-border/50 p-3 lg:border-t-0 lg:pr-2">
          <button
            onClick={handleSearch}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] lg:h-12 lg:w-12 lg:rounded-full lg:px-0 xl:w-auto xl:rounded-xl xl:px-8"
          >
            <Search className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="lg:hidden xl:inline">Rechercher</span>
          </button>
        </div>
      </div>

      {/* ─── Desktop Dropdown Panels (absolute positioned, hidden on mobile) ─── */}

      {/* Destination */}
      <div className={`absolute left-0 right-0 z-[200] mt-2 hidden transition-all duration-300 top-full lg:left-0 lg:right-auto lg:w-[420px] ${
        activeField === 'destination' ? 'lg:block translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/[0.1]">
          {renderDestinationContent()}
        </div>
      </div>

      {/* Calendar */}
      <div className={`absolute left-0 right-0 z-[200] mt-2 hidden transition-all duration-300 top-full lg:left-1/2 lg:-translate-x-1/2 lg:w-[620px] ${
        calendarOpen ? 'lg:block translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/[0.1]">
          {renderCalendarContent()}
        </div>
      </div>

      {/* Guests */}
      <div className={`absolute right-0 z-[200] mt-2 hidden transition-all duration-300 top-full lg:left-auto lg:w-[340px] ${
        activeField === 'guests' ? 'lg:block translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/[0.1]">
          {renderGuestsContent()}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function GuestRow({ label, sublabel, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(-1)}
          disabled={value <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-foreground">{value}</span>
        <button
          onClick={() => onChange(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-accent hover:bg-accent/10 hover:text-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Highlights the matching portion of text in bold */
function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-accent">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
