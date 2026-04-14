import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BASE_PATH } from '../config/constants';

export const useChat = (activePatientId) => {
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    // UNIFICACIÓN: Usamos /chats/ para coincidir con la App Móvil
    const messagesPath = `${BASE_PATH}/chats/${activePatientId}/messages`;

    useEffect(() => {
        if(!activePatientId || !db) return; 
        
        const q = query(
            collection(db, messagesPath), 
            orderBy('timestamp', 'asc')
        );

        const unsub = onSnapshot(q, (snap) => {
            // OPTIMIZACIÓN: Incluimos el ID y usamos 'estimate' para evitar parpadeos
            const msgs = snap.docs.map(d => ({
                id: d.id,
                ...d.data({ serverTimestamps: 'estimate' })
            }));
            
            setMessages(msgs);
            
            // Auto-scroll al final
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }, (error) => {
            console.error("Error en suscripción de chat Dashboard:", error);
        });
        
        return () => unsub();
    }, [activePatientId, messagesPath]);

    // Enviar mensaje unificado como 'medico'
    const sendMessage = async (text) => {
        if(!text.trim() || !activePatientId) return;
        
        try {
            await addDoc(collection(db, messagesPath), { 
                text, 
                sender: 'medico', // <--- Unificado con la App Móvil
                timestamp: serverTimestamp(),
                leido: false,
                tipo: 'texto'
            });
        } catch (error) {
            console.error("Error al enviar mensaje desde Dashboard:", error);
        }
    };

    return { messages, sendMessage, chatEndRef };
};