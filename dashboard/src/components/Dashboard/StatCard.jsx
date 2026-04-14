import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} strokeWidth={2.5}/>
    </div>
    <div>
      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
    </div>
  </div>
);

export default StatCard;