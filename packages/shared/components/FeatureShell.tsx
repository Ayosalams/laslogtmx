"use client";

import React from "react";
import { useCurrentTime } from "../src/hooks/useCurrentTime";

interface FeatureShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthClass = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-7xl",
};

export const FeatureShell: React.FC<FeatureShellProps> = ({
  title,
  subtitle,
  backHref,
  backLabel = "← Back",
  children,
  maxWidth = "lg",
}) => {
  const currentTime = useCurrentTime();

  return (
    <div className={`flex flex-col gap-6 mt-4 mx-auto ${maxWidthClass[maxWidth]} w-full`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {backHref && (
            <a href={backHref} className="text-[#00bfff] font-semibold text-sm hover:underline">
              {backLabel}
            </a>
          )}
          <h1 className="text-3xl font-bold text-[#0F172A] mt-2">{title}</h1>
          {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums bg-sky-50 text-[#00bfff] px-3 py-1 rounded-full">
          {currentTime}
        </span>
      </div>
      {children}
    </div>
  );
};