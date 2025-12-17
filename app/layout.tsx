import type { Metadata } from 'next'
import { Inter, Outfit, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const outfit = Outfit({ subsets: ['latin'], weight: ['700'] })
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400'] })

export const metadata: Metadata = {
  title: 'DORA',
  description: 'DORA - Your intelligent companion for document understanding and knowledge management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}