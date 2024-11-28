'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Overview
      </Link>
      <Link
        href="/advanced-ai-engine"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname?.startsWith("/advanced-ai-engine") ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Advanced AI Engine
      </Link>
      <Link
        href="/regulations"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname?.startsWith("/regulations") ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Regulations
      </Link>
      <Link
        href="/crosswalks"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname?.startsWith("/crosswalks") ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Crosswalks
      </Link>
      <Link
        href="/analytics"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname?.startsWith("/analytics") ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Analytics
      </Link>
    </nav>
  )
}