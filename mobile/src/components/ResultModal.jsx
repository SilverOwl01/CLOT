// src/components/ResultModal.jsx
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const ResultModal = ({ show, inrValue, min, max, onClose }) => {
  if (!show) return null;

  const isNormal = inrValue >= min && inrValue <= max;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
        
        {/* Icono Encabezado */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto -mt-16 mb-4 shadow-lg border-4 border-white ${isNormal ? 'bg-green-500' : 'bg-amber-500'}`}>
          {isNormal ? <CheckCircle size={40} className="text-white"/> : <AlertTriangle size={40} className="text-white"/>}
        </div>

        <h2 className={`text-2xl font-black text-center mb-2 ${isNormal ? 'text-green-600' : 'text-amber-600'}`}>
          {isNormal ? "¡Resultado Óptimo!" : "Atención Requerida"}
        </h2>

        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-slate-800">{inrValue}</span>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mt-1">Nivel INR Actual</p>
        </div>

        {/* Tarjeta de Instrucción */}
        <div className={`p-4 rounded-xl mb-6 text-sm text-left ${isNormal ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-amber-50 border border-amber-100 text-amber-900'}`}>
          <p className="font-bold mb-1 flex items-center gap-2">
            {isNormal ? "✅ Acción: MANTENER DOSIS" : "⚠️ Acción: ESPERAR INSTRUCCIONES"}
          </p>
          <p className="opacity-90">
            {isNormal 
              ? "Tu nivel es estable. Hemos enviado el reporte a tu médico. Espera la confirmación de tu próxima cita." 
              : "Tu nivel está fuera del rango. Se ha enviado una alerta urgente. No cambies tu dosis sin autorización."}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-[#2a788e] hover:bg-[#236777] flex items-center justify-center gap-2 mb-3 active:scale-95 transition"
        >
          <CheckCircle size={18} />
          Entendido / Finalizar
        </button>
      </div>
    </div>
  );
};

export default ResultModal;