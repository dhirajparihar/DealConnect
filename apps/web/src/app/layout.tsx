import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'DealConnect — Used-Car Demand & Alert Platform',
  description: "Never lose a customer just because you don't have the car today.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
