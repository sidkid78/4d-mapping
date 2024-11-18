import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Github, Linkedin, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t bg-white py-8">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Procurity.ai</h3>
          <p className="text-sm text-muted-foreground">
            Advanced system orchestration and management platform
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="text-sm hover:text-[#1E90FF]">Home</Link>
            <Link href="/about" className="text-sm hover:text-[#1E90FF]">About Us</Link>
            <Link href="/solutions" className="text-sm hover:text-[#1E90FF]">Solutions</Link>
            <Link href="/resources" className="text-sm hover:text-[#1E90FF]">Resources</Link>
            <Link href="/contact" className="text-sm hover:text-[#1E90FF]">Contact</Link>
          </nav>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">Contact</h3>
          <div className="space-y-2 text-sm">
            <p>Email: support@procurity.ai</p>
            <p>Phone: (555) 123-4567</p>
          </div>
          <div className="mt-4 flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-[#1E90FF]">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-[#1E90FF]">
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-[#1E90FF]">
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">Newsletter</h3>
          <form className="space-y-2">
            <Input type="email" placeholder="Enter your email" />
            <Button className="w-full" style={{ backgroundColor: '#FFA500' }}>
              Subscribe
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            <Link href="/privacy" className="text-xs hover:text-[#1E90FF]">Privacy Policy</Link>
            <span className="text-xs"> · </span>
            <Link href="/terms" className="text-xs hover:text-[#1E90FF]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}