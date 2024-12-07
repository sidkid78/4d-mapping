'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Procurement",
    href: "/procurement",
  },
  {
    title: "Regulations",
    href: "/regulations",
  },
  {
    title: "Knowledge Graph",
    href: "/knowledge-graph",
  },
  {
    title: "Algorithm of Thought",
    href: "/algorithm-of-thought",
  },
  {
    title: "Analytics",
    href: "/analytics",
  }
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

