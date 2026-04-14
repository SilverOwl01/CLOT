import React, { useRef, useEffect } from 'react';
import { MessageSquare, Send, Check, CheckCheck } from 'lucide-react';

const ChatBox = ({ messages, currentInput, onInputChange, onSend, chatRef }) => {
  const localChatRef = useRef(null);
  const scrollRef = chatRef || localChatRef;

  // Auto-scroll al último mensaje
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }, [messages, scrollRef]);

  // Función para formatear timestamp si existe
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
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
    <div className="flex flex-col h-[500px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header del Chat */}
      <div className="p-4 font-bold text-sm uppercase text-slate-700 border-b flex items-center gap-2 bg-white">
        <MessageSquare size={16} className="text-indigo-600" />
        <span>Chat con Paciente</span>
        <span className="ml-auto text-[10px] font-normal text-slate-400">
          {messages.length} mensajes
        </span>
      </div>
      
      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <MessageSquare size={32} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">No hay mensajes aún</p>
            <p className="text-xs">Envía un mensaje para iniciar la conversación</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div 
              key={m.id || i} 
              className={`flex ${m.sender === 'medico' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  m.sender === 'medico' 
                    ? 'bg-indigo-600 text-white rounded-br-none' // Estilo para el Doctor
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none' // Estilo para el Paciente
                }`}
              >
                {/* Contenido del mensaje */}
                {m.tipo === 'imagen' ? (
                  <img 
                    src={m.imageUrl} 
                    alt="Evidencia" 
                    className="rounded-lg max-h-40 w-full object-cover mb-2"
                    loading="lazy"
                  />
                ) : (
                  <p className="leading-relaxed break-words">{m.text}</p>
                )}
                
                {/* Footer del mensaje con timestamp y estado de lectura */}
                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                  m.sender === 'medico' ? 'text-indigo-200' : 'text-slate-400'
                }`}>
                  <span>{formatTime(m.timestamp)}</span>
                  {m.sender === 'paciente' && (
                    m.leido ? (
                      <CheckCheck size={12} className="text-emerald-400" />
                    ) : (
                      <Check size={12} />
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>
      
      {/* Input de Mensaje */}
      <div className="p-3 bg-white border-t flex gap-2 shrink-0">
        <input 
          value={currentInput} 
          onChange={e => onInputChange(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && onSend()} 
          placeholder="Escribe tu mensaje..." 
          className="flex-1 p-3 bg-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
          disabled={false} // Se puede controlar externamente si es necesario
        />
        <button 
          onClick={onSend} 
          disabled={!currentInput?.trim()}
          className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;