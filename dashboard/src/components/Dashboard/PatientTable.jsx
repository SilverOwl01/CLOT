import React from 'react';
import { AlertTriangle, AlertOctagon, Droplets, CheckCircle2 } from 'lucide-react';

const PatientTable = ({ data, onSelectPatient }) => {
  
  // Función para determinar si el paciente reportó síntomas activos
  const hasActiveSymptoms = (sintomas) => {
    if (!sintomas || sintomas.todoNormal) return false;
    // Verifica si hay algún síntoma en true (sangrado, moretones, etc.)
    return Object.keys(sintomas).some(key => sintomas[key] === true && key !== 'todoNormal');
  };

  return (
    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                        <th className="p-4 pl-6">Paciente / Exp</th>
                        <th className="p-4">Último INR</th>
                        <th className="p-4">TTR</th>
                        <th className="p-4">Estado Clínico</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map(p => {
                        const sintomasActivos = hasActiveSymptoms(p.latestSintomas);
                        
                        return (
                            <tr 
                                key={p.id} 
                                onClick={() => onSelectPatient(p)} 
                                className={`cursor-pointer transition-colors hover:bg-slate-50 border-l-4 transition-all ${
                                    p.severityLabel === 'SEVERO' ? 'border-rose-500 bg-rose-50/30' : 
                                    p.severityLabel === 'ALERTA' ? 'border-amber-400' : 'border-transparent'
                                }`}
                            >
                                <td className="p-4 pl-6">
                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                        {/* Icono de Triage Prioritario */}
                                        {p.severityLabel === 'SEVERO' ? (
                                            <AlertOctagon size={18} className="text-rose-600 shrink-0 animate-pulse" />
                                        ) : p.latestPending ? (
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0"/>
                                        ) : (
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                        )}
                                        
                                        <div className="flex flex-col">
                                            <span>{p.nombre}</span>
                                            {/* Badge de Síntomas si existen */}
                                            {sintomasActivos && (
                                                <span className="flex items-center gap-1 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded mt-0.5 w-fit font-black uppercase">
                                                    <Droplets size={10} /> Síntomas Activos
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">{p.expediente}</div>
                                </td>
                                
                                <td className="p-4">
                                    <div className={`font-mono text-lg font-black ${
                                        p.severityLabel === 'SEVERO' ? 'text-rose-600' : 
                                        p.severityLabel === 'ALERTA' ? 'text-amber-600' : 'text-slate-700'
                                    }`}>
                                        {p.lastVal?.toFixed(1) || '0.0'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Valor Actual</div>
                                </td>

                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                            <div className={`h-full ${p.ttr > 65 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${p.ttr}%`}}></div>
                                        </div>
                                        <span className="text-xs font-bold">{p.ttr}%</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Control (TTR)</div>
                                </td>

                                <td className="p-4">
                                    {p.severityLabel === 'SEVERO' ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white font-black text-[10px] bg-rose-600 px-2 py-1 rounded shadow-sm text-center">CRÍTICO</span>
                                            {sintomasActivos && <span className="text-[9px] text-rose-600 font-bold text-center italic">Prioridad 1</span>}
                                        </div>
                                    ) : p.severityLabel === 'ALERTA' ? (
                                        <span className="text-amber-700 font-black text-[10px] bg-amber-100 px-2 py-1 rounded border border-amber-200 text-center">RIESGO</span>
                                    ) : (
                                        <span className="text-emerald-700 font-black text-[10px] bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-center">ESTABLE</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default PatientTable;