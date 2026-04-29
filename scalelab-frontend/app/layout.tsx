import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScaleLab',
  description: 'High-performance product catalogue — ASP.NET Core 9, Redis cache, and Nginx round-robin load balancing.',
  icons: { icon: '/logo.svg' },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className="bg-gray-50 text-gray-900">{children}</body>
  </html>
)

export default RootLayout
