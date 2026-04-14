// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import { Activity } from 'lucide-react';

const LoginScreen = ({ onLogin, showToast }) => {
  const [expedienteInput, setExpedienteInput] = useState('');
  const [fechaNacInput, setFechaNacInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!expedienteInput.trim()) {
      showToast("Ingresa tu número de expediente", "error");
      return;
    }
    
    // Validar formato básico del expediente
    if (expedienteInput.trim().length < 3) {
      showToast("Expediente demasiado corto", "error");
      return;
    }
    
    setLoading(true);
    try {
      // ✅ Llamar a la función de login de App.jsx
      await onLogin(expedienteInput.trim(), fechaNacInput);
    } catch (error) {
      // El error ya se maneja en App.jsx
      console.error('💥 [LoginScreen] Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="w-24 h-24 bg-[#2a788e] rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform transition-transform hover:scale-105">
        <Activity className="text-white w-12 h-12" />
      </div>
      
      {/* Título */}
      <h1 className="text-4xl font-black text-[#2a788e] mb-2 tracking-tight">CLOT</h1>
      <p className="text-slate-500 mb-8 text-center max-w-xs">
        Control de Anticoagulación Personalizado
      </p>
      
      {/* Formulario */}
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Número de Expediente
            </label>
            <input 
              type="text" 
              placeholder="Ej: PAC001" 
              value={expedienteInput} 
              onChange={e => setExpedienteInput(e.target.value)} 
              className="w-full text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#2a788e] focus:ring-2 focus:ring-[#2a788e]/20"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha de Nacimiento
            </label>
            <input 
              type="date" 
              value={fechaNacInput} 
              onChange={e => setFechaNacInput(e.target.value)} 
              className="w-full text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#2a788e] focus:ring-2 focus:ring-[#2a788e]/20"
              disabled={loading}
            />
            <p className="text-xs text-slate-400 mt-1 text-center">
              (Opcional, según registro médico)
            </p>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 ${loading ? 'bg-gray-400' : 'bg-[#2a788e] hover:bg-[#236777]'} text-white rounded-xl font-bold shadow-lg transition-all duration-300 active:scale-95`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verificando...
              </span>
            ) : (
              'Acceder a Mi Salud'
            )}
          </button>
        </form>
        
        {/* Información adicional */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            Si olvidaste tu expediente, contacta a tu médico
          </p>
          <div className="mt-3 flex justify-center">
            <button 
              type="button"
              onClick={() => {
                // Datos de prueba para desarrollo
                if (process.env.NODE_ENV === 'development') {
                  setExpedienteInput('TEST001');
                  setFechaNacInput('1990-01-01');
                  showToast("Datos de prueba cargados", "info");
                }
              }}
              className="text-xs text-[#2a788e] hover:underline"
            >
              ¿Necesitas ayuda?
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          Versión 1.0 • Sistema seguro de telemedicina
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;