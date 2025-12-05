import { type Metadata } from 'next'
import { Instrument_Sans, Space_Grotesk } from 'next/font/google'
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
      </body>
    </html>
  )
}
