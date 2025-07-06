import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../src/components/AuthProvider';

export const metadata: Metadata = {
  title: 'URL Shortener - Shorten Your Links',
  description: 'A powerful URL shortener with analytics, custom domains, and more.',
  keywords: ['url shortener', 'link shortener', 'analytics', 'custom domains'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
