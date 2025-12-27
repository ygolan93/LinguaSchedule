// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyLSxB19IXxxcyGLPUPFasey_hLnOeZqQ",
  authDomain: "linguasched.firebaseapp.com",
  projectId: "linguasched",
  storageBucket: "linguasched.firebasestorage.app",
  messagingSenderId: "486369013176",
  appId: "1:486369013176:web:0bc6735ddf7f472919334d",
  measurementId: "G-LMNT7W3RDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);