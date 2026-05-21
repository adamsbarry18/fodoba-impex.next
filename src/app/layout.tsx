
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { StoreProvider } from "@/lib/contexts/StoreContext";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper";

export const metadata: Metadata = {
  title: 'OmniStock Nexus | FODOBA IMPEX',
  description: 'Enterprise Grade Commercial Management Multi-Store POS & ERP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-accent/30">
        <AuthProvider>
          <CurrencyProvider>
            <StoreProvider>
              <NotificationProvider>
                <AuthLayoutWrapper>
                  {children}
                </AuthLayoutWrapper>
                <Toaster position="top-right" richColors closeButton />
              </NotificationProvider>
            </StoreProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
