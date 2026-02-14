"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Events",
      href: "/dashboard",
      icon: Calendar,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 mr-6">
          <Image 
            src="/placeholder-logo.png" 
            alt="42Builders Logo" 
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-semibold text-foreground hidden sm:inline-block">
            Events Dashboard
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Nettoyer le cache avant la déconnexion
              if (typeof window !== "undefined") {
                localStorage.removeItem("42builders_events_cache");
                localStorage.removeItem("42builders_events_cache_expiry");
                localStorage.removeItem("42builders_current_user");
              }
              window.location.href = "/api/auth/logout";
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline-block">Deconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
