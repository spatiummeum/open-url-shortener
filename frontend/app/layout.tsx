import "./globals.css"

export const metadata = {
  title: 'URL Shortener - Create Short Links with Analytics',
  description: 'Professional URL shortener with analytics, custom domains, password protection, and subscription plans.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
