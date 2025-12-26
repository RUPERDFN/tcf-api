import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";
import { Utensils, ShoppingCart, User, LogOut, Menu as MenuIcon } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore();
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", label: "Menus", icon: Utensils },
    { href: "/shopping", label: "Shopping", icon: ShoppingCart },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <a className="text-xl font-serif font-bold text-primary flex items-center gap-2">
              <Utensils className="h-6 w-6" />
              TheCookFlow
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary
                  ${location === item.href ? "text-primary" : "text-muted-foreground"}`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>

          {/* Mobile Nav Placeholder */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
