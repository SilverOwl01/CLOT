import React, { useMemo } from 'react';
import { Pill, Save } from 'lucide-react';

const WeeklyDose = ({ dose, tabletSize, onDoseChange, onSave }) => {
  const days = [
      { key: 'L', label: 'Lun' },
      { key: 'M', label: 'Mar' },
      { key: 'X', label: 'Mié' },
      { key: 'J', label: 'Jue' },
      { key: 'V', label: 'Vie' },
      { key: 'S', label: 'Sáb' },
      { key: 'D', label: 'Dom' }
  ];

  const totalWeeklyMg = useMemo(() => {
    return Object.values(dose).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  }, [dose]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* --- CSS PARA OCULTAR FLECHAS --- */}
        <style>{`
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}</style>

        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <div>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                    <Pill className="text-indigo-500" size={18}/> Esquema Semanal
                </h4>
                <div className="text-xs text-slate-500 font-medium mt-1 ml-6">
                   Total: <span className="font-black text-slate-800">{totalWeeklyMg} mg</span> / semana
                </div>
            </div>
            
            <button 
                onClick={onSave} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
                <Save size={14}/> Guardar
            </button>
        </div>
        
        {/* Grid de Días */}
        <div className="p-4 grid grid-cols-7 gap-2">
            {days.map((day) => {
                const mgValue = parseFloat(dose[day.key]) || 0;
                const tabsCount = tabletSize > 0 ? (mgValue / tabletSize) : 0;
                const isWeekend = day.key === 'S' || day.key === 'D';
                const isActive = mgValue > 0;

                return (
                    <div 
                        key={day.key} 
                        className={`
                            relative flex flex-col items-center justify-between
                            py-2 px-1 rounded-xl border transition-all duration-200
                            focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent focus-within:shadow-md
                            ${isActive 
                                ? 'bg-white border-indigo-100 shadow-sm' 
                                : 'bg-slate-50 border-slate-100 opacity-90 hover:opacity-100'
                            }
                        `}
                    >
                        {/* 1. Etiqueta del Día (Arriba) */}
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isWeekend ? 'text-rose-500' : 'text-slate-400'}`}>
                            {day.label}
                        </span>

                        {/* 2. Grupo Central: Input + Unidad */}
                        <div className="w-full flex flex-col items-center justify-center -space-y-1 my-1">
                            <input 
                                type="number" 
                                step="0.5"
                                min="0"
                                className={`
                                    w-full text-center bg-transparent outline-none p-0 font-black
                                    ${isActive ? 'text-slate-800' : 'text-slate-400'}
                                    text-2xl 
                                `}
                                placeholder="0"
                                value={dose[day.key] === 0 ? '' : dose[day.key]} 
                                onChange={e => onDoseChange(day.key, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                onFocus={(e) => e.target.select()} 
                            />
                            {/* SOLUCIÓN: "mg" ahora está debajo del número, imposible que choque */}
                            <span className="text-[10px] text-slate-400 font-bold uppercase">mg</span>
                        </div>

                        {/* 3. Badge de Tabletas (Abajo) */}
                        <div className={`
                            w-full text-center text-[10px] font-bold py-1 rounded mx-2 mt-1 transition-colors
                            ${tabsCount > 0 
                                ? 'bg-indigo-50 text-indigo-700' 
                                : 'text-transparent' 
                            }
                        `}>
                            {Number.isInteger(tabsCount) ? tabsCount : tabsCount.toFixed(1)} Tabs
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default WeeklyDose;