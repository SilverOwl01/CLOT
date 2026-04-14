import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BASE_PATH } from '../config/constants';
import { calculateRosendaal } from '../utils/clinicalMath';

// Definición de jerarquía para el Triage (Fase 3)
const SEVERITY_PRIORITY = {
    'SEVERO': 3,
    'ALERTA': 2,
    'OPTIMO': 1,
    'NORMAL': 1
};

export const usePatientsData = (user) => {
    const [patientsRaw, setPatientsRaw] = useState([]);
    const [readings, setReadings] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const unsubs = [];

        // 1. Suscripción a Pacientes
        unsubs.push(onSnapshot(collection(db, `${BASE_PATH}/patients`), (s) => 
            setPatientsRaw(s.docs.map(d => ({id: d.id, ...d.data()})))
        ));

        // 2. Suscripción a Lecturas (Sincronizado con la App Móvil)
        unsubs.push(onSnapshot(collection(db, `${BASE_PATH}/inr_readings`), (s) => {
            const rMap = {};
            s.docs.forEach(d => {
                const data = d.data();
                if(!rMap[data.patientId]) rMap[data.patientId] = [];
                rMap[data.patientId].push({ 
                    id: d.id, 
                    ...data, 
                    date: data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : new Date() 
                });
            });
            // Orden cronológico para cálculos de TTR y gráficas
            Object.keys(rMap).forEach(k => rMap[k].sort((a,b) => a.date - b.date));
            setReadings(rMap);
        }));

        // 3. Suscripción a Alertas (Para el AlertsDrawer)
        unsubs.push(onSnapshot(
            query(collection(db, `${BASE_PATH}/alerts`), orderBy('timestamp', 'desc')), 
            (s) => setAlerts(s.docs.map(d => ({id: d.id, ...d.data()})))
        ));

        setLoadingData(false);

        return () => unsubs.forEach(u => u());
    }, [user]);

    // Procesamiento y Triage de Datos
    const dashboardData = useMemo(() => {
        return patientsRaw.map(p => {
            const pReadings = readings[p.id] || [];
            // Obtenemos la última lectura para extraer síntomas y severidad
            const lastReading = pReadings[pReadings.length - 1];
            
            const ttr = calculateRosendaal(pReadings, p.objetivoINR?.[0]||2, p.objetivoINR?.[1]||3);
            const pendingReading = pReadings.find(r => r.status === 'pending');
            
            // Lógica de Semáforo visual (Compatibilidad con PatientTable)
            let sev = 'green';
            const val = lastReading?.value;
            const min = p.minTargetINR || 2.0; 
            const max = p.maxTargetINR || 3.0;
            const critLow = p.criticos?.[0] || 1.5; 
            const critHigh = p.criticos?.[1] || 5.0;
            
            if (val === undefined) sev = 'gray';
            else if (val < critLow || val > critHigh) sev = 'red';
            else if (val < min || val > max) sev = 'amber';

            // Extraemos los datos extendidos enviados desde RegistrarINRScreen.jsx
            const severityLabel = lastReading?.severityLabel || 'NORMAL';
            const latestSintomas = lastReading?.sintomas || { todoNormal: true };

            return { 
                ...p, 
                lastVal: val || 0, 
                lastDate: lastReading?.date.toLocaleDateString('es-ES') || '—', 
                sev, 
                severityLabel, // Para el Triage
                latestSintomas, // Para el Triage y visualización de badges
                history: pReadings, 
                ttr,
                latestPending: pendingReading || null
            };
        }).sort((a, b) => {
            // --- ALGORITMO DE TRIAGE CLOT ---
            
            // 1. Prioridad por Severidad Clínica (SEVERO > ALERTA > NORMAL)
            const priorityA = SEVERITY_PRIORITY[a.severityLabel] || 0;
            const priorityB = SEVERITY_PRIORITY[b.severityLabel] || 0;

            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            // 2. Prioridad por Síntomas Activos (Cualquiera que no sea "todoNormal")
            const symptomsA = a.latestSintomas && !a.latestSintomas.todoNormal ? 1 : 0;
            const symptomsB = b.latestSintomas && !b.latestSintomas.todoNormal ? 1 : 0;

            if (symptomsA !== symptomsB) {
                return symptomsB - symptomsA;
            }

            // 3. Prioridad por Pendientes de Verificación
            if (a.latestPending !== b.latestPending) {
                return a.latestPending ? -1 : 1;
            }

            // 4. Alfabético por defecto
            return a.nombre.localeCompare(b.nombre);
        });
    }, [patientsRaw, readings]);

    return { dashboardData, alerts, loadingData };
};