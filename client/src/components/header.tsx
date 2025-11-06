import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Code2, Activity, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/activity", label: "Activity", icon: Activity },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2 mr-8">
          <Code2 className="h-6 w-6 text-primary" data-testid="icon-logo" />
          <span className="font-semibold text-lg" data-testid="text-app-name">
            PR Review AI
          </span>
        </div>

        <nav className="flex items-center gap-2 flex-1" data-testid="nav-main">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
