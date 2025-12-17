import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthState } from '@/types/finance';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        
        // Opcional: Verificar si existe en DB antes de dar luz verde
        // Esto confirma conexión con Firestore
        try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
            } else {
            }
        } catch (dbError) {
        }

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        };

        setAuthState({ user, isAuthenticated: true, isLoading: false });
      } else {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ [Login] Login exitoso en Auth.");
    } catch (e) {
        throw e;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    
    try {
      // 1. Crear Usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Actualizar DisplayName
      await updateProfile(user, { displayName });

      // 3. Crear documento en Firestore
      
      const userData = {
        uid: user.uid,
        email: email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        preferences: {
            currency: 'CLP',
            theme: 'dark'
        }
      };

      // Usamos setDoc
      await setDoc(doc(db, "users", user.uid), userData);

      // Forzar actualización estado local
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, displayName } : null
      }));

    } catch (error: any) {
      
      // Si falló la BD, cerramos la sesión creada en Auth para que no entre "roto"
      if (auth.currentUser) {
          await signOut(auth);
      }
      
      // Lanzamos el error para que el formulario lo muestre
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}