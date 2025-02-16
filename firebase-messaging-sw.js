importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD4TGRGQdBMIjxM_IuvAcX31iPyoB1CmSw",
  authDomain: "talk2me-f2dd1.firebaseapp.com",
  projectId: "talk2me-f2dd1",
  storageBucket: "talk2me-f2dd1.firebasestorage.app",
  messagingSenderId: "302571088922",
  appId: "1:302571088922:web:a9ae916550442c8157b5a3",
  measurementId: "G-S1FL048C5L"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png'
  });
});
