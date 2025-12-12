import { type Metadata } from 'next'
import { Instrument_Sans, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Actas Abiertas | Verificación Ciudadana',
  description:
    'Plataforma abierta para el conteo y validación colaborativa de las actas electorales de Honduras 2025.',
  keywords: [
    'honduras',
    'elecciones',
    'actas',
    'verificación',
    'democracia',
    'transparencia',
    '2025',
  ],
  authors: [{ name: 'Actas Abiertas' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Actas Abiertas | Verificación Ciudadana',
    description:
      'Únete a la verificación ciudadana de las actas electorales de Honduras 2025. Tu voz importa para la democracia.',
    url: 'https://actas-abiertas.vercel.app',
    siteName: 'Actas Abiertas',
    locale: 'es_HN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Actas Abiertas - Verificación Ciudadana de Elecciones Honduras 2025',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Actas Abiertas | Verificación Ciudadana',
    description: 'Únete a la verificación ciudadana de las actas electorales de Honduras 2025.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${instrumentSans.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
