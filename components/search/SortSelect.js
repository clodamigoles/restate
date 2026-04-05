import { useRouter } from 'next/router';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Les plus recents' },
  { value: 'popular',   label: 'Les plus populaires' },
  { value: 'rating',    label: 'Meilleures notes' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc',label: 'Prix decroissant' },
];

export default function SortSelect() {
  const router = useRouter();
  const current = router.query.sort || 'newest';

  function handleChange(e) {
    const params = new URLSearchParams(router.query);
    params.set('sort', e.target.value);
    params.delete('page');
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
