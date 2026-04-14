import React from 'react';
import { Activity, Calendar, Target, TrendingUp, ChevronRight } from 'lucide-react';

const ClinicalSummary = ({ patient, onOpenDateModal }) => {
  const getStatusColor = (sev) => {
    switch (sev) {
      case 'red': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'amber': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  const statusStyles = getStatusColor(patient?.sev);

  return (
    // ELIMINADO: 'h-full'. Ahora el contenedor solo mide lo que mide su contenido.
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Activity size={18} className="text-indigo-600" />
          Resumen Clínico
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles}`}>
          {patient?.sev === 'red' ? 'Requiere Ajuste' : patient?.sev === 'amber' ? 'En Vigilancia' : 'Estable'}
        </span>
      </div>

      {/* Grid de Métricas - Espaciado ajustado */}
      <div className="p-5 grid grid-cols-2 gap-4 border-b border-slate-50">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Último INR</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-800">{patient?.lastVal?.toFixed(1) || '--'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <Calendar size={12} />
            {patient?.lastDate || 'Sin fecha'}
          </div>
        </div>

        <div className="space-y-1 border-l border-slate-100 pl-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase">TTR Acumulado</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-600">{patient?.ttr || 0}%</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic">Tiempo en Rango</p>
        </div>
      </div>

      {/* Footer - ELIMINADO: 'mt-auto'. Ahora se pega a lo anterior. */}
      <div className="p-4 space-y-3 bg-white">
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Target size={16} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Rango Objetivo</p>
              <p className="text-sm font-extrabold text-slate-700 mt-1">
                {patient?.minTargetINR || '2.0'} - {patient?.maxTargetINR || '3.0'}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenDateModal}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 active:scale-95"
        >
          <Calendar size={14} />
          Modificar Próxima Cita
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ClinicalSummary;