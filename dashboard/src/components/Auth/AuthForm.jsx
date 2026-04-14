import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Droplet, ChevronRight, AlertCircle, Activity } from 'lucide-react';

const AuthForm = () => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error manejado en hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-800">
      
      {/* --- LADO IZQUIERDO: FORMULARIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-sm space-y-8 relative z-10">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-8">
                <div className="p-2 bg-red-50 rounded-xl">
                    <Droplet size={28} className="text-red-600 fill-red-600" />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900">CLOT</span>
            </div>
            
            {/* CAMBIO 1: Saludo Inclusivo */}
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Hola, Doctor/a.</h2>
            <p className="text-slate-400 font-medium">
              Bienvenido a la plataforma de monitoreo.
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Correo Institucional</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-red-500 transition-colors">
                    <Mail size={18} />
                    </div>
                    <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#eeedfc] focus:border-red-100 transition-all font-medium"
                    placeholder="usuario@clot.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-red-500 transition-colors">
                    <Lock size={18} />
                    </div>
                    <input
                    type="password"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#eeedfc] focus:border-red-100 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 font-medium leading-tight">
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300 shadow-xl shadow-red-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Accediendo...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <span>Iniciar Sesión</span>
                    <ChevronRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform"/>
                </div>
              )}
            </button>
          </form>

          <div className="pt-8 text-center space-y-2">
            <p className="text-xs text-slate-300 font-medium">Uso exclusivo para investigación clínica.</p>
          </div>
        </div>
      </div>

      {/* --- LADO DERECHO: BRANDING ACADÉMICO --- */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12">
        
        {/* Fondo Lavanda Claro */}
        <div className="absolute inset-0 bg-[#eeedfc]"></div>
        
        {/* Formas Abstractas */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 -translate-x-1/4 translate-y-1/4"></div>

        {/* Tarjeta Flotante */}
        <div className="relative z-10 max-w-md w-full">
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 mb-8 rotate-3">
                    <Activity size={32} className="text-white" />
                </div>
                
                {/* CAMBIO 2: Definición del Acrónimo */}
                <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight tracking-tight">
                    CLOT
                </h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-6 border-b border-slate-200 pb-6">
                    Clinical Long‑term Oral anticoagulation Telemonitoring
                </p>

                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    "Optimizando la adherencia terapéutica y seguridad del paciente mediante monitoreo digital continuo."
                </p>

                {/* CAMBIO 3 & 4: Autores y eliminación de estadísticas */}
                <div className="mt-8 pt-6 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Investigadores / Autores
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span className="text-sm font-bold text-slate-700">MPSS Enrique Aguilar Camacho</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <span className="text-sm font-bold text-slate-700">Dra. Hilda Delgadillo Rodriguez</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;