import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const firebaseConfig = {

    apiKey:
        "AIzaSyCj_N3coRvmgc3xouE4AdDN2ZXII56kWY4",

    authDomain:
        "hightech-df8b2.firebaseapp.com",

    projectId:
        "hightech-df8b2",

    storageBucket:
        "hightech-df8b2.firebasestorage.app",

    messagingSenderId:
        "728056351045",

    appId:
        "1:728056351045:web:797bbc68b7087ee351162c"

};


export const app =
    initializeApp(firebaseConfig);


export const db =
    getFirestore(app);


export const storage =
    getStorage(app);


export const auth =
    getAuth(app);


console.log("✅ Customer Firebase Connected");
console.log("✅ Firestore Ready");
console.log("✅ Storage Ready");
console.log("✅ Authentication Ready");
