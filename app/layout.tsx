import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { StoreBrandingProvider } from '@/components/store-branding-provider'
import { fetchGeneralSettings, getStoreName } from '@/lib/store-settings'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchGeneralSettings()
  const storeName = getStoreName(settings)

  return {
    title: `${storeName} - Cashier Dashboard`,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await fetchGeneralSettings()
  const storeName = getStoreName(settings)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreBrandingProvider initialStoreName={storeName}>
            {children}
          </StoreBrandingProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
