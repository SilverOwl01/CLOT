// src/services/firebaseService.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseConfig, appId } from '../utils/firebaseConfig';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.storage = null;
    this.auth = null;
    this.initialized = false;
    this.initPromise = null; // Cachear la promesa de inicialización
  }

  async initialize() {
    console.log('🔥 [FirebaseService] initialize() llamado');
    
    // Si ya está inicializado, retornar inmediatamente
    if (this.initialized) {
      console.log('✅ [FirebaseService] Ya está inicializado');
      return true;
    }
    
    // Si ya se está inicializando, retornar la misma promesa
    if (this.initPromise) {
      console.log('⏳ [FirebaseService] Ya se está inicializando, esperando promesa existente...');
      return this.initPromise;
    }
    
    // Crear nueva promesa de inicialización
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🚀 [FirebaseService] Iniciando inicialización...');
        
        // 1. Inicializar la app de Firebase
        console.log('🔧 [FirebaseService] Paso 1: Inicializando app Firebase');
        this.app = initializeApp(firebaseConfig);
        console.log('✅ [FirebaseService] App Firebase inicializada');
        
        // 2. Obtener servicios
        console.log('🔧 [FirebaseService] Paso 2: Obteniendo Firestore');
        this.db = getFirestore(this.app);
        console.log('✅ [FirebaseService] Firestore obtenido');
        
        console.log('🔧 [FirebaseService] Paso 3: Obteniendo Storage');
        this.storage = getStorage(this.app);
        console.log('✅ [FirebaseService] Storage obtenido');
        
        console.log('🔧 [FirebaseService] Paso 4: Obteniendo Auth');
        this.auth = getAuth(this.app);
        console.log('✅ [FirebaseService] Auth obtenido');
        
        // 3. AUTENTICACIÓN ANÓNIMA (CRÍTICO)
        console.log('🔧 [FirebaseService] Paso 5: Autenticación anónima...');
        await signInAnonymously(this.auth);
        console.log('✅ [FirebaseService] Autenticación anónima COMPLETADA');
        
        // 4. Marcar como inicializado
        this.initialized = true;
        console.log('🎉 [FirebaseService] INICIALIZACIÓN COMPLETA EXITOSA');
        
        // 5. Resolver la promesa con TRUE
        resolve(true);
        
      } catch (error) {
        console.error('💥 [FirebaseService] ERROR en inicialización:', error);
        console.error('💥 [FirebaseService] Código de error:', error.code);
        console.error('💥 [FirebaseService] Mensaje:', error.message);
        
        // Limpiar estado en caso de error
        this.initialized = false;
        this.initPromise = null;
        
        // Rechazar la promesa
        reject(error);
      }
    });
    
    return this.initPromise;
  }

  // Método para verificar si está listo
  isReady() {
    return this.initialized && this.db !== null;
  }

  getDB() {
    if (!this.db) {
      console.warn('⚠️ [FirebaseService] getDB() llamado pero db es null');
    }
    return this.db;
  }

  getStorage() {
    if (!this.storage) {
      console.warn('⚠️ [FirebaseService] getStorage() llamado pero storage es null');
    }
    return this.storage;
  }

  getAppId() {
    return appId;
  }

  // Métodos de conveniencia para la app
  async getPatient(patientId) {
    if (!this.isReady()) {
      console.error('❌ [FirebaseService] No está listo para getPatient');
      throw new Error('Firebase no está inicializado');
    }
    
    try {
      console.log(`🔍 [FirebaseService] Buscando paciente: ${patientId}`);
      const docRef = doc(this.db, `artifacts/${appId}/public/data/patients`, patientId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const patientData = snapshot.data();
        console.log(`✅ [FirebaseService] Paciente encontrado: ${patientData.nombre}`);
        return { id: snapshot.id, ...patientData };
      } else {
        console.log(`❌ [FirebaseService] Paciente ${patientId} no encontrado`);
        return null;
      }
    } catch (error) {
      console.error(`💥 [FirebaseService] Error en getPatient(${patientId}):`, error);
      throw error;
    }
  }

  // Suscribirse a un documento
  subscribeToDoc(path, callback) {
    if (!this.isReady()) {
      console.error('❌ [FirebaseService] No está listo para subscribeToDoc');
      return () => {}; // Retorna función vacía para unsubscribe
    }
    
    const docRef = doc(this.db, path);
    return onSnapshot(docRef, callback);
  }

  // Suscribirse a una colección
  subscribeToCollection(path, queryConstraints, callback) {
    if (!this.isReady()) {
      console.error('❌ [FirebaseService] No está listo para subscribeToCollection');
      return () => {};
    }
    
    const collectionRef = collection(this.db, path);
    const q = query(collectionRef, ...queryConstraints);
    return onSnapshot(q, callback);
  }

  // Mantener compatibilidad
  async saveINRReading(data) {
    if (!this.isReady()) throw new Error('Firebase no inicializado');
    return await addDoc(collection(this.db, `artifacts/${appId}/public/data/inr_readings`), data);
  }

  async uploadEvidence(fileBlob, patientId) {
    if (!this.isReady()) throw new Error('Firebase no inicializado');
    const fileName = `evidencias_inr/${patientId}/${Date.now()}.jpg`;
    const snapshot = await uploadBytes(ref(this.storage, fileName), fileBlob);
    return await getDownloadURL(snapshot.ref);
  }
}

// Exportar una instancia singleton
export const firebaseService = new FirebaseService();