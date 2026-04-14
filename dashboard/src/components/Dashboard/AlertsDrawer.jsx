import React from 'react';
import { X, Bell, Trash2, ChevronRight, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

const AlertsDrawer = ({ isOpen, onClose, alerts, onDismiss, onClearAll, onSelectAlert }) => {
  
  // Función auxiliar para mapear severidad de la App Móvil a estilos del Dashboard
  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'urgente':
        return { color: 'bg-rose-500', icon: <AlertOctagon size={18} className="text-rose-500" />, title: "Urgencia Médica" };
      case 'medio':
        return { color: 'bg-amber-500', icon: <AlertTriangle size={18} className="text-amber-500" />, title: "Alerta de Rango" };
      case 'info':
        return { color: 'bg-blue-500', icon: <Info size={18} className="text-blue-500" />, title: "Notificación" };
      default:
        return { color: 'bg-slate-300', icon: <Bell size={18} className="text-slate-400" />, title: "Aviso" };
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Bell className="text-indigo-600" size={20}/> Centro de Alertas
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
            </h3>
            <div className="flex gap-2">
                {alerts.length > 0 && (
                    <button onClick={() => onClearAll(alerts)} className="p-2 text-slate-400 hover:text-red-500 transition" title="Borrar todas">
                        <Trash2 size={18}/>
                    </button>
                )}
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition">
                    <X size={20}/>
                </button>
            </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-80px)] p-4 space-y-3">
            {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Bell size={48} className="mb-4 stroke-1"/>
                    <p className="text-sm font-medium">Estás al día. Sin alertas.</p>
                </div>
            ) : (
                alerts.map(alert => {
                    const config = getSeverityConfig(alert.severity);
                    return (
                        <div key={alert.id} className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            {/* Barra lateral de color dinámica */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`}></div>
                            
                            <div className="flex gap-3">
                                <div className="mt-1 shrink-0">
                                    {config.icon}
                                </div>
                                
                                <div className="flex-1 cursor-pointer" onClick={() => { onSelectAlert(alert); onClose(); }}>
                                    {/* El título ahora es dinámico según la severidad definida en el móvil */}
                                    <h4 className="font-bold text-sm text-slate-800">{config.title}</h4>
                                    
                                    {/* El mensaje mostrará el texto: "INR X.X (Status) - Con síntomas" */}
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                                      {alert.message}
                                    </p>
                                    
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">
                                        {alert.timestamp?.seconds 
                                          ? new Date(alert.timestamp.seconds * 1000).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) 
                                          : 'Reciente'}
                                    </p>
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                                    className="self-start text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                >
                                    <X size={16}/>
                                </button>
                            </div>

                            <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={16} className="text-indigo-400"/>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </>
  );
};

export default AlertsDrawer;