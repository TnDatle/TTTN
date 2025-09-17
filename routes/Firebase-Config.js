// Firebase-Config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMKBDgcjZaFh2LDPs9ZuQzQFHMuZtnOPA",
  authDomain: "store-music-fae02.firebaseapp.com",
  databaseURL:"https://store-music-fae02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "store-music-fae02",
  storageBucket: "store-music-fae02.appspot.com",
  messagingSenderId: "35440000355",
  appId: "1:35440000355:web:7f49a002690331b9812756",
  measurementId: "G-BQPH02HFGC",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app,db, auth };

