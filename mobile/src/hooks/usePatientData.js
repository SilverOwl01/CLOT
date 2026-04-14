// src/hooks/usePatientData.js
import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';

const usePatientData = (patientId) => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [proximaCita, setProximaCita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !firebaseService.db) return;

    setLoading(true);
    const appId = firebaseService.getAppId();
    
    // Listener para datos del paciente
    const unsubUser = onSnapshot(
      doc(firebaseService.db, `artifacts/${appId}/public/data/patients`, patientId), 
      (snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          setUser({ id: snap.id, ...userData });
          if (userData.nextReadingDate) {
            setProximaCita(userData.nextReadingDate.toDate());
          }
        }
      }
    );

    // Listener para historial INR
    const unsubHist = onSnapshot(
      query(collection(firebaseService.db, `artifacts/${appId}/public/data/inr_readings`), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const allReadings = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
        const patientReadings = allReadings.filter(d => d.patientId === patientId);
        setHistory(patientReadings);
        setLoading(false);
      }
    );

    return () => {
      unsubUser();
      unsubHist();
    };
  }, [patientId]);

  return { user, history, proximaCita, loading };
};

export default usePatientData;