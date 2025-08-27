import type { Metadata } from 'next'
import { Geist, Geist_Mono, Unbounded } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/AuthProvider'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const unbounded = Unbounded({
  variable: '--font-unbounded',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Flow',
  description:
    'Automate your email-to-task workflows with visual drag-and-drop interface',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#2d2d2d',
              border: '1px solid #3d3d3d',
              color: '#ffffff',
            },
          }}
        />
      </body>
    </html>
  )
}
