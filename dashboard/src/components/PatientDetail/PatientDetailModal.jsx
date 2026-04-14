import React from 'react';
import { LogOut, Trash2, FileText } from 'lucide-react';
import VerificationPending from './VerificationPending';
import HistoryChart from './HistoryChart';
import WeeklyDose from './WeeklyDose';
import ChatBox from './ChatBox';
import ClinicalSummary from './ClinicalSummary';

const PatientDetailModal = ({ 
    patient, 
    onClose, 
    onDelete,
    onVerifyReading, 
    doseState, onDoseChange, onSaveDose,
    messages, chatInput, setChatInput, onSendMessage, chatRef,
    onOpenDateModal 
}) => {
  
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
        {/* Overlay con opacidad */}
        <div 
            className="absolute inset-0 bg-gradient-to-l from-slate-900/60 to-slate-900/20 backdrop-blur-sm" 
            onClick={onClose}
            aria-label="Cerrar modal"
        ></div>
        
        {/* Panel lateral */}
        <div className="relative w-full max-w-4xl bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
                
                {/* HEADER ACTUALIZADO - Con diagnóstico como subtítulo */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-start sticky top-0 z-10">
                    <div className="flex-1">
                        {/* Nombre del Paciente */}
                        <h2 className="font-black text-4xl text-slate-800 tracking-tight">
                            {patient.nombre}
                        </h2>
                        
                        {/* SUBTÍTULO: Diagnóstico (Motivo) */}
                        <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                            {patient.motivo || "DIAGNÓSTICO NO ESPECIFICADO"}
                        </p>

                        {/* METADATOS: Expediente y Tratamiento */}
                        <div className="flex flex-wrap gap-3 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                    Expediente
                                </span>
                                <span className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold shadow-sm flex items-center gap-1">
                                    <FileText size={12} className="text-slate-400" />
                                    #{patient.expediente}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                    Tratamiento
                                </span>
                                <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold shadow-sm">
                                    {patient.medicamento} — {patient.tabletSize}mg
                                </span>
                            </div>

                            {/* Edad (si está disponible) */}
                            {patient.edad && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                        Edad
                                    </span>
                                    <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold shadow-sm">
                                        {patient.edad} años
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Botones de Acción (Trash y Close) */}
                    <div className="flex gap-2 pt-1">
                        <button 
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de eliminar este paciente?')) {
                                    onDelete(patient.id);
                                }
                            }} 
                            className="text-slate-300 hover:text-red-600 bg-white p-2.5 rounded-xl shadow-sm transition-all border border-slate-100 hover:border-red-100 hover:shadow-md active:scale-95"
                            title="Eliminar Paciente"
                            aria-label="Eliminar paciente"
                        >
                            <Trash2 size={20} />
                        </button>

                        <button 
                            onClick={onClose} 
                            className="text-slate-400 hover:text-slate-600 bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 hover:border-slate-200 hover:shadow-md active:scale-95 transition-all"
                            title="Cerrar"
                            aria-label="Cerrar modal"
                        >
                            <LogOut size={20} className="rotate-45"/>
                        </button>
                    </div>
                </div>

                {/* Contenido Principal */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Verificación Pendiente (solo si existe) */}
                        {patient.latestPending && (
                            <VerificationPending 
                                reading={patient.latestPending} 
                                onVerify={onVerifyReading} 
                            />
                        )}

                        {/* Gráfico de Historial */}
                        <HistoryChart 
                            history={patient.history || []} 
                            minTarget={patient.minTargetINR || 2} 
                            maxTarget={patient.maxTargetINR || 3} 
                        />

                        {/* Dosis Semanal */}
                        <WeeklyDose 
                            dose={doseState} 
                            tabletSize={patient.tabletSize} 
                            onDoseChange={onDoseChange} 
                            onSave={onSaveDose}
                        />
                    </div>

                    {/* Columna Derecha (1/3) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Resumen Clínico con modal de fechas */}
                        <ClinicalSummary 
                            patient={patient} 
                            onOpenDateModal={onOpenDateModal} 
                        />

                        {/* Chat con Paciente */}
                        <ChatBox 
                            messages={messages || []} 
                            currentInput={chatInput} 
                            onInputChange={setChatInput} 
                            onSend={onSendMessage} 
                            chatRef={chatRef}
                        />
                    </div>
                </div>

                {/* Footer opcional con información adicional */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">
                        ID: {patient.id} • Última actualización: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PatientDetailModal;