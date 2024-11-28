import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { MainNav } from "@/components/main-nav"
import './globals.css'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Procurity.ai - Advanced Orchestrator',
  description: 'Advanced system orchestration and management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              {/* <UserNav /> */}
            </div>
          </div>
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  )
}