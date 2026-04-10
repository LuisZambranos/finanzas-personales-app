// public/firebase-messaging-sw.js

// Importamos los scripts base de Firebase compatibles con Service Workers
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Pega aquí TU configuración exacta de Firebase
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

// Esta función es la que "escucha" cuando te mandan un mensaje y la app está cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.jpg',
    badge: '/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});