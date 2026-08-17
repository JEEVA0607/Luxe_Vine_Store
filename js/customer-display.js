import { db } from "./firebase.js";


import {
collection,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const box = document.getElementById("readyTokens");

onSnapshot(collection(db,"orders"),(snapshot)=>{

box.innerHTML="";

snapshot.forEach(docSnap=>{

const order = docSnap.data();

if(order.status !== "Ready") return;

box.innerHTML += `

<div class="token">

${order.token}

</div>

`;

});

});