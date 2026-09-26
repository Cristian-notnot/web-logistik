import React from 'react';

export default function StatCard({ label, value, icon: Icon, accent = 'brand', suffix }) {
  const accentMap = {
    brand: 'bg-brand/10 text-brand',
    baik: 'bg-status-baik/10 text-status-baik',
    rusak: 'bg-status-rusak/10 text-status-rusak',
    maintenance: 'bg-status-maintenance/10 text-status-maintenance',
    hilang: 'bg-status-hilang/10 text-status-hilang',
  };

  return (
    <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
          {value}
          {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
        </p>
      </div>
      {Icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentMap[accent]}`}>
          <Icon size={19} strokeWidth={2.25} />
        </div>
      )}
    </div>
  );
}
