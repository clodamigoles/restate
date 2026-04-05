import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function RouteProgressBar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const end = () => setLoading(false);

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);

    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9998] h-[3px]">
      <div className="route-progress-bar h-full w-full bg-gradient-to-r from-primary via-accent to-primary" />
    </div>
  );
}
