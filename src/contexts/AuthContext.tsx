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
    console.log("👀 [AuthContext] Suscribiéndose a cambios de Auth...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("👤 [AuthContext] Usuario detectado en Auth:", firebaseUser.email, "| UID:", firebaseUser.uid);
        
        // Opcional: Verificar si existe en DB antes de dar luz verde
        // Esto confirma conexión con Firestore
        try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                console.log("📚 [AuthContext] Datos de usuario encontrados en Firestore.");
            } else {
                console.warn("⚠️ [AuthContext] Usuario en Auth PERO sin datos en Firestore (Posible error en registro previo).");
            }
        } catch (dbError) {
            console.error("❌ [AuthContext] Error intentando leer de Firestore:", dbError);
        }

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        };

        setAuthState({ user, isAuthenticated: true, isLoading: false });
      } else {
        console.log("⚪ [AuthContext] No hay sesión activa.");
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log("🔑 [Login] Intentando login con:", email);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ [Login] Login exitoso en Auth.");
    } catch (e) {
        console.error("❌ [Login] Error:", e);
        throw e;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    console.log("📝 [Register] Iniciando proceso para:", email);
    
    try {
      // 1. Crear Usuario en Auth
      console.log("📝 [Register] Paso 1: Creando usuario en Firebase Auth...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ [Register] Usuario creado. UID:", user.uid);
      
      // 2. Actualizar DisplayName
      console.log("📝 [Register] Paso 2: Actualizando perfil...");
      await updateProfile(user, { displayName });
      console.log("✅ [Register] Perfil actualizado.");

      // 3. Crear documento en Firestore
      console.log("📝 [Register] Paso 3: Guardando datos en Firestore (users collection)...");
      
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
      console.log("📝 [Register] Datos a escribir:", userData);

      // Usamos setDoc
      await setDoc(doc(db, "users", user.uid), userData);
      console.log("✅ [Register] ¡Escritura en BD exitosa!");

      // Forzar actualización estado local
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, displayName } : null
      }));

    } catch (error: any) {
      console.error("❌ [Register] FALLÓ EL PROCESO:", error);
      
      // Si falló la BD, cerramos la sesión creada en Auth para que no entre "roto"
      if (auth.currentUser) {
          console.warn("⚠️ [Register] Cerrando sesión debido al error en registro...");
          await signOut(auth);
      }
      
      // Lanzamos el error para que el formulario lo muestre
      throw error;
    }
  };

  const logout = async () => {
    console.log("👋 [Logout] Cerrando sesión...");
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