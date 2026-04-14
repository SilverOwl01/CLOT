// src/screens/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import MenuButton from '../components/MenuButton';
import { getStatusGradient } from '../utils/clinicalUtils';
import { firebaseService } from '../services/firebaseService';
import { Activity, Clock, Calendar } from 'lucide-react';

const HomeScreen = ({ 
  patientId, 
  onLogout, 
  onNavigate,
  pillIcons,
  showToast
}) => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [proximaCita, setProximaCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 EFECTO 1: SUSCRIBIRSE A DATOS DEL PACIENTE
  useEffect(() => {
    console.log('🏠 [HomeScreen] Montando pantalla para paciente:', patientId);
    
    if (!patientId) {
      console.error('❌ [HomeScreen] No hay patientId');
      showToast("Error: No se identificó al paciente", "error");
      onLogout();
      return;
    }
    
    if (!firebaseService.isReady()) {
      console.error('❌ [HomeScreen] Firebase no está listo');
      showToast("Error de conexión con el servidor", "error");
      return;
    }
    
    const appId = firebaseService.getAppId();
    const db = firebaseService.getDB();
    
    let unsubscribePatient = () => {};
    let unsubscribeHistory = () => {};
    
    const setupSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📡 [HomeScreen] Configurando suscripciones...');
        
        // 1️⃣ SUSCRIBIRSE AL PACIENTE
        const patientDocRef = doc(db, `artifacts/${appId}/public/data/patients`, patientId);
        unsubscribePatient = onSnapshot(patientDocRef, 
          (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.data();
              console.log('✅ [HomeScreen] Datos del paciente actualizados:', userData.nombre);
              
              setUser({ 
                id: snapshot.id, 
                ...userData,
                // Asegurar valores por defecto
                minTargetINR: userData.minTargetINR || 2.0,
                maxTargetINR: userData.maxTargetINR || 3.0,
                tabletSize: userData.tabletSize || 5
              });
              
              // Procesar próxima cita
              if (userData.nextReadingDate) {
                const nextDate = userData.nextReadingDate.toDate 
                  ? userData.nextReadingDate.toDate()
                  : new Date(userData.nextReadingDate);
                setProximaCita(nextDate);
              } else {
                setProximaCita(null);
              }
              
            } else {
              console.error('❌ [HomeScreen] Paciente no encontrado en BD');
              showToast("Tu expediente ya no existe en el sistema", "error");
              setTimeout(() => onLogout(), 2000);
            }
          },
          (error) => {
            console.error('💥 [HomeScreen] Error en suscripción a paciente:', error);
            setError("Error al cargar datos del paciente");
            showToast("Error de conexión con tus datos", "error");
          }
        );
        
        // 2️⃣ SUSCRIBIRSE AL HISTORIAL INR
        const readingsCollectionRef = collection(db, `artifacts/${appId}/public/data/inr_readings`);
        const readingsQuery = query(readingsCollectionRef, orderBy('timestamp', 'desc'));
        
        unsubscribeHistory = onSnapshot(readingsQuery, 
          (snapshot) => {
            const allReadings = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // Normalizar timestamp
                timestamp: data.timestamp || { seconds: Date.now() / 1000 }
              };
            });
            
            // Filtrar solo lecturas de este paciente
            const patientReadings = allReadings.filter(reading => reading.patientId === patientId);
            console.log('📊 [HomeScreen] Historial actualizado:', patientReadings.length, 'lecturas');
            
            setHistory(patientReadings);
            setLoading(false);
          },
          (error) => {
            console.error('💥 [HomeScreen] Error en suscripción a historial:', error);
            setError("Error al cargar historial");
            setLoading(false);
          }
        );
        
        console.log('✅ [HomeScreen] Suscripciones configuradas correctamente');
        
      } catch (error) {
        console.error('💥 [HomeScreen] Error configurando suscripciones:', error);
        setError("Error al configurar conexiones");
        showToast("Error de conexión", "error");
        setLoading(false);
      }
    };
    
    setupSubscriptions();
    
    // 🧹 LIMPIAR AL DESMONTAR
    return () => {
      console.log('🧹 [HomeScreen] Limpiando suscripciones...');
      unsubscribePatient();
      unsubscribeHistory();
    };
    
  }, [patientId]); // Solo se ejecuta cuando cambia patientId

  // 🎨 RENDERIZADO DE CARGA
  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 bg-[#2a788e] rounded-2xl flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="text-xl">💙</div>
            </div>
          </div>
          <div className="absolute inset-0 border-4 border-[#2a788e] border-t-transparent rounded-2xl animate-spin"></div>
        </div>
        <p className="text-slate-600 font-medium">Cargando tu información...</p>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    );
  }

  // 🎨 RENDERIZADO DE ERROR
  if (error && !user) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <div className="text-3xl text-red-500">⚠️</div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Conexión</h2>
        <p className="text-slate-600 text-center mb-6">{error}</p>
        <button
          onClick={onLogout}
          className="bg-[#2a788e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#236777] transition"
        >
          Volver al Login
        </button>
      </div>
    );
  }

  const { Pill, MessageSquare, TrendingUp, LogOut } = pillIcons;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-start bg-white shadow-sm rounded-b-[2.5rem]">
        <div>
          <h1 className="text-3xl font-black text-[#2a788e] tracking-tighter">CLOT</h1>
          <p className="text-slate-500 text-sm font-medium">
            Hola, <span className="text-slate-800 font-bold">{user?.nombre?.split(' ')[0] || 'Usuario'}</span>
          </p>
        </div>
        <button 
          onClick={onLogout} 
          className="bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition"
          title="Cerrar sesión"
        >
          <LogOut size={20}/>
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* BOTÓN INR SEMÁFORO */}
        <button 
          onClick={() => onNavigate('registrar-inr')}
          className={`bg-gradient-to-br ${getStatusGradient(
            history[0]?.value, 
            user?.minTargetINR || 2.0, 
            user?.maxTargetINR || 3.0
          )} rounded-[2.5rem] p-8 text-center shadow-xl text-white mb-6 relative overflow-hidden w-full hover:scale-[1.02] transition-transform duration-300 active:scale-95`}
        >
          <div className="relative z-10">
            <div className="text-white/80 font-bold text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Activity size={14}/> Último INR
            </div>
            <div className="text-[5rem] font-black leading-none drop-shadow-sm">
              {history[0]?.value?.toFixed(1) || '--'}
            </div>
            <div className="mt-4 text-xs bg-black/20 inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm">
              <Clock size={12}/> 
              {history[0]?.timestamp?.seconds ? 
                new Date(history[0].timestamp.seconds * 1000).toLocaleDateString('es-ES') : 
                'Sin registros'}
            </div>
            <div className="text-xs text-white/80 mt-3 font-medium animate-pulse">
              (Toca para actualizar)
            </div>
          </div>
        </button>

        {/* Menú de acciones */}
        <div className="grid grid-cols-2 gap-4">
          <MenuButton 
            icon={Pill} 
            label="Mi Tratamiento" 
            onClick={() => onNavigate('tratamiento')} // Este string debe coincidir con el if de App.jsx
          />
          <MenuButton icon={MessageSquare} label="Chat Médico" onClick={() => onNavigate('chat')} />
          <MenuButton icon={TrendingUp} label="Mi Progreso" onClick={() => onNavigate('progreso')} />
        </div>

        {/* Próxima Cita */}
        {proximaCita && (
          <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <Calendar size={20}/>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Próximo Control</p>
                <p className="font-bold text-slate-800">
                  {proximaCita.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Recuerda registrar tu INR antes de la cita
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información del tratamiento */}
        {user?.medicamento && (
          <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase">Tratamiento Actual</p>
            <p className="font-bold text-slate-800 mt-1">
              {user.medicamento} ({user.tabletSize || 5}mg)
            </p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-slate-600">
                Rango objetivo: <span className="font-bold text-[#2a788e]">
                  {user.minTargetINR || 2.0} - {user.maxTargetINR || 3.0} INR
                </span>
              </p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                history[0]?.value >= (user.minTargetINR || 2.0) && 
                history[0]?.value <= (user.maxTargetINR || 3.0) 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {history[0]?.value ? '📊 Con datos' : '📊 Sin datos'}
              </span>
            </div>
          </div>
        )}

        {/* Estado de conexión */}
        <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${firebaseService.isReady() ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-slate-500">
                {firebaseService.isReady() ? 'Conectado al servidor' : 'Sin conexión'}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {history.length} {history.length === 1 ? 'registro' : 'registros'} de INR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;