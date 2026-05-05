import { createContext, useContext } from 'react';
import useSWR from 'swr';

export const SITE_DEFAULTS = {
  siteName:        'Maxo Destinations',
  tagline:         'Premium Living',
  siteDescription: 'Votre partenaire de confiance pour la location courte durée.',
  contactEmail:    'support@maxodestinations.com',
  contactPhone:    '+33 1 23 45 67 89',
  contactAddress:  'Paris, France',
  socialFacebook:  '',
  socialInstagram: '',
  socialTwitter:   '',
  socialYoutube:   '',
};

const SiteSettingsContext = createContext(SITE_DEFAULTS);

const fetcher = (url) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => ({ ...SITE_DEFAULTS, ...d.data }));

export function SiteSettingsProvider({ children }) {
  const { data } = useSWR('/api/site-settings', fetcher, {
    fallbackData: SITE_DEFAULTS,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60 * 60 * 1000, // 1 heure
  });

  return (
    <SiteSettingsContext.Provider value={data ?? SITE_DEFAULTS}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
