import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Pizza POS - Cashier Dashboard',
  description: 'Fast and touch-friendly point of sale system for pizza shops',
  icons: {
    icon: [
      { url: '/favicon.ico?v=4', type: 'image/x-icon' },
      { url: '/apple-icon.png?v=4', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico?v=4',
    apple: '/apple-icon.png?v=4',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
