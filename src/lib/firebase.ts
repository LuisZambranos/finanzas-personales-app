import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.log("🔥 [Firebase] Inicializando módulos...");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log de seguridad (ocultamos la mitad de la key para verificar sin exponer todo)
console.log("🔥 [Firebase] Config Project ID:", firebaseConfig.projectId);
console.log("🔥 [Firebase] API Key cargada:", firebaseConfig.apiKey ? "SÍ (Empieza con " + firebaseConfig.apiKey.substring(0, 5) + "...)" : "NO");

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 [Firebase] Instancias exportadas correctamente.");