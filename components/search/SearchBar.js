import { useState } from 'react';
import { useRouter } from 'next/router';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SearchBar({ initialQuery = '' }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full max-w-2xl items-center overflow-hidden rounded-full border bg-background shadow-md"
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Villa avec piscine, chalet en montagne..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" className="m-1 rounded-full px-6">
        <Search className="mr-2 h-4 w-4" />
        Rechercher
      </Button>
    </form>
  );
}
