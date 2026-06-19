"use client";

import Link from "next/link";
import { LayoutDashboard, Navigation } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-3">
        <Link href="/" aria-label="กลับหน้าแรก">
          <Logo size={32} />
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/navigate" className="hidden items-center gap-1.5 sm:flex">
              <Navigation className="h-4 w-4" /> นำทาง
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 sm:flex"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
