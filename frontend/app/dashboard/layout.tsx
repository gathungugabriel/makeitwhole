// dashboard/layout.tsx
import DashboardNav from '@/components/DashboardNav';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DashboardNav />
      <main className="flex-grow p-6">{children}</main>
    </div>
  );
}
