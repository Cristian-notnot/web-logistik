import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PackageSearch, ClipboardCheck, CalendarClock,
  HandCoins, Truck, Wrench, FileBarChart2, Radio,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { to: '/inventaris', label: 'Inventaris', icon: PackageSearch, active: true },
  { to: '/unboxing', label: 'Unboxing & Pendataan', icon: ClipboardCheck, active: true },
  { to: '/piket', label: 'Piket Mako', icon: CalendarClock, active: true },
  { to: '/sewa', label: 'Ruang Sewa', icon: HandCoins, active: true },
  { to: '/pengadaan', label: 'Pengadaan', icon: Truck, active: true },
  { to: '/revitalisasi', label: 'Revitalisasi', icon: Wrench, active: true },
  { to: '/laporan', label: 'Laporan', icon: FileBarChart2, active: true },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 border-r border-slate-200 bg-[#f9f7f4] text-slate-600">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
        <img src="/logo-hw-unimus.png" alt="Logo HW UNIMUS" className="h-9 w-9 rounded-xl border border-slate-200 bg-white object-cover p-1" />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-slate-900">Bidang Logistik</p>
          <p className="text-[11px] text-slate-500">Mako HW UNIMUS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, active }) => (
          active ? (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                  isActive
                    ? 'bg-brand/10 text-brand shadow-sm ring-1 ring-brand/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ) : (
            <div
              key={to}
              title="Modul ini akan diaktifkan pada fase pengembangan berikutnya"
              className="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
            >
              <span className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2} />
                {label}
              </span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                Segera
              </span>
            </div>
          )
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4 text-[11px] text-slate-500">
        Modul operasional aktif
      </div>
    </aside>
  );
}
