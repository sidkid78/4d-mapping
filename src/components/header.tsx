import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-[#1E90FF]">Procurity.ai</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-[#1E90FF]">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-[#1E90FF]">
              About Us
            </Link>
            <Link href="/solutions" className="text-sm font-medium hover:text-[#1E90FF]">
              Solutions
            </Link>
            <Link href="/resources" className="text-sm font-medium hover:text-[#1E90FF]">
              Resources
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-[#1E90FF]">
              Contact
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost">Sign In</Button>
          <Button style={{ backgroundColor: '#FFA500' }}>Get Started</Button>
        </div>
      </div>
    </header>
  )
}