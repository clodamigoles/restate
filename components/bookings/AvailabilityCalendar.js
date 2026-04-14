import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { isBefore, isAfter, startOfDay, addDays, isSameDay } from 'date-fns';
import 'react-day-picker/dist/style.css';

export default function AvailabilityCalendar({
  listingId,
  onRangeSelect,
  numberOfMonths = 1,
  extraDisabledRanges = [],
  range,
  onRangeChange,
}) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!listingId) return;
    const now = new Date();
    fetch(`/api/listings/${listingId}/availability?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const ranges = [
          ...(data.data.bookings || []).map((b) => ({
            from: startOfDay(new Date(b.checkIn)),
            to: startOfDay(addDays(new Date(b.checkOut), -1)),
          })),
          ...(data.data.blockedDates || []).map((b) => ({
            from: startOfDay(new Date(b.start)),
            to: startOfDay(addDays(new Date(b.end), -1)),
          })),
        ];
        setBookedRanges(ranges);
      });
  }, [listingId]);

  const allDisabled = useMemo(
    () => [...bookedRanges, ...extraDisabledRanges],
    [bookedRanges, extraDisabledRanges],
  );

  // Quand l'arrivée est choisie mais pas le départ, on calcule la première date
  // réservée après l'arrivée pour bloquer tout ce qui est au-delà.
  const checkoutCutoff = useMemo(() => {
    if (!range?.from || range?.to) return null;
    const from = startOfDay(range.from);
    let earliest = null;
    for (const r of allDisabled) {
      const blockStart = startOfDay(r.from);
      if (isAfter(blockStart, from) || isSameDay(blockStart, from)) {
        if (!earliest || isBefore(blockStart, earliest)) {
          earliest = blockStart;
        }
      }
    }
    return earliest;
  }, [range, allDisabled]);

  const disabledMatcher = (date) => {
    const d = startOfDay(date);
    // Dates passées
    if (isBefore(d, today)) return true;
    // Dates réservées individuellement
    if (allDisabled.some((r) => d >= startOfDay(r.from) && d <= startOfDay(r.to))) return true;
    // Après sélection de l'arrivée : bloquer tout ce qui est >= première résa suivante
    if (checkoutCutoff && (isAfter(d, checkoutCutoff) || isSameDay(d, checkoutCutoff))) return true;
    return false;
  };

  function handleSelect(selected) {
    const val = selected ?? { from: undefined, to: undefined };
    onRangeChange?.(val);
    if (val.from && val.to) {
      onRangeSelect?.(val.from, val.to);
    }
  }

  const pickingCheckout = range?.from && !range?.to;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
      {/* Message de guidage contextuel */}
      <div className="border-b px-4 py-2.5 text-xs text-muted-foreground">
        {pickingCheckout ? (
          <span className="font-medium text-primary">
            Arrivée le {range.from.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — choisissez votre date de départ
          </span>
        ) : (
          <span>Sélectionnez votre date d&apos;arrivée</span>
        )}
      </div>
      <DayPicker
        mode="range"
        min={1}
        selected={range}
        onSelect={handleSelect}
        locale={fr}
        numberOfMonths={numberOfMonths}
        disabled={disabledMatcher}
        excludeDisabled
        startMonth={today}
        className="p-3"
      />
    </div>
  );
}
