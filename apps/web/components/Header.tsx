"use client";

import React from "react";
import { MilitaryTimeDisplay } from "../../../packages/shared/components/MilitaryTimeDisplay";
import { LOGOS } from "../../../packages/shared/src/constants";
import { GLASS } from "../../../packages/shared/src/utils/glass";

export const Header: React.FC = () => {
  return (
    <header className={`relative flex justify-between items-center p-4 shadow-sm rounded-b-3xl ${GLASS.header}`}>
      {/* subtle specular highlight */}
      <div className={GLASS.highlight} aria-hidden />
      <div className="flex items-center gap-3">
        <img
          src={LOGOS.logo}
          alt="laslogTMX"
          className="h-8 w-auto"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <span className="font-bold text-xl tracking-tight text-gray-800">laslogTMX</span>
      </div>
      <MilitaryTimeDisplay />
    </header>
  );
};
