import { useState, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { auth } from '../config/firebase'; // Tu archivo de Fase 1

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const login = async (email, password) => {
        try {
            setError('');
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email, password) => {
        try {
            setError('');
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = () => signOut(auth);

    return { user, loading, error, login, register, logout, setError };
};