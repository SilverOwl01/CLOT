import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, Send, Camera, Clock, Check, CheckCheck, Image as ImageIcon } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera as CapacitorCamera, CameraResultType } from '@capacitor/camera';

const ChatScreen = ({ onBack, patientId, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBusinessHours, setIsBusinessHours] = useState(false);
  const scrollRef = useRef(null);
  const processedMessagesRef = useRef(new Set()); // Para evitar procesamiento duplicado

  const db = firebaseService.getDB();
  const appId = firebaseService.getAppId();
  
  // FIX: Usar useMemo para evitar recrear messagesPath innecesariamente
  const messagesPath = useMemo(() => 
    `artifacts/${appId}/public/data/chats/${patientId}/messages`,
    [appId, patientId]
  );

  // 1. Lógica de Horario (8:00 - 14:00)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsBusinessHours(hour >= 8 && hour < 14);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. Escuchar mensajes en tiempo real y marcar como leídos (VERSIÓN FINAL OPTIMIZADA)
  useEffect(() => {
    if (!db || !messagesPath) return;

    const q = query(collection(db, messagesPath), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Procesar mensajes con timestamps estimados
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data({ serverTimestamps: 'estimate' }) 
      }));
      
      setMessages(msgs);
      
      // Scroll automático suave
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // FIX: Marcar como leído solo mensajes nuevos del médico que no hayan sido procesados
      snapshot.docChanges().forEach((change) => {
        // Solo procesar mensajes añadidos (no modificados)
        if (change.type !== "added") return;
        
        const data = change.doc.data();
        const docId = change.doc.id;
        
        // Verificar si ya procesamos este mensaje
        if (processedMessagesRef.current.has(docId)) return;
        
        // Marcar como procesado temporalmente
        processedMessagesRef.current.add(docId);
        
        // Si es mensaje del médico y no está leído, marcarlo como leído
        if (data.sender === 'medico' && !data.leido) {
          // Actualizar en Firestore sin esperar respuesta
          updateDoc(doc(db, messagesPath, docId), { leido: true })
            .catch(error => {
              console.error("Error marcando mensaje como leído:", error);
              // Si hay error, remover del set para permitir reintento
              processedMessagesRef.current.delete(docId);
            });
        }
      });
    }, (error) => {
      console.error("Error en onSnapshot:", error);
      showToast("Error en la conexión del chat", "error");
    });

    // Limpiar el Set cuando cambia el paciente
    return () => {
      unsubscribe();
      processedMessagesRef.current.clear();
    };
  }, [patientId, db, messagesPath, showToast]); // Dependencias corregidas

  const enviarMensaje = async (tipo = 'texto', content = null) => {
    if (tipo === 'texto' && !inputText.trim()) return;
    
    const textToSend = inputText;
    setInputText('');

    // Optimistic update opcional
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: tipo === 'texto' ? textToSend : '',
      imageUrl: tipo === 'imagen' ? content : '',
      sender: 'paciente',
      timestamp: new Date(), // Fecha local temporal
      leido: false,
      tipo: tipo
    };
    
    setMessages(prev => [...prev, tempMessage]);

    try {
      await addDoc(collection(db, messagesPath), {
        text: tipo === 'texto' ? textToSend : '',
        imageUrl: tipo === 'imagen' ? content : '',
        sender: 'paciente',
        timestamp: serverTimestamp(),
        leido: false,
        tipo: tipo
      });
      
      // Remover mensaje temporal (el snapshot real lo reemplazará)
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
    } catch (error) {
      // Revertir optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showToast("Error al enviar mensaje", "error");
    }
  };

  const enviarFoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 70,
        resultType: CameraResultType.Uri,
        allowEditing: false
      });
      
      if (!image.webPath) {
        throw new Error('No se pudo obtener la imagen');
      }

      setLoading(true);
      
      // FIX: Manejo correcto de blob y limpieza
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      const storage = firebaseService.getStorage();
      const fileName = `chats/${patientId}/${Date.now()}.jpg`;
      const fileRef = ref(storage, fileName);
      
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      
      await enviarMensaje('imagen', url);
      
    } catch (e) {
      // FIX: Detección más robusta de cancelación
      if (e.message && (
          e.message.includes('cancel') || 
          e.message.includes('User cancelled') ||
          e.code === 'USER_CANCELLED'
      )) {
        // Usuario canceló, no mostrar error
        console.log('Foto cancelada por el usuario');
      } else {
        console.error('Error al tomar foto:', e);
        showToast("Error al tomar foto", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para formatear timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Si es un objeto Firestore Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      // Si es un Date object (para optimistic updates)
      if (timestamp instanceof Date) {
        return timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header con Estado de Horario */}
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-1 -ml-2 active:opacity-50"
            aria-label="Volver"
          >
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="font-black text-xl text-slate-800">Dr. de Turno</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isBusinessHours ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isBusinessHours ? 'En línea (8:00 - 14:00)' : 'Consultorio Cerrado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!isBusinessHours && messages.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 mb-6">
            <Clock className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-700 font-medium">
              Estamos fuera de horario laboral. Puedes dejar tu duda y el médico te responderá a partir de las 8:00 AM.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.sender === 'paciente' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${
              m.sender === 'paciente' 
                ? 'bg-[#2a788e] text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            } ${m.id?.startsWith('temp-') ? 'opacity-70' : ''}`}>
              
              {m.tipo === 'imagen' ? (
                <img 
                  src={m.imageUrl} 
                  alt="Evidencia" 
                  className="rounded-xl max-h-60 w-full object-cover mb-1"
                  loading="lazy"
                />
              ) : (
                <p className="text-sm font-medium leading-relaxed break-words">{m.text}</p>
              )}
              
              <div className={`flex items-center justify-end gap-1 mt-1 ${
                m.sender === 'paciente' ? 'text-white/60' : 'text-slate-400'
              }`}>
                <span className="text-[9px] font-bold">
                  {formatTime(m.timestamp)}
                </span>
                {m.sender === 'paciente' && (
                  m.leido ? (
                    <CheckCheck size={12} className="text-emerald-300" />
                  ) : (
                    <Check size={12} />
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input de Mensaje */}
      <div className="p-6 bg-white border-t border-slate-100 flex items-center gap-3">
        <button 
          onClick={enviarFoto}
          disabled={loading}
          className="p-3 bg-slate-100 rounded-2xl text-slate-500 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          aria-label="Tomar foto"
        >
          <Camera size={24} />
        </button>
        
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#2a788e]/20"
          onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
          disabled={loading}
        />

        <button 
          onClick={() => enviarMensaje()}
          disabled={!inputText.trim() || loading}
          className="p-4 bg-[#2a788e] text-white rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-30 active:scale-95 transition-all disabled:active:scale-100"
          aria-label="Enviar mensaje"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;