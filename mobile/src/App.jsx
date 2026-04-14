// src/App.jsx
import React, { useState, useEffect } from 'react';

// Servicios
import { firebaseService } from './services/firebaseService';

// Hooks
import useToast from './hooks/useToast';

// Componentes
import ToastNotification from './components/ToastNotification';
import MedicalDisclaimer from './components/MedicalDisclaimer';

// Pantallas
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TratamientoScreen from './screens/TratamientoScreen';
import RegistrarINRScreen from './screens/RegistrarINRScreen';
import ProgresoScreen from './screens/ProgresoScreen';
import ChatScreen from './screens/ChatScreen';

// Iconos de Lucide que necesitamos para HomeScreen
import { Pill, MessageSquare, TrendingUp, Calendar, LogOut } from 'lucide-react';

// Capacitor
import { LocalNotifications } from '@capacitor/local-notifications';

const App = () => {
  // Estados básicos - EL PORTERO
  const [patientId, setPatientId] = useState(localStorage.getItem('clot_pid') || null);
  const [view, setView] = useState('loading');
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [user, setUser] = useState(null);
  const [retryCount, setRetryCount] = useState(0); // Para reintentos manuales
  
  // Hooks personalizados
  const { toast, showToast, hideToast } = useToast();
  
  // 🔒 EFECTO 1: INICIALIZACIÓN DE FIREBASE (EL PORTERO) - CON ALERT MEJORADO
  useEffect(() => {
    console.log('🚪 [App-Portero] Montando componente - Bloqueando entrada...');
    
    const initializeFirebase = async () => {
      try {
        console.log('🔑 [App-Portero] Llamando a firebaseService.initialize()...');
        
        // Verificar conectividad primero
        if (!navigator.onLine) {
          throw new Error('Sin conexión a internet');
        }
        
        const firebaseInitialized = await firebaseService.initialize();
        
        if (firebaseInitialized) {
          console.log('✅ [App-Portero] Firebase inicializado CORRECTAMENTE');
          console.log('📊 [App-Portero] Estado Firebase:', {
            initialized: firebaseService.initialized,
            db: firebaseService.db ? '✅ Presente' : '❌ NULL',
            auth: firebaseService.auth ? '✅ Presente' : '❌ NULL'
          });
          
          setIsFirebaseReady(true);
          setInitializationError(null);
          
          // Solicitar permisos de notificaciones (no crítico)
          try {
            await LocalNotifications.requestPermissions();
            console.log('🔔 [App-Portero] Permisos de notificación solicitados');
          } catch (notifError) {
            console.warn('⚠️ [App-Portero] Error con notificaciones (no crítico):', notifError);
          }
          
        } else {
          console.error('❌ [App-Portero] Firebase.initialize() retornó FALSE');
          const errorMsg = 'Firebase no se pudo inicializar';
          alert("🔴 Error de Conexión: " + errorMsg);
          setInitializationError(errorMsg);
        }
        
      } catch (error) {
        console.error('💥 [App-Portero] ERROR en initialize():', error);
        console.error('💥 [App-Portero] Detalles:', error.message);
        
        alert(`🔴 Error de Conexión: ${error.message}\n\nVerifica tu conexión a internet y vuelve a intentar.`);
        
        setInitializationError(`Error de Firebase: ${error.message}`);
      }
    };
    
    initializeFirebase();
  }, [retryCount]);
  
  // 🔄 EFECTO 2: DECIDIR QUÉ VISTA MOSTRAR CUANDO FIREBASE ESTÉ LISTO
  useEffect(() => {
    console.log('👁️ [App-Portero] Revisando si puede abrir la puerta...');
    console.log('👁️ [App-Portero] Estado:', {
      isFirebaseReady,
      patientId: patientId ? '✅ Presente' : '❌ Ausente',
      view,
      initializationError,
      online: navigator.onLine ? '✅ Online' : '❌ Offline'
    });
    
    // Solo proceder si Firebase está listo
    if (!isFirebaseReady) {
      console.log('⏳ [App-Portero] Firebase NO está listo, manteniendo puerta cerrada...');
      return;
    }
    
    // Si hay error de inicialización, mostrar pantalla de error pero permitir reintentar
    if (initializationError) {
      console.error('🚫 [App-Portero] Error detectado:', initializationError);
      setView('error');
      return;
    }
    
    // Firebase está listo, decidir qué vista mostrar
    if (!patientId) {
      console.log('👤 [App-Portero] No hay patientId, redirigiendo a LOGIN');
      setView('login');
    } else {
      console.log('👤 [App-Portero] PatientId encontrado, redirigiendo a HOME');
      setView('home');
    }
    
  }, [isFirebaseReady, patientId, initializationError]);
  
  // Función para reintentar inicialización
  const handleRetry = () => {
    console.log('🔄 [App-Portero] Reintentando inicialización...');
    setInitializationError(null);
    setIsFirebaseReady(false);
    setRetryCount(prev => prev + 1);
  };
  
  // 🔐 MANEJO DE LOGIN
  const handleLogin = async (expediente, fechaNac) => {
    console.log('🔐 [App-Portero] Intento de login recibido:', { expediente });
    
    if (!isFirebaseReady || !firebaseService.db) {
      console.error('❌ [App-Portero] Intento de login pero Firebase NO está listo');
      showToast("Error del sistema. Por favor, reinicia la aplicación.", "error");
      return;
    }
    
    try {
      console.log('🔍 [App-Portero] Buscando paciente en Firebase...');
      const patient = await firebaseService.getPatient(expediente);
      
      if (patient) {
        console.log('✅ [App-Portero] Login EXITOSO para:', patient.nombre);
        
        if (patient.fechaNacimiento && patient.fechaNacimiento !== fechaNac) {
          showToast("Fecha de nacimiento incorrecta", "error");
          return;
        }
        
        localStorage.setItem('clot_pid', expediente);
        setPatientId(expediente);
        setUser(patient);
        
        const firstName = patient.nombre.split(' ')[0];
        showToast(`¡Bienvenido ${firstName}!`, "success");
        
      } else {
        console.log('❌ [App-Portero] Paciente no encontrado');
        showToast("Expediente no encontrado", "error");
      }
    } catch (error) {
      console.error('💥 [App-Portero] Error en login:', error);
      showToast("Error al conectar con el servidor", "error");
    }
  };
  
  // 🚪 MANEJO DE LOGOUT
  const handleLogout = () => {
    console.log('🚪 [App-Portero] Cerrando sesión...');
    localStorage.removeItem('clot_pid');
    setPatientId(null);
    setUser(null);
    showToast("Sesión cerrada", "info");
  };
  
  // 📱 NAVEGACIÓN
  const handleNavigate = (targetView) => {
    console.log('🧭 [App-Portero] Navegando a:', targetView);
    setView(targetView);
  };
  
  // Función para renderizar el contenido principal según la vista
  const renderMainContent = () => {
    switch (view) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} showToast={showToast} />;
      
      case 'home':
        return (
          <HomeScreen 
            patientId={patientId}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            pillIcons={{ Pill, MessageSquare, TrendingUp, Calendar, LogOut }}
            showToast={showToast}
          />
        );
      
      case 'tratamiento':
        return (
          <TratamientoScreen 
            patientId={patientId} 
            onBack={() => setView('home')} 
            showToast={showToast}
          />
        );
      
      case 'registrar-inr':
        return (
          <RegistrarINRScreen 
            onBack={() => setView('home')} 
            patientId={patientId} 
            userConfig={user}
            showToast={showToast} 
          />
        );
      
      case 'progreso':
        return (
          <ProgresoScreen 
            patientId={patientId} 
            onBack={() => setView('home')} 
            userConfig={user}
            showToast={showToast}
          />
        );
      
      case 'chat':
        return (
          <ChatScreen 
            onBack={() => setView('home')} 
            patientId={patientId} 
            showToast={showToast} 
          />
        );
      
      // ✅ BLOQUE LOADING ACTUALIZADO - Rojo sangre #991b1b con gota pulsante
      case 'loading':
        return (
          <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-8">
            {/* Logo/Spinner con Gota Roja */}
            <div className="relative mb-8">
              {/* Contenedor principal en Rojo Sangre */}
              <div className="w-24 h-24 bg-[#991b1b] rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                  {/* Gota Roja con animación de pulso */}
                  <div className="text-4xl animate-pulse">🩸</div>
                </div>
              </div>
              {/* Spinner externo en Rojo Sangre */}
              <div className="absolute inset-0 border-4 border-[#991b1b] border-t-transparent rounded-3xl animate-spin"></div>
            </div>
            
            {/* Texto CLOT en Rojo Sangre */}
            <h1 className="text-3xl font-black text-[#991b1b] mb-2">CLOT</h1>
            <p className="text-slate-600 font-medium mb-4">Inicializando sistema...</p>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 max-w-xs w-full border border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-bold">Firebase</span>
                  <span className={`text-sm font-bold ${isFirebaseReady ? 'text-green-600' : 'text-amber-600'}`}>
                    {isFirebaseReady ? '✅ LISTO' : '⏳ CONECTANDO...'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-bold">Internet</span>
                  <span className={`text-sm font-bold ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
                    {navigator.onLine ? '✅ ONLINE' : '❌ OFFLINE'}
                  </span>
                </div>
                
                {initializationError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-600 font-bold uppercase">Error de inicialización:</p>
                    <p className="text-[11px] text-red-700 mb-2">{initializationError}</p>
                    <button 
                      onClick={handleRetry}
                      className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all"
                    >
                      REINTENTAR AHORA
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="h-screen bg-gradient-to-br from-red-50 to-rose-100 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <div className="text-3xl text-white">⚠️</div>
            </div>
            
            <h1 className="text-2xl font-black text-red-700 mb-2">Error de Conexión</h1>
            <p className="text-red-600 text-center mb-6 max-w-md">
              {initializationError || "No se pudo conectar con el servidor"}
            </p>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 w-full max-w-md text-xs">
              <p className="font-bold text-slate-700 mb-2">📋 Diagnóstico:</p>
              <ul className="space-y-1 text-slate-600">
                <li>• Internet: {navigator.onLine ? '✅ Conectado' : '❌ Desconectado'}</li>
                <li>• Firebase: {isFirebaseReady ? '✅ Inicializado' : '❌ No inicializado'}</li>
                <li>• Último error: {initializationError || 'Ninguno'}</li>
              </ul>
            </div>
            
            <div className="space-y-3 w-full max-w-md">
              <button 
                onClick={handleRetry}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                🔄 Reintentar Conexión
              </button>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('clot_pid');
                  setPatientId(null);
                  setInitializationError(null);
                  setView('login');
                }}
                className="w-full bg-white text-red-600 py-3 px-6 rounded-xl font-bold border border-red-200 hover:bg-red-50 transition flex items-center justify-center gap-2"
              >
                🚪 Ir a Login (Demo)
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-100 text-slate-600 py-3 px-6 rounded-xl font-bold border border-slate-200 hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                🔄 Recargar App
              </button>
            </div>
            
            <p className="text-xs text-red-400 mt-8 text-center">
              Si el problema persiste, verifica tu conexión a internet<br />
              o contacta al soporte técnico.
            </p>
          </div>
        );
      
      default:
        return (
          <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="text-6xl mb-4">❓</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Vista desconocida</h1>
            <p className="text-slate-600 mb-6">La aplicación intentó cargar una vista que no existe: <code>{view}</code></p>
            
            <div className="space-y-3 w-full max-w-md">
              <button 
                onClick={() => setView('home')}
                className="w-full bg-[#2a788e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#236777] transition"
              >
                🏠 Ir al Inicio
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="App">
      <MedicalDisclaimer />
      <ToastNotification {...toast} onClose={hideToast} />
      {renderMainContent()}
    </div>
  );
};

export default App;