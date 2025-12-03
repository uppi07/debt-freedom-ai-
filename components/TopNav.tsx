"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, BarChart, FileCheck, Bot, Settings } from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Debts", href: "/my-debts", icon: Wallet },
  { name: "Income & Expenses", href: "/income-expenses", icon: BarChart },
  { name: "Payment Plan", href: "/monthly-plan", icon: FileCheck },
  { name: "AI Insights", href: "/ai-insights", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function TopNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-[#0c0f1a]/85 backdrop-blur-lg border-b border-[#1f2235]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-none text-white">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-semibold hidden sm:inline">Debt Freedom AI</span>
        </div>
        <nav className="flex-1 flex items-center justify-end gap-2 md:gap-3 overflow-x-auto scrollbar-none">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-white/10 text-white shadow-lg shadow-purple-900/20 border border-white/10"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <Icon size={16} className={active ? "text-purple-200" : "text-gray-400"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
