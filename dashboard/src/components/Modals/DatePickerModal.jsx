import React, { useState } from 'react';
import { Calendar, Save } from 'lucide-react';

const DatePickerModal = ({ initialDate, onClose, onSave }) => {
  const [date, setDate] = useState(initialDate || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-xl mb-4 text-slate-800 flex items-center gap-2">
                <Calendar size={20}/> Asignar Próxima Toma
            </h3>
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Selecciona la Fecha:</label>
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full p-3 border border-indigo-300 rounded-xl bg-indigo-50/50 text-indigo-700 font-bold outline-none focus:border-indigo-500"
                />
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancelar</button>
                <button 
                    onClick={() => onSave(date)} 
                    disabled={!date} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition active:scale-95"
                >
                    <Save size={16} className="inline mr-2"/> Guardar y Notificar
                </button>
            </div>
        </div>
    </div>
  );
};

export default DatePickerModal;