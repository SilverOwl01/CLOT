import { Scan, Calendar, CheckCircle, XCircle, AlertTriangle, Droplets, Brain, Activity } from 'lucide-react';

// Función de ayuda para renderizar síntomas (fuera del componente)
const renderSintomas = (sintomas) => {
  if (!sintomas || sintomas.todoNormal) return null;

  const etiquetas = {
    sangrado: { texto: "Sangrado encías", icono: "🦷", color: "rose" },
    moretones: { texto: "Moretones", icono: "🩹", color: "purple" },
    sangreNariz: { texto: "Sangrado nasal", icono: "🩸", color: "red" },
    sangreOrina: { texto: "Sangre orina/heces", icono: "🚽", color: "orange" },
    menstruacion: { texto: "Menstruación abundante", icono: "🌸", color: "pink" },
    dolorCabeza: { texto: "Dolor de cabeza", icono: "🤕", color: "slate" },
    mareos: { texto: "Mareos", icono: "😵", color: "yellow" }
  };

  // Contar cuántos síntomas hay para el layout
  const sintomasActivos = Object.keys(etiquetas).filter(key => sintomas[key]);

  if (sintomasActivos.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
        <AlertTriangle size={12} /> Síntomas reportados ({sintomasActivos.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(etiquetas).map(key => sintomas[key] && (
          <span 
            key={key} 
            className={`inline-flex items-center gap-1 bg-${etiquetas[key].color}-50 text-${etiquetas[key].color}-700 text-[10px] px-2 py-1 rounded-lg border border-${etiquetas[key].color}-100 font-bold uppercase shadow-sm`}
          >
            {etiquetas[key].icono} {etiquetas[key].texto}
          </span>
        ))}
      </div>
    </div>
  );
};

// Función para formatear fecha de manera segura
const formatDate = (dateInput) => {
  if (!dateInput) return 'Fecha no disponible';
  
  try {
    if (dateInput.seconds) {
      // Es un Timestamp de Firestore
      return new Date(dateInput.seconds * 1000).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (dateInput instanceof Date) {
      return dateInput.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (typeof dateInput === 'string') {
      return new Date(dateInput).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Fecha no disponible';
  } catch (e) {
    console.error('Error formateando fecha:', e);
    return 'Fecha inválida';
  }
};

// Componente principal
const VerificationPending = ({ reading, onVerify, isProcessing = false }) => {
  if (!reading) return null;

  // Determinar colores según severidad
  const severityConfig = {
    SEVERO: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200', light: 'bg-rose-50' },
    ALERTA: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
    NORMAL: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' }
  };

  const severity = reading.severityLabel || 'NORMAL';
  const colors = severityConfig[severity] || severityConfig.NORMAL;

  return (
    <div className={`border-4 ${colors.border} ${colors.light} rounded-xl shadow-lg p-6 space-y-4 transition-all`}>
      {/* Header con título y severidad */}
      <div className="flex justify-between items-start">
        <h4 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
          <Scan size={24} className={colors.text} />
          VERIFICACIÓN PENDIENTE
        </h4>
        <span className={`px-3 py-1 rounded-full text-xs font-black text-white ${colors.bg} shadow-sm`}>
          {severity}
        </span>
      </div>
      
      <p className="text-sm text-slate-600">
        El paciente ha reportado una toma. Revise la evidencia y los síntomas antes de verificar.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Valor reportado */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
            <Activity size={12} /> Valor INR
          </p>
          <p className="font-black text-4xl text-indigo-600 mt-1">
            {reading.value?.toFixed?.(1) || reading.value || 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(reading.date || reading.timestamp)}
          </p>
        </div>

        {/* Evidencia Fotográfica */}
        {reading.evidenciaUrl && (
          <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shadow-sm">
            <a 
              href={reading.evidenciaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative">
                <img 
                  src={reading.evidenciaUrl} 
                  alt="Evidencia INR" 
                  className="w-full h-32 object-cover transition-all duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              </div>
              <p className="text-center text-xs p-2 text-slate-600 group-hover:text-indigo-600 group-hover:underline font-medium">
                Ver evidencia completa
              </p>
            </a>
          </div>
        )}

        {/* Síntomas (integración solicitada) */}
        {reading.sintomas && !reading.sintomas.todoNormal && (
          <div className="col-span-1 md:col-span-2">
            {renderSintomas(reading.sintomas)}
          </div>
        )}

        {/* Sugerencia IA */}
        {reading.suggestedNextDate && (
          <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 flex items-center gap-2 shadow-sm">
            <Brain size={14} className="text-blue-600" />
            <span className="font-medium">
              Sugerencia Inteligencia Clínica: 
            </span>
            <strong className="text-blue-900">
              {formatDate(reading.suggestedNextDate)}
            </strong>
          </div>
        )}

        {/* Notas adicionales del paciente */}
        {reading.notas && (
          <div className="col-span-1 md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notas del paciente:</p>
            <p className="text-sm text-slate-700 italic">"{reading.notas}"</p>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="col-span-1 md:col-span-2 flex gap-4 pt-4">
          <button 
            onClick={() => onVerify(reading, 'ACCEPT')} 
            disabled={isProcessing}
            className="flex-1 bg-emerald-600 text-white p-3 rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {isProcessing ? 'PROCESANDO...' : 'APROBAR'}
          </button>
          <button 
            onClick={() => onVerify(reading, 'REJECT')} 
            disabled={isProcessing}
            className="flex-1 bg-white text-rose-600 border-2 border-rose-200 p-3 rounded-xl font-bold hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <XCircle size={18} />
            {isProcessing ? 'PROCESANDO...' : 'RECHAZAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;