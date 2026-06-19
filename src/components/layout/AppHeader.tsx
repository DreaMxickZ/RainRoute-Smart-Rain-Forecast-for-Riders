"use client";

import Link from "next/link";
import { LayoutDashboard, Navigation } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label="กลับหน้าแรก" className="flex items-center">
          <Logo size={36} />
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex">
            <Link href="/navigate" className="gap-2">
              <Navigation className="h-5 w-5" /> นำทาง
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex">
            <Link href="/dashboard" className="gap-2">
              <LayoutDashboard className="h-5 w-5" /> Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-lg" className="sm:hidden">
            <Link href="/navigate" aria-label="นำทาง">
              <Navigation className="h-6 w-6" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-lg" className="sm:hidden">
            <Link href="/dashboard" aria-label="Dashboard">
              <LayoutDashboard className="h-6 w-6" />
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
