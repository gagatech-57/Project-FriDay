import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Project Friday Firebase Web App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDq9xfAp24rsl62ukssU84-ck5i45kX26s",
  authDomain: "project-friday-f411c.firebaseapp.com",
  projectId: "project-friday-f411c",
  storageBucket: "project-friday-f411c.firebasestorage.app",
  messagingSenderId: "183874409224",
  appId: "1:183874409224:web:dd360e09c59279d46fd2bd",
  measurementId: "G-B3KGJLBTV4"
};

// Initialize Firebase App Instance
const firebaseApp = initializeApp(firebaseConfig);

// Safely initialize Analytics if supported in current browser environment
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(firebaseApp);
  }
}).catch(() => {
  console.warn('Firebase Analytics not supported in this browser context.');
});

export { firebaseApp, analytics, firebaseConfig };
