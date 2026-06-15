import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 mt-8">
      <h1 className="text-3xl font-bold">Welcome to laslogTMX</h1>
      <p className="text-gray-600">
        This is the main dashboard. The header above displays the current time based on your settings.
      </p>
      <div>
        <Link href="/settings" className="text-blue-500 hover:text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-xl inline-block transition-colors">
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
