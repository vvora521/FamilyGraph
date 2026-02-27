import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCProvider } from '@/components/providers/TRPCProvider'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'FamilyGraph',
  description: 'Knowledge Graph Family Tree Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ClerkProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
