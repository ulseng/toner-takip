// BU DOSYADAKİ AYARLARI KENDİ FIREBASE PROJENİZE GÖRE DOLDURUNUZ
// KURULUM.txt dosyasında detaylı anlatım mevcuttur.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase Console -> Project Settings -> General -> Your Apps kısmından alacağınız kodlar:
const firebaseConfig = {
  apiKey: "AIzaSyDJfPSXR4oldLWP8VNKzhj2C1QPxHyquiQ",
  authDomain: "toner-takip.firebaseapp.com",
  projectId: "toner-takip",
  storageBucket: "toner-takip.firebasestorage.app",
  messagingSenderId: "803719940336",
  appId: "1:803719940336:web:6bb0e10be0b6d8b4a3da35"
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);