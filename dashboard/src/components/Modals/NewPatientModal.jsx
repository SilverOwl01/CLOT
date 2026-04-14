import React, { useState } from 'react';
import { Plus, LogOut, Users, Activity, CheckCircle } from 'lucide-react';
import { CLINICAL_RANGES } from '../../utils/clinicalMath';

const NewPatientModal = ({ onClose, onCreate }) => {
  // 1. Cambiamos 'edad' por 'fechaNacimiento' en el estado
  const [form, setForm] = useState({ 
      nombre: '', exp: '', fechaNacimiento: '', telefono: '', 
      medicamento: 'Warfarina', patologia: 'fa', 
      min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3, 
      inicio: '', tabletSize: 5 
  });

  const handlePathologyChange = (e) => {
      const code = e.target.value;
      const range = CLINICAL_RANGES[code];
      setForm({ 
          ...form, patologia: code, 
          min: range.min, max: range.max, 
          crit_low: range.crit_low, crit_high: range.crit_high 
      });
  };

  const handleSubmit = () => {
      // Validamos fechaNacimiento en lugar de edad
      if(!form.nombre || !form.exp || !form.fechaNacimiento) return alert("Faltan datos obligatorios");
      onCreate(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl text-slate-800 flex items-center gap-2">
                    <Plus className="bg-slate-100 rounded-full p-1"/> Alta Paciente
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <LogOut size={20} className="rotate-45"/>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Users size={14}/> Datos Personales
                    </div>
                    <input placeholder="Nombre Completo" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {/* 2. Input tipo Date para nacimiento */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 ml-1">Nacimiento</label>
                            <input 
                                type="date" 
                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm" 
                                value={form.fechaNacimiento} 
                                onChange={e=>setForm({...form, fechaNacimiento:e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 ml-1">Teléfono</label>
                            <input type="tel" placeholder="Teléfono" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})}/>
                        </div>
                    </div>

                    <input placeholder="ID Expediente (Login)" className="w-full p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl font-mono text-indigo-700 font-bold" value={form.exp} onChange={e=>setForm({...form, exp:e.target.value})}/>
                </div>
                
                {/* ... (La parte de Tratamiento se queda igual) ... */}
                <div className="space-y-4">
                    <div className="text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Activity size={14}/> Tratamiento
                    </div>
                    <select className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500" value={form.patologia} onChange={handlePathologyChange}>
                        {Object.entries(CLINICAL_RANGES).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <select className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={form.medicamento} onChange={e=>setForm({...form, medicamento:e.target.value})}>
                            <option>Warfarina</option><option>Acenocumarol</option><option>Otro</option>
                        </select>
                        <input type="number" step="0.5" placeholder="Tab mg (ej 5)" className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={form.tabletSize} onChange={e=>setForm({...form, tabletSize:e.target.value})}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <div><label className="text-[10px] font-bold text-emerald-700 uppercase">Min INR</label><input type="number" step="0.1" className="w-full bg-transparent border-b border-emerald-200 text-center font-bold text-emerald-800 outline-none" value={form.min} onChange={e=>setForm({...form, min:e.target.value})}/></div>
                        <div><label className="text-[10px] font-bold text-emerald-700 uppercase">Max INR</label><input type="number" step="0.1" className="w-full bg-transparent border-b border-emerald-200 text-center font-bold text-emerald-800 outline-none" value={form.max} onChange={e=>setForm({...form, max:e.target.value})}/></div>
                    </div>
                </div>
            </div>
            <button onClick={handleSubmit} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold mt-8 shadow-lg hover:bg-slate-900 transition active:scale-95 flex items-center justify-center gap-2">
                <CheckCircle size={20}/> Registrar Paciente
            </button>
        </div>
    </div>
  );
};

export default NewPatientModal;