"use client";

import React from "react";
import Link from "next/link";
import { useAdminAccess } from "../../../features/admin/hooks/useAdminAccess";

export const AdminNavLink: React.FC = () => {
  const { isAdmin, loading } = useAdminAccess();

  if (loading || !isAdmin) return null;

  return (
    <Link href="/admin" className="text-[#1E40AF] hover:underline font-medium">
      Admin
    </Link>
  );
};