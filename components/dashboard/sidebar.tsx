"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store/auth";
import { useSavedKeysStore } from "@/lib/store/saved-keys";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconLayoutDashboard,
  IconList,
  IconPlus,
  IconWallet,
  IconLogout,
  IconCurrencyDollar,
  IconX,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "Transacciones",
    href: "/dashboard/transacoes",
    icon: IconList,
  },
  {
    label: "Crear Transacción",
    href: "/dashboard/transacoes/crear",
    icon: IconPlus,
  },
  // {
  //   label: "Transferencia (Cashout)",
  //   href: "/dashboard/cashout",
  //   icon: IconCurrencyDollar,
  // },
  // {
  //   label: "Saldo",
  //   href: "/dashboard/saldo",
  //   icon: IconWallet,
  // },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const loginFn = useAuthStore((s) => s.login);
  const currentApiKey = useAuthStore((s) => s.apiKey);
  const endpoint = useAuthStore((s) => s.endpoint);
  const savedKeys = useSavedKeysStore((s) => s.keys);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSwitch = (id: string) => {
    const key = savedKeys.find((k) => k.id === id);
    if (key) {
      loginFn(key.apiKey, key.endpoint);
      router.refresh();
    }
  };

  const handleNavClick = () => {
    onMobileClose?.();
  };

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground",
        // Desktop: sticky so it stays in place while main scrolls
        "hidden lg:flex lg:sticky lg:top-0",
        // Mobile: overlay when open
        mobileOpen &&
          "!flex fixed inset-y-0 left-0 z-50 shadow-xl"
      )}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            PX
          </div>
          <span className="text-lg font-bold">Pyx Pay</span>
        </div>
        {/* Close button on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileClose}
        >
          <IconX className="size-4" />
        </Button>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="px-3 py-3 space-y-2">
        {/* Theme switcher */}
        <div className="flex items-center rounded-lg bg-muted/50 p-1">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors",
              theme === "light"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconSun className="size-3.5" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors",
              theme === "dark"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconMoon className="size-3.5" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors",
              theme === "system"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconDeviceDesktop className="size-3.5" />
          </button>
        </div>
        {savedKeys.length > 1 && (
          <Select
            value={savedKeys.find((k) => k.apiKey === currentApiKey)?.id ?? ""}
            onValueChange={handleSwitch}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <div className="flex items-center gap-1.5">
                <IconSwitchHorizontal className="size-3.5 shrink-0" />
                <SelectValue placeholder="Cambiar cuenta" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {savedKeys.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="truncate text-xs text-muted-foreground px-3">
          {endpoint}
        </p>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive"
          onClick={handleLogout}
        >
          <IconLogout className="size-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}
