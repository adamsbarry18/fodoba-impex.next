
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { StoreProvider } from "@/lib/contexts/StoreContext";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper";

import { I18nProvider } from "@/i18n/context";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fodoba Business',
  description: 'Gestion Commerciale Multi-Boutiques',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/images/favicon-32x32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/images/favicon-16x16.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
    apple: '/images/apple-touch-icon-192x192.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        url: '/images/android-chrome-192x192.png',
        sizes: '192x192',
      },
      {
        rel: 'icon',
        type: 'image/png',
        url: '/images/android-chrome-512x512.png',
        sizes: '512x512',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased selection:bg-accent/30`}>
        <I18nProvider>
          <AuthProvider>
            <CurrencyProvider>
              <StoreProvider>
                <NotificationProvider>
                  <AuthLayoutWrapper>
                    {children}
                  </AuthLayoutWrapper>
                  <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    visibleToasts={3}
                    duration={3500}
                    gap={8}
                  />
                </NotificationProvider>
              </StoreProvider>
            </CurrencyProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
