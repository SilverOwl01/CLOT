import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Star, Award, Calendar, Trophy, Zap, TrendingUp, Flame } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

const ProgresoScreen = ({ onBack, patientId, userConfig }) => {
  const [adherencia, setAdherencia] = useState(0);
  const [historialINR, setHistorialINR] = useState([]);
  const [estrellas, setEstrellas] = useState(0);
  const [superEstrellas, setSuperEstrellas] = useState(0);
  const [rachaActual, setRachaActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Valores objetivo del paciente (con valores por defecto)
  const targetRange = useMemo(() => ({
    min: userConfig?.minTargetINR || 2.0,
    max: userConfig?.maxTargetINR || 3.0
  }), [userConfig]);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    const db = firebaseService.getDB();
    // Forzamos el ID de producción para consistencia con RegistrarINRScreen
    const appId = "clot-app-produccion"; 
    const unsubs = [];

    // 1. Escuchar Historial INR - con normalización de campos
    // IMPORTANTE: Esta consulta requiere el índice (patientId ASC, timestamp DESC)
    const inrQuery = query(
      collection(db, `artifacts/${appId}/public/data/inr_readings`),
      where("patientId", "==", patientId),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubINR = onSnapshot(inrQuery, (snap) => {
      const inrData = snap.docs.map(doc => {
        const d = doc.data();
        
        // Normalización de fecha (maneja Timestamp o Date string)
        let date;
        if (d.timestamp?.toDate) {
          date = d.timestamp.toDate();
        } else if (d.timestamp) {
          date = new Date(d.timestamp);
        } else {
          date = new Date();
        }
        
        // Normalización del valor INR (acepta 'value' o 'finalINR')
        let valor = 0;
        if (d.value !== undefined) valor = parseFloat(d.value);
        else if (d.finalINR !== undefined) valor = parseFloat(d.finalINR);
        
        return {
          id: doc.id,
          ...d,
          value: valor,
          timestamp: date,
          fecha: date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })
        };
      }).filter(item => item.value > 0); // Filtrar valores inválidos
      
      setHistorialINR(inrData);
      calculateClinicalStreaks(inrData);
      setUltimaActualizacion(new Date());
      setLoading(false); // ✅ Éxito - apagamos loading
    }, (error) => {
      console.error("💥 Error en inr_readings:", error);
      setLoading(false); // ✅ Apagamos loading aunque falle para mostrar error o vacío
    });

    unsubs.push(unsubINR);

    // 2. Escuchar Logs de Dosis para adherencia y estrellas
    const logsQuery = query(
      collection(db, `artifacts/${appId}/public/data/patients/${patientId}/dosis_logs`),
      where("tomada", "==", true)
    );

    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const totalTomadas = snap.size;
      
      // Cálculo de adherencia mejorado
      const hoy = new Date();
      
      // Buscar el primer registro para calcular días transcurridos
      let primerRegistro = null;
      snap.docs.forEach(doc => {
        const fecha = doc.data().timestamp?.toDate();
        if (fecha && (!primerRegistro || fecha < primerRegistro)) {
          primerRegistro = fecha;
        }
      });

      let diasTranscurridos = hoy.getDate(); // Por defecto, días del mes actual
      
      if (primerRegistro) {
        const diffTime = Math.abs(hoy - primerRegistro);
        diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      }
      
      const porcentaje = Math.min(Math.round((totalTomadas / diasTranscurridos) * 100), 100);
      setAdherencia(porcentaje);
      
      // Gamificación: 1 estrella normal por cada 3 tomas
      setEstrellas(Math.floor(totalTomadas / 3));
    }, (error) => {
      console.error("💥 Error en dosis_logs:", error);
    });

    unsubs.push(unsubLogs);

    // Limpiar suscripciones al salir
    return () => unsubs.forEach(unsub => unsub());
  }, [patientId, targetRange]);

  // Función para calcular rachas clínicas y super estrellas
  const calculateClinicalStreaks = (readings) => {
    if (!readings?.length) {
      setRachaActual(0);
      setSuperEstrellas(0);
      return;
    }

    const { min, max } = targetRange;
    
    // Ordenar por fecha ascendente (más antigua a más reciente)
    const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);
    
    let racha = 0;
    let totalSuperEstrellas = 0;

    sorted.forEach(r => {
      if (r.value >= min && r.value <= max) {
        racha++;
        // Por cada 3 tomas seguidas en rango, una Súper Estrella
        if (racha % 3 === 0) {
          totalSuperEstrellas++;
        }
      } else {
        racha = 0; // Se rompe la racha si sale de rango
      }
    });

    setRachaActual(racha);
    setSuperEstrellas(totalSuperEstrellas);
  };

  // Función para determinar si un valor está en rango
  const isInRange = (value) => {
    return value >= targetRange.min && value <= targetRange.max;
  };

  // Obtener el último valor INR
  const ultimoINR = historialINR[0]?.value || null;
  const ultimoINRStatus = ultimoINR ? isInRange(ultimoINR) : null;

  // Renderizado condicional
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#2a788e] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-400">Analizando registros...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center gap-4 border-b border-slate-100">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-all"
          aria-label="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black text-2xl text-slate-800">Mi Progreso</h1>
        
        {/* Indicador de actualización en vivo */}
        {ultimaActualizacion && (
          <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>En vivo</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-8">
        
        {/* SECCIÓN: Logros Clínicos (Súper Estrellas) */}
        {superEstrellas > 0 && (
          <div className="mt-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
            <Zap className="absolute -right-4 -top-4 text-white/10 w-32 h-32 rotate-12" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={20} className="text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest opacity-80">Logro Clínico</span>
              </div>
              
              <h2 className="text-2xl font-black">¡Paciente Experto!</h2>
              
              <div className="flex items-center gap-2 mt-1">
                <Flame size={16} className="text-orange-300" />
                <p className="text-sm opacity-90">
                  Has mantenido tu INR en rango <strong className="text-yellow-300">{rachaActual}</strong> {rachaActual === 1 ? 'vez' : 'veces'} seguidas
                </p>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <div className="flex gap-1.5">
                  {[...Array(Math.min(superEstrellas, 5))].map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-white/20 p-2 rounded-xl backdrop-blur-md animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    >
                      <Star fill="#facc15" color="#facc15" size={20} />
                    </div>
                  ))}
                </div>
                {superEstrellas > 5 && (
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                    +{superEstrellas - 5}
                  </span>
                )}
                <span className="text-xs opacity-80 ml-auto">
                  {superEstrellas} súper {superEstrellas === 1 ? 'estrella' : 'estrellas'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Anillo de Adherencia */}
        <div className="bg-slate-50 rounded-[2.5rem] p-8 mt-4 flex flex-col items-center shadow-inner">
          <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Círculo de fondo */}
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                className="text-slate-200" 
              />
              {/* Círculo de progreso */}
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="440" 
                strokeDashoffset={440 - (440 * adherencia) / 100}
                strokeLinecap="round"
                className="text-[#2a788e] transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-800">{adherencia}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adherencia</span>
            </div>
          </div>
          
          {/* Mensaje motivacional según adherencia */}
          <p className="mt-6 text-slate-500 font-medium text-center px-4">
            {adherencia >= 90 ? "¡Protección máxima! Tu constancia es excelente." : 
             adherencia >= 70 ? "Vas por buen camino, sigue así." :
             "Cada toma cuenta para tu salud. ¡Tú puedes!"}
          </p>
          
          {/* Último INR */}
          {ultimoINR && (
            <div className="mt-4 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <TrendingUp size={14} className={ultimoINRStatus ? "text-emerald-500" : "text-amber-500"} />
              <span className="text-xs font-medium text-slate-600">
                Último INR: <strong className={ultimoINRStatus ? "text-emerald-600" : "text-amber-600"}>
                  {ultimoINR.toFixed(1)}
                </strong>
              </span>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                ultimoINRStatus ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {ultimoINRStatus ? "EN RANGO" : "FUERA"}
              </span>
            </div>
          )}
        </div>

        {/* Sección de Estrellas normales (por tomas) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <Award className="text-yellow-500" size={20} /> Mis Estrellas
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full">
              <Star size={14} fill="#eab308" className="text-yellow-500" />
              <span className="text-[#2a788e] font-black text-sm">{estrellas}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[...Array(Math.min(estrellas, 15))].map((_, i) => (
              <div 
                key={i} 
                className="bg-yellow-400 p-2 rounded-xl shadow-lg shadow-yellow-100 animate-bounce" 
                style={{ animationDelay: `${i * 0.05}s`, animationDuration: '1s' }}
              >
                <Star fill="white" color="white" size={16} />
              </div>
            ))}
            {estrellas === 0 && (
              <p className="text-slate-400 italic text-sm py-2">
                Pronto aparecerá tu primera estrella...
              </p>
            )}
            {estrellas > 15 && (
              <div className="flex items-center justify-center bg-slate-100 px-3 py-2 rounded-xl">
                <span className="text-sm font-bold text-slate-600">+{estrellas - 15}</span>
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-slate-400 mt-3">
            ✦ 1 estrella por cada 3 dosis tomadas
          </p>
        </div>

        {/* Historial Reciente */}
        <div className="mt-8">
          <h2 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="text-slate-400" size={20} /> Historial Reciente
          </h2>
          
          <div className="space-y-3">
            {historialINR.length > 0 ? (
              historialINR.map((item, index) => {
                const enRango = isInRange(item.value);
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-sm
                        ${enRango ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                        {item.value?.toFixed(1) || 'N/A'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">INR Reportado</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                          <span>{item.fecha}</span>
                          {index === 0 && (
                            <span className="text-emerald-500 text-[8px] bg-emerald-50 px-2 py-0.5 rounded-full">
                              Último
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicador visual de racha */}
                    {index === 0 && rachaActual >= 3 && (
                      <div className="flex items-center gap-1">
                        <Flame size={16} className="text-orange-500" />
                        <span className="text-xs font-bold text-orange-600">Racha {rachaActual}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl">
                <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm font-medium">
                  No hay reportes recientes
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Los resultados aparecerán aquí cuando registres tus tomas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Meta de rango terapéutico */}
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-xs text-blue-800 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Tu rango terapéutico: {targetRange.min.toFixed(1)} - {targetRange.max.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgresoScreen;