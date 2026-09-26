import React from 'react';

const styles = {
  Baik: 'bg-status-baik/10 text-status-baik',
  Rusak: 'bg-status-rusak/10 text-status-rusak',
  Hilang: 'bg-status-hilang/10 text-status-hilang',
  Maintenance: 'bg-status-maintenance/10 text-status-maintenance',
};

export default function KondisiBadge({ kondisi }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[kondisi] || 'bg-slate-100 text-slate-600'}`}>
      {kondisi}
    </span>
  );
}
