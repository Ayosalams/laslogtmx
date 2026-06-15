"use client";

import React from "react";
import { MilitaryTimeDisplay } from "../../../packages/shared/components/MilitaryTimeDisplay";

export const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 rounded-b-3xl">
      <div className="font-bold text-xl tracking-tight text-gray-800">
        laslogTMX
      </div>
      <MilitaryTimeDisplay />
    </header>
  );
};
