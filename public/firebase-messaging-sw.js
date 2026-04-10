// public/firebase-messaging-sw.js

// Importamos los scripts base de Firebase compatibles con Service Workers
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Tu configuración exacta de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4TGfj-HCeI2G5VoWys8XShCJ5Wgfug68",
  authDomain: "finax-app-1e2ee.firebaseapp.com",
  projectId: "finax-app-1e2ee",
  storageBucket: "finax-app-1e2ee.firebasestorage.app",
  messagingSenderId: "71618448588",
  appId: "1:71618448588:web:d62212ed60bd501c700669"
};

// Inicializamos Firebase en segundo plano
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Esta función escucha en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano.', payload);
  // Eliminamos el self.registration.showNotification porque 
  // Firebase ya lanza la alerta visual automáticamente por nosotros
  // al usar las Campañas desde la consola.
});