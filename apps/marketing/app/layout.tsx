import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'laslogTMX | Transport Management Xperience',
  description: 'Modern mobile-first TMS for carriers, brokers & 3PLs. Military time, real-time chat, compliance tools.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
