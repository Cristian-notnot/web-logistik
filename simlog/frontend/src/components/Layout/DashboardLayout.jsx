import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ title, subtitle, children }) {
  return (
    <div className="flex h-screen bg-[#f2f7f4] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="relative flex-1 overflow-y-auto p-5 sm:p-6">
          <img
            src="/logo-hw-unimus.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none fixed left-1/2 top-1/2 z-30 w-[min(44vw,25rem)] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] mix-blend-multiply md:left-[calc(50%+8rem)]"
          />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
