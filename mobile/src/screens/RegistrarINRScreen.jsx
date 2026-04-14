import React, { useState } from 'react';
import { ChevronLeft, Camera, Send, CheckCircle, AlertTriangle, AlertOctagon, Droplet } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const RegistrarINRScreen = ({ onBack, patientId, userConfig, showToast }) => {
  const [inrValue, setInrValue] = useState('');
  const [fotoUri, setFotoUri] = useState(null);
  const [fotoBlob, setFotoBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [sintomas, setSintomas] = useState({
    sangrado: false, moretones: false, dolorCabeza: false,
    sangreOrina: false, sangreNariz: false, menstruacion: false,
    todoNormal: true
  });

  // --- LÓGICA DE LOS 3 NIVELES (SEMÁFORO) ---
  const min = userConfig?.minTargetINR || 2.0;
  const max = userConfig?.maxTargetINR || 3.0;
  const valNum = parseFloat(inrValue);

  // Definimos los márgenes para la "Zona Amarilla"
  const margenAlto = 1.0; 
  const margenBajo = 0.5;

  const getStatus = () => {
    if (!inrValue) return 'NEUTRAL';
    if (valNum >= min && valNum <= max) return 'OPTIMO';
    
    // Lógica Amarilla (Fuera de rango pero no severo)
    if ((valNum > max && valNum <= (max + margenAlto)) || 
        (valNum < min && valNum >= (min - margenBajo))) {
      return 'ALERTA';
    }
    
    // Lógica Roja (Severo)
    return 'SEVERO';
  };

  const status = getStatus(); // Calculamos el estado actual

  // Colores dinámicos según los 3 estados
  const getThemeColors = () => {
    switch (status) {
      case 'OPTIMO': return { 
        bg: 'bg-emerald-500', 
        text: 'text-emerald-500', 
        light: 'bg-emerald-50', 
        ring: 'ring-emerald-200',
        iconColor: 'text-emerald-600'
      };
      case 'ALERTA': return { 
        bg: 'bg-amber-400', 
        text: 'text-amber-500', 
        light: 'bg-amber-50', 
        ring: 'ring-amber-200',
        iconColor: 'text-amber-600'
      };
      case 'SEVERO': return { 
        bg: 'bg-rose-600', 
        text: 'text-rose-600', 
        light: 'bg-rose-50', 
        ring: 'ring-rose-200',
        iconColor: 'text-rose-600'
      };
      default: return { 
        bg: 'bg-slate-50', 
        text: 'text-slate-300', 
        light: 'bg-slate-50', 
        ring: 'ring-slate-200',
        iconColor: 'text-slate-400'
      };
    }
  };
  
  const theme = getThemeColors();
  const esMujer = userConfig?.genero === 'Femenino' || userConfig?.genero === 'Mujer';

  // --- FIN LÓGICA SEMÁFORO ---

  const tomarFoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({ 
        quality: 80, 
        allowEditing: false, 
        resultType: CameraResultType.Uri, 
        source: CameraSource.Prompt 
      });
      setFotoUri(image.webPath);
      const response = await fetch(image.webPath);
      setFotoBlob(await response.blob());
    } catch (error) {
      // Usuario canceló o error - no mostrar toast para cancelación
      console.log('Foto cancelada o error:', error);
    }
  };

  // ✅ GUARDAR REGISTRO CON ESTANDARIZACIÓN CLÍNICA
  const guardarRegistro = async () => {
    if (!inrValue || !fotoBlob) { 
      showToast("Faltan datos o foto", "error"); 
      return; 
    }
    if (valNum > 10) { 
      showToast("Valor demasiado alto. Verifica.", "error"); 
      return; 
    }

    setLoading(true);
    try {
      const db = firebaseService.getDB();
      const storage = firebaseService.getStorage();
      // 💡 Forzamos el ID real para evitar errores de variable
      const appId = "clot-app-produccion";

      const fileName = `evidencias_inr/${patientId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, fotoBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Determinar severidad para la alerta médica
      const haySangrado = sintomas.sangreOrina || sintomas.sangreNariz || sintomas.sangrado;
      let severidadAlerta = 'info';
      if (status === 'ALERTA') severidadAlerta = 'medio';
      if (status === 'SEVERO' || haySangrado) severidadAlerta = 'urgente';

      // ✅ 1. Guardamos el objeto con campos duplicados temporalmente para compatibilidad
      const dataToSave = {
        patientId,
        value: valNum,        // Campo estándar para gráficas
        finalINR: valNum,     // Campo para compatibilidad con registros previos
        timestamp: serverTimestamp(), 
        evidenciaUrl: downloadUrl,
        sintomas,
        status: 'pending',    // Pendiente de revisión médica
        severityLabel: status, // OPTIMO, ALERTA, SEVERO
        verificationStatus: "UNVERIFIED", // Nuevo registro empieza sin verificar
        // Campos adicionales para contexto
        fechaRegistro: new Date().toISOString(),
        dispositivo: 'mobile'
      };

      // ✅ 2. Referencia a la colección (Ruta idéntica a ProgresoScreen)
      await addDoc(collection(db, `artifacts/${appId}/public/data/inr_readings`), dataToSave);

      // ✅ 3. Sistema de Alertas (Solo si es necesario)
      if (status !== 'OPTIMO' || haySangrado) {
        await addDoc(collection(db, `artifacts/${appId}/public/data/alerts`), {
          patientId,
          severity: severidadAlerta,
          timestamp: serverTimestamp(),
          message: `INR ${valNum} (${status}) - ${haySangrado ? 'CON SÍNTOMAS' : 'Asintomático'}`,
          read: false,
          tipo: 'inr_alerta'
        });
      }

      setStep(3); 
    } catch (error) { 
      console.error("💥 Error al guardar registro INR:", error);
      showToast("Error de conexión con el servidor", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleSintoma = (key) => {
    setSintomas(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      if (newState[key]) newState.todoNormal = false;
      return newState;
    });
  };

  return (
    <div className={`h-screen transition-colors duration-700 flex flex-col ${status === 'NEUTRAL' ? 'bg-slate-200' : theme.bg}`}>
      
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 bg-white/20 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition-all">
          <ChevronLeft size={24} />
        </button>
        <span className="text-white font-bold tracking-wide opacity-90">Reportar INR</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-2xl overflow-y-auto">
        {step === 1 && (
          <div className="animate-fade-in flex flex-col h-full">
            <h2 className="font-bold uppercase tracking-widest text-xs mb-2 text-center text-slate-400">
              Ingresa tu valor
            </h2>
            
            {/* Input Gigante - SOLO NÚMERO */}
            <div className="flex flex-col items-center justify-center mb-8">
              <input 
                type="number" 
                step="0.1" 
                value={inrValue} 
                onChange={(e) => setInrValue(e.target.value)}
                placeholder="0.0"
                className={`text-8xl font-black text-center w-full outline-none bg-transparent transition-colors duration-500 ${!inrValue ? 'text-slate-200' : theme.text}`}
              />
            </div>

            {/* Botón de Foto */}
            <button 
              onClick={tomarFoto} 
              className={`w-full h-40 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center transition-all mb-4 ${fotoUri ? `${theme.light} ${theme.text} border-current` : 'border-slate-200 bg-slate-50'}`}
            >
              {fotoUri ? (
                <div className="relative w-full h-full">
                  <img src={fotoUri} alt="Evidencia" className="w-full h-full object-cover rounded-[2.2rem]" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[2.2rem]">
                    <span className="text-white font-bold flex items-center gap-2">
                      <CheckCircle size={16}/> Foto lista
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Camera size={40} className="text-slate-300 mb-2" />
                  <span className="text-slate-400 font-bold text-sm">Foto de evidencia</span>
                </>
              )}
            </button>

            <div className="mt-auto">
              <button 
                disabled={!inrValue || !fotoUri} 
                onClick={() => setStep(2)} 
                className="w-full py-5 bg-[#2a788e] text-white rounded-2xl font-bold text-xl shadow-lg disabled:opacity-30 active:scale-95 transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in pb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">Revisión de síntomas</h2>
              <p className="text-slate-500 text-sm">Completa esta breve revisión</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mb-8">
              <SintomaBtn 
                label="Sangrado de encías" 
                icon="🦷" 
                active={sintomas.sangrado} 
                onClick={() => toggleSintoma('sangrado')} 
                colorClass={theme.text} 
              />
              <SintomaBtn 
                label="Moretones nuevos" 
                icon="🩹" 
                active={sintomas.moretones} 
                onClick={() => toggleSintoma('moretones')} 
                colorClass={theme.text} 
              />
              <SintomaBtn 
                label="Sangrado de nariz" 
                icon="🩸" 
                active={sintomas.sangreNariz} 
                onClick={() => toggleSintoma('sangreNariz')} 
                colorClass={theme.text} 
              />
              <SintomaBtn 
                label="Orina/Heces oscuras" 
                icon="🚽" 
                active={sintomas.sangreOrina} 
                onClick={() => toggleSintoma('sangreOrina')} 
                colorClass={theme.text} 
              />
              {esMujer && (
                <SintomaBtn 
                  label="Menstruación abundante" 
                  icon="🌸" 
                  active={sintomas.menstruacion} 
                  onClick={() => toggleSintoma('menstruacion')} 
                  colorClass={theme.text} 
                />
              )}
              <SintomaBtn 
                label="Todo normal" 
                icon="✅" 
                active={sintomas.todoNormal} 
                onClick={() => setSintomas({
                  sangrado: false, 
                  moretones: false, 
                  dolorCabeza: false, 
                  sangreOrina: false, 
                  sangreNariz: false, 
                  menstruacion: false, 
                  todoNormal: true
                })} 
                isPositive={true} 
              />
            </div>

            <button 
              disabled={loading} 
              onClick={guardarRegistro} 
              className="w-full py-5 bg-[#2a788e] text-white rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <><Send size={20}/> Enviar Reporte</>
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-bounce-in text-center py-10">
            {/* Icono final dinámico */}
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 ${theme.light} ${theme.iconColor}`}>
              {status === 'OPTIMO' && <CheckCircle size={56}/>}
              {status === 'ALERTA' && <AlertTriangle size={56}/>}
              {status === 'SEVERO' && <AlertOctagon size={56}/>}
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-4">
              {status === 'OPTIMO' ? "¡Reporte completado!" : "Reporte recibido"}
            </h2>
            
            <div className="bg-slate-50 p-4 rounded-2xl mb-8 text-left">
              <p className="text-slate-600 text-lg leading-relaxed">
                {status === 'OPTIMO' && "Tu valor está dentro del rango establecido. Tu médico revisará esta información."}
                {status === 'ALERTA' && "Tu médico revisará este valor y te contactará si es necesario algún ajuste."}
                {status === 'SEVERO' && "Tu médico ha sido notificado y revisará este valor pronto para darte indicaciones."}
              </p>
            </div>

            <button onClick={onBack} className="w-full py-5 bg-slate-800 text-white rounded-2xl font-bold text-lg">
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Botón auxiliar actualizado
const SintomaBtn = ({ label, icon, active, onClick, isPositive }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left
      ${active 
        ? (isPositive ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-rose-400 bg-rose-50 ring-2 ring-rose-200') 
        : 'border-slate-100 bg-white hover:bg-slate-50'}`}
  >
    <span className="text-2xl w-8 text-center">{icon}</span>
    <span className={`font-bold text-sm ${active ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
    {active && <div className={`ml-auto w-3 h-3 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />}
  </button>
);

export default RegistrarINRScreen;