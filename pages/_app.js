import '@/styles/globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import Layout from '@/components/layout/Layout';
import { Toaster } from '@/components/ui/Toaster';
import LoadingScreen from '@/components/ui/LoadingScreen';
import RouteProgressBar from '@/components/ui/RouteProgressBar';
import { SiteSettingsProvider } from '@/lib/contexts/SiteSettingsContext';
import { useState, useCallback } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const [appReady, setAppReady] = useState(false);
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  const handleLoadingFinish = useCallback(() => setAppReady(true), []);

  return (
    <SessionProvider session={session}>
      <SiteSettingsProvider>
        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
            currency: 'EUR',
            intent: 'capture',
          }}
          deferLoading={true}
        >
          <div className={`${inter.variable} ${playfair.variable} font-sans`}>
            {!appReady && <LoadingScreen onFinish={handleLoadingFinish} />}
            <RouteProgressBar />
            <Toaster>
              {getLayout(<Component {...pageProps} />)}
            </Toaster>
          </div>
        </PayPalScriptProvider>
      </SiteSettingsProvider>
    </SessionProvider>
  );
}
