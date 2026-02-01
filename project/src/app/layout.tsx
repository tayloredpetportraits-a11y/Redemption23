import { Playfair_Display, Inter, Outfit } from 'next/font/google';
import './globals.css';
import SupportWidget from '@/components/SupportWidget';
import { ToastProvider } from '@/components/ui/Toast';

import ErrorBoundary from '@/components/ErrorBoundary';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'Pet Portrait Redemption',
  description: 'Redeem your beautiful pet portrait artwork',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-brand-bg text-brand-text" suppressHydrationWarning>
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <SupportWidget />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
