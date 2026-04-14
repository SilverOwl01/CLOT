import { doc, setDoc, updateDoc, addDoc, deleteDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { APP_ID, BASE_PATH } from '../config/constants';
import { CLINICAL_RANGES } from '../utils/clinicalMath';

export const usePatientActions = (user) => {

    const createPatient = async (newPat) => {
        try {
            // --- CÁLCULO DE EDAD AUTOMÁTICO ---
            const birthDate = new Date(newPat.fechaNacimiento);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            // ----------------------------------

            const docRef = doc(db, `${BASE_PATH}/patients`, newPat.exp.trim());
            
            await setDoc(docRef, {
                nombre: newPat.nombre,
                expediente: newPat.exp.trim(),
                
                // Guardamos AMBOS datos
                fechaNacimiento: newPat.fechaNacimiento, // "YYYY-MM-DD"
                edad: age, // Guardamos la edad calculada para que la tabla no se rompa
                
                telefono: newPat.telefono,
                medicamento: newPat.medicamento,
                tabletSize: parseFloat(newPat.tabletSize),
                inicioTratamiento: newPat.inicio,
                patologiaCode: newPat.patologia,
                motivo: CLINICAL_RANGES[newPat.patologia].label,
                minTargetINR: parseFloat(newPat.min), 
                maxTargetINR: parseFloat(newPat.max), 
                objetivoINR: [parseFloat(newPat.min), parseFloat(newPat.max)],
                criticos: [parseFloat(newPat.crit_low), parseFloat(newPat.crit_high)],
                weeklyDose: { L:0, M:0, X:0, J:0, V:0, S:0, D:0 },
                createdAt: serverTimestamp()
            });
            alert(`Paciente registrado correctamente (Edad calculada: ${age} años).`);
            return true;
        } catch (e) { 
            alert("Error: " + e.message); 
            return false;
        }
    };

    const updateDose = async (patientId, weeklyDose) => {
        try {
            await updateDoc(doc(db, `${BASE_PATH}/patients`, patientId), { weeklyDose });
            await addDoc(collection(db, `${BASE_PATH}/patients/${patientId}/messages`), { 
                text: "El doctor ha actualizado tu esquema de medicación.", 
                sender: 'doctor', timestamp: serverTimestamp() 
            });
            alert("Esquema actualizado.");
        } catch(e) { alert("Error al guardar: " + e.message); }
    };

    const setFollowUpDate = async (patientId, dateStr) => {
        try {
            const nextDateTimestamp = new Date(dateStr);
            nextDateTimestamp.setHours(9,0,0,0);
            
            await updateDoc(doc(db, `${BASE_PATH}/patients`, patientId), { nextReadingDate: nextDateTimestamp });
            await setDoc(doc(db, `artifacts/${APP_ID}/public/data/patient_tasks`, patientId), {
                patientId: patientId, type: 'INR_FOLLOW_UP', dueDate: nextDateTimestamp, status: 'ACTIVE', assignedBy: user.email, assignedAt: serverTimestamp()
            }, { merge: true });
            
            await addDoc(collection(db, `${BASE_PATH}/patients/${patientId}/messages`), { 
                text: `📅 Próximo control agendado para el ${nextDateTimestamp.toLocaleDateString()}.`, 
                sender: 'doctor', timestamp: serverTimestamp() 
            });
            alert(`Próxima toma asignada.`);
        } catch (e) { alert("Error: " + e.message); }
    };

    const verifyReading = async (patientId, reading, action, reason = '') => {
        try {
            const readingDocRef = doc(db, `${BASE_PATH}/inr_readings`, reading.id);
            if (action === 'ACCEPT') {
                await updateDoc(readingDocRef, {
                    status: 'reviewed', verificationStatus: 'VERIFIED', verifiedBy: user.email, verifiedAt: serverTimestamp(), finalINR: reading.value,
                });

                const updatePayload = { lastVal: reading.value, lastDate: new Date().toLocaleDateString('es-ES') };
                
                // Lógica de aceptar fecha sugerida [cite: 65-67]
                if (reading.suggestedNextDate) {
                    const suggested = reading.suggestedNextDate.seconds ? new Date(reading.suggestedNextDate.seconds * 1000) : new Date(reading.suggestedNextDate);
                    updatePayload.nextReadingDate = suggested;
                }

                await updateDoc(doc(db, `${BASE_PATH}/patients`, patientId), updatePayload);
                await addDoc(collection(db, `${BASE_PATH}/patients/${patientId}/messages`), { 
                    text: `✅ Lectura de INR ${reading.value} confirmada.`, sender: 'doctor', timestamp: serverTimestamp() 
                });
                alert("Lectura confirmada.");
                return true;

            } else if (action === 'REJECT') {
                await updateDoc(readingDocRef, {
                    status: 'rejected', verificationStatus: 'REJECTED', verifiedBy: user.email, verifiedAt: serverTimestamp(), rejectionReason: reason
                });
                await addDoc(collection(db, `${BASE_PATH}/patients/${patientId}/messages`), { 
                    text: `⚠️ Lectura rechazada. Motivo: "${reason}".`, sender: 'doctor', timestamp: serverTimestamp() 
                });
                alert("Lectura rechazada.");
                return true;
            }
        } catch (e) { alert("Error: " + e.message); return false; }
    };

    // --- FUNCIÓN: Borrar una alerta específica ---
    const dismissAlert = async (alertId) => {
        try {
            await deleteDoc(doc(db, `${BASE_PATH}/alerts`, alertId));
        } catch (e) { console.error("Error borrando alerta:", e); }
    };

    // --- FUNCIÓN: Borrar TODAS las alertas (Limpieza total) ---
    const clearAllAlerts = async (alerts) => {
        try {
            const batch = writeBatch(db);
            alerts.forEach(alert => {
                const ref = doc(db, `${BASE_PATH}/alerts`, alert.id);
                batch.delete(ref);
            });
            await batch.commit();
        } catch (e) { alert("Error limpiando alertas: " + e.message); }
    };

    // --- NUEVA FUNCIÓN: ELIMINAR PACIENTE ---
    const deletePatient = async (patientId) => {
        // 1. Confirmación de Seguridad - PRIMERA ADVERTENCIA
        if (!window.confirm("⛔ ¿ESTÁS SEGURO?\n\nEsta acción borrará al paciente y su historial de la lista.\nNo se puede deshacer.")) {
            return false;
        }

        // 2. Confirmación de Seguridad - SEGUNDA ADVERTENCIA MÁS EXPLÍCITA
        if (!window.confirm("⛔⛔ CONFIRMACIÓN FINAL ⛔⛔\n\n¿REALMENTE deseas ELIMINAR PERMANENTEMENTE a este paciente?\n\n• Se borrarán todos los datos del paciente\n• Las lecturas anteriores quedarán huérfanas\n• Esta acción NO se puede deshacer\n\nEscribe 'ELIMINAR' para confirmar:")) {
            return false;
        }

        try {
            // 3. Borrar el documento del paciente
            // Nota: En Firestore, las subcolecciones (mensajes, lecturas) quedan huérfanas pero ya no aparecen en la app.
            // Para un borrado profundo real se requeriría una Cloud Function, pero esto funciona para el dashboard.
            await deleteDoc(doc(db, `${BASE_PATH}/patients`, patientId));
            
            // 4. Opcional: También borrar tareas asociadas si existen
            try {
                await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/patient_tasks`, patientId));
            } catch (taskError) {
                // Silencioso - puede que no exista la tarea
                console.log("No se encontró tarea asociada para borrar");
            }
            
            alert("✅ Paciente eliminado correctamente.");
            return true;
        } catch (e) {
            console.error("Error al eliminar paciente:", e);
            alert(`❌ Error al eliminar paciente: ${e.message}`);
            return false;
        }
    };

    return { 
        createPatient, 
        updateDose, 
        setFollowUpDate, 
        verifyReading, 
        dismissAlert, 
        clearAllAlerts,
        deletePatient // <--- Exportada
    };
};