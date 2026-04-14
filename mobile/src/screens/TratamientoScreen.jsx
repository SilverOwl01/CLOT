import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bell, CheckCircle2 } from 'lucide-react';
// 1. Importa las funciones oficiales de Firestore [cite: 2]
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { firebaseService } from '../services/firebaseService';
import { TabletDisplay } from '../components/TabletView';
// Añadir al inicio del archivo
import { LocalNotifications } from '@capacitor/local-notifications';

const TratamientoScreen = ({ onBack, patientId, showToast }) => {
  const [user, setUser] = useState(null);
  const [tratamiento, setTratamiento] = useState({ dias: [] });
  const [loading, setLoading] = useState(true);
  const [reminderTime, setReminderTime] = useState(null); // Estado para la hora del recordatorio

  // Dentro de TratamientoScreen
  const [animatingIdx, setAnimatingIdx] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      // 2. Usa los métodos que SÍ existen en tu clase [cite: 146, 148]
      const db = firebaseService.getDB();
      const appId = firebaseService.getAppId();
      
      if (!db) return; // Seguridad si no ha cargado

      try {
        // 3. Usa las funciones de Firestore pasando 'db' [cite: 2, 86]
        const docRef = doc(db, `artifacts/${appId}/public/data/patients`, patientId);
        const patientSnap = await getDoc(docRef);
        
        if (patientSnap.exists()) {
          const u = patientSnap.data();
          setUser(u);
          
          const hoy = new Date();
          const mapJsToUi = [6, 0, 1, 2, 3, 4, 5]; // Ajuste Lunes-Domingo [cite: 68]
          const hoyUiIndex = mapJsToUi[hoy.getDay()];
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - hoyUiIndex);

          const diasNombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
          const keysDosis = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
          const nuevosDias = [];

          for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(inicioSemana);
            fechaDia.setDate(inicioSemana.getDate() + i);
            const fechaStr = fechaDia.toISOString().split('T')[0];

            // Consultar log usando las funciones directas [cite: 74, 75]
            const logRef = doc(db, `artifacts/${appId}/public/data/patients/${patientId}/dosis_logs`, fechaStr);
            const logSnap = await getDoc(logRef);

            nuevosDias.push({
              nombre: diasNombres[i],
              dosis: u.weeklyDose?.[keysDosis[i]] || 0,
              fechaStr,
              esHoy: i === hoyUiIndex,
              tomada: logSnap.exists() ? logSnap.data().tomada : false
            });
          }
          setTratamiento({ dias: nuevosDias });
        }
      } catch (error) {
        console.error("Error cargando tratamiento:", error);
        showToast("Error al cargar tratamiento", "error");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [patientId]);

  // Dentro del componente TratamientoScreen
  const scheduleRepeatingReminder = async (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    try {
      // 1. Verificar y solicitar permisos de notificación [cite: 4, 65]
      const status = await LocalNotifications.requestPermissions();
      if (status.display !== 'granted') {
        showToast("Se requieren permisos para las alertas", "error");
        return;
      }

      // 2. Limpiar cualquier recordatorio previo con el ID 1 para evitar duplicados 
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

      // 3. Programar la notificación RECURRENTE 
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Momento de tu dosis 💊",
            body: `Recuerda tomar tu ${user?.medicamento || 'medicamento'} hoy.`,
            id: 1,
            schedule: { 
              on: { 
                hour: hours, 
                minute: minutes 
              },
              repeats: true, // Esto hace que suene TODOS los días a la misma hora 
              allowWhileIdle: true // Importante para que suene aunque el cel esté en reposo 
            },
            sound: 'beep.wav', // Puedes usar el sonido por defecto o uno personalizado 
            actionTypeId: "",
            extra: null
          }
        ]
      });

      setReminderTime(timeString);
      showToast(`Recordatorio diario fijado a las ${timeString}`, "success");
    } catch (error) {
      console.error("Error programando:", error);
      showToast("No se pudo programar la alerta", "error");
    }
  };

  const toggleDosis = async (index) => {
    const dia = tratamiento.dias[index];
    const hoy = new Date().toISOString().split('T')[0];

    if (dia.fechaStr > hoy) {
      showToast("No puedes registrar tomas futuras", "error");
      return;
    }

    const nuevoEstado = !dia.tomada;

    if (nuevoEstado) {
      setAnimatingIdx(index); // Activamos la animación
      setTimeout(() => setAnimatingIdx(null), 1000); // La quitamos tras 1s
    }

    const db = firebaseService.getDB();
    const appId = firebaseService.getAppId();

    try {
      const logRef = doc(db, `artifacts/${appId}/public/data/patients/${patientId}/dosis_logs`, dia.fechaStr);
      await setDoc(logRef, {
        tomada: nuevoEstado,
        dosis: dia.dosis,
        timestamp: serverTimestamp(),
        fecha: dia.fechaStr,
        patientId: patientId,
        medicamento: user?.medicamento || "Anticoagulante"
      }, { merge: true });

      // Actualizar UI
      const nuevosDias = [...tratamiento.dias];
      nuevosDias[index].tomada = nuevoEstado;
      setTratamiento({ dias: nuevosDias });

      if (nuevoEstado) showToast("¡Dosis registrada con éxito!", "success");
      else showToast("Dosis desmarcada", "info");
    } catch (e) {
      console.error("Error al guardar dosis:", e);
      showToast("Error al guardar", "error");
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 bg-[#2a788e] rounded-2xl flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="text-xl">💊</div>
            </div>
          </div>
          <div className="absolute inset-0 border-4 border-[#2a788e] border-t-transparent rounded-2xl animate-spin"></div>
        </div>
        <p className="text-slate-600 font-medium">Cargando tratamiento...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
          <ChevronLeft />
        </button>
        <div>
          <span className="font-bold text-lg text-slate-800 block">Mi Tratamiento</span>
          <span className="text-xs text-[#2a788e] font-medium uppercase tracking-wider">
            {user?.medicamento} ({user?.tabletSize || 5}mg)
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Sección de Recordatorio */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-slate-800">Esta Semana</h2>
          
          <div className="relative">
            {/* Input nativo oculto para abrir el selector de hora del teléfono */}
            <input 
              type="time" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={(e) => scheduleRepeatingReminder(e.target.value)}
            />
            <button className="flex items-center gap-2 text-[#2e7d8f] font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 z-10 relative">
              <Bell size={16} /> 
              <span>{reminderTime || "Programar"}</span>
            </button>
          </div>
        </div>

        {tratamiento.dias.map((dia, idx) => (
          <div 
            key={idx} 
            onClick={() => toggleDosis(idx)}
            className={`relative mb-4 p-5 rounded-[2.5rem] border-2 transition-all duration-500 flex items-center justify-between
              ${dia.tomada ? 'bg-green-50 border-green-200 scale-[0.98]' : 'bg-white border-slate-100 shadow-sm'}
              ${animatingIdx === idx ? 'animate-ping-once ring-4 ring-green-400/30' : ''}`}
          >
            {/* Efecto de partículas (CSS simple para simular éxito) */}
            {animatingIdx === idx && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-particle-1" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-particle-2" />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-particle-3" />
              </div>
            )}

            <div className={dia.tomada ? 'opacity-40' : ''}>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${dia.tomada ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                  {dia.nombre}
                </span>
                {dia.esHoy && <span className="text-[10px] bg-[#2a788e] text-white px-3 py-1 rounded-full font-black shadow-sm">HOY</span>}
              </div>
              <div className="text-slate-500 font-bold text-sm mt-1">{dia.dosis} mg</div>
            </div>

            <div className="flex items-center gap-3">
              {!dia.tomada ? (
                <TabletDisplay dosis={dia.dosis} tabletSize={user?.tabletSize || 5} />
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg shadow-green-200 animate-bounce-in">
                  <CheckCircle2 className="text-white" size={24} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Información adicional */}
        {user && (
          <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Información del Tratamiento</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Dosis semanal total:</span>
                <span className="font-bold text-[#2a788e]">
                  {tratamiento.dias.reduce((sum, dia) => sum + (dia.dosis || 0), 0)} mg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Días con medicación:</span>
                <span className="font-bold text-[#2a788e]">
                  {tratamiento.dias.filter(dia => dia.dosis > 0).length} días
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dosis marcadas:</span>
                <span className="font-bold text-green-600">
                  {tratamiento.dias.filter(dia => dia.tomada).length} de {tratamiento.dias.filter(dia => dia.dosis > 0).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TratamientoScreen;