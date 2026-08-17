import {db,auth} from "./firebase.js";
import {doc,getDoc,updateDoc,setDoc} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {showAlert} from "./alerts.js";
let currentUser=null;let savedAddresses=[];let map=null;let marker=null;let selectedLat=null;let selectedLng=null;
const $=id=>document.getElementById(id);
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function setLocation(lat,lng){selectedLat=Number(lat);selectedLng=Number(lng);if(!Number.isFinite(selectedLat)||!Number.isFinite(selectedLng))return;if(map){map.setView([selectedLat,selectedLng],17);if(marker)marker.setLatLng([selectedLat,selectedLng]);else marker=L.marker([selectedLat,selectedLng],{draggable:true}).addTo(map);}$("addressLocationStatus").innerText=`📍 Location selected: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`;$("addressLocationStatus").style.color="#168a3a";}
function openMap(){ $("addressMapBox").style.display="block";setTimeout(()=>{if(!map){map=L.map("addressMap").setView([7.8731,80.7718],8);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(map);map.on("click",e=>setLocation(e.latlng.lat,e.latlng.lng));}else map.invalidateSize();},100);}
async function load(){currentUser=auth.currentUser;if(!currentUser){location.replace("login.html");return;}const ref=doc(db,"customers",currentUser.uid);const snap=await getDoc(ref);const data=snap.exists()?snap.data():{};savedAddresses=Array.isArray(data.savedAddresses)?data.savedAddresses:[];$("userDetails").innerText=`${data.name||currentUser.displayName||"Customer"} • ${data.phone||currentUser.phoneNumber||""} • ${data.email||currentUser.email||""}`;render();}
function render(){const box=$("savedAddresses");if(!savedAddresses.length){box.innerHTML=`<p style="color:#777">No saved address yet.</p>`;return;}box.innerHTML=savedAddresses.map((a,i)=>`<div class="saved-address-card"><div><strong>📍 ${esc(a.label||"Saved Address")}</strong><br><span>${esc(a.name||"")} · ${esc(a.phone||"")}</span><br><small>${esc(a.place||"")}${a.landmark?` · Near ${esc(a.landmark)}`:""}</small></div><button class="user-secondary-btn delete-address" data-index="${i}">Delete</button></div>`).join("");}

async function searchAddressPlace(){
 const q=$("addressMapSearch")?.value.trim(); if(!q){return;}
 const box=$("addressMapResults"); box.style.display="block"; box.innerHTML=`<div style="padding:10px;color:#777">Searching...</div>`;
 try{
  const res=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q="+encodeURIComponent(q),{headers:{Accept:"application/json"}});
  const data=await res.json();
  if(!data.length){box.innerHTML=`<div style="padding:10px;color:#777">No place found.</div>`;return;}
  box.innerHTML=data.map((r,i)=>`<button type="button" class="address-search-result" data-index="${i}" style="display:block;width:100%;padding:10px;border:0;border-bottom:1px solid #eee;background:#fff;text-align:left;cursor:pointer">📍 ${esc(r.display_name)}</button>`).join("");
  box._results=data;
 }catch(e){box.innerHTML=`<div style="padding:10px;color:#b3261e">Unable to search.</div>`;}
}
$("addressMapSearchBtn").onclick=searchAddressPlace;
$("addressMapSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchAddressPlace();}});
document.addEventListener("click",e=>{const b=e.target.closest(".address-search-result");if(!b)return;const r=$("addressMapResults")._results?.[Number(b.dataset.index)];if(!r)return;setLocation(Number(r.lat),Number(r.lon));$("addressMapSearch").value=r.display_name;$("addressMapResults").style.display="none";});

$("openAddressMap").onclick=openMap;
$("useCurrentLocation").onclick=()=>{if(!navigator.geolocation){showAlert("Location is not supported by this browser.","error");return;}navigator.geolocation.getCurrentPosition(p=>{setLocation(p.coords.latitude,p.coords.longitude);openMap();},()=>showAlert("Unable to get your current location.","error"),{enableHighAccuracy:true,timeout:15000,maximumAge:0});};
$("saveAddress").onclick=async()=>{if(!currentUser)return;const a={id:Date.now().toString(),label:$("addressLabel").value.trim()||"Saved Address",name:$("addressName").value.trim(),phone:$("addressPhone").value.trim(),place:$("addressPlace").value.trim(),landmark:$("addressLandmark").value.trim(),latitude:selectedLat,longitude:selectedLng,createdAt:Date.now()};if(!a.name||!a.phone||!a.place||a.latitude===null||a.longitude===null){showAlert("Please complete the address and select the map location.","error");return;}savedAddresses.push(a);await setDoc(doc(db,"customers",currentUser.uid),{savedAddresses},{merge:true});showAlert("Address saved successfully","success");["addressName","addressPhone","addressPlace","addressLandmark","addressLabel"].forEach(id=>$(id).value="");selectedLat=null;selectedLng=null;render();};
document.addEventListener("click",async e=>{const b=e.target.closest(".delete-address");if(!b||!currentUser)return;const i=Number(b.dataset.index);savedAddresses.splice(i,1);await updateDoc(doc(db,"customers",currentUser.uid),{savedAddresses});render();});
auth.onAuthStateChanged(()=>{if(auth.currentUser)load();else location.replace("login.html")});
window.renderBottomNav?.("user");
