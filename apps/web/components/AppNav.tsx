"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const APP_LINKS = [
  { href: "/chat", label: "Chat" },
  { href: "/motus", label: "MOTUS" },
  { href: "/expenses", label: "Expenses" },
  { href: "/receipts", label: "Receipts" },
  { href: "/cble", label: "CBLE Prep" },
  { href: "/load-board", label: "Load Board" },
];

export const AppNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="max-w-7xl mx-auto px-4 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm border-b border-gray-100 pb-2">
      {APP_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "text-[#00bfff] font-semibold"
                : "text-gray-600 hover:text-[#0F172A] hover:underline"
            }
          >
            {link.label}
          </Link>
        );
      })}
      <Link href="/pricing" className="text-gray-600 hover:text-gray-900 hover:underline">
        Pricing
      </Link>
      <Link href="/auth/login" className="text-[#00bfff] hover:underline">
        Login
      </Link>
      <Link href="/settings" className="text-gray-600 hover:text-gray-900 hover:underline">
        Settings
      </Link>
    </nav>
  );
};