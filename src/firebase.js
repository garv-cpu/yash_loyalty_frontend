import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
    apiKey: "AIzaSyBwPa5pgL5Kn7pbg1R0xzbTu81m6muhQ8c",
    authDomain: "yash-ed001.firebaseapp.com",
    projectId: "yash-ed001",
    storageBucket: "yash-ed001.firebasestorage.app",
    messagingSenderId: "508457569447",
    appId: "1:508457569447:web:8e2d17af7bcbbbe1d7df82",
    measurementId: "G-GS3JTS6KT3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

getAnalytics(app);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);