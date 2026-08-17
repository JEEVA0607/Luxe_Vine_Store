import { db } from "./firebase.js";
import { collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { showAlert } from "./alerts.js";

let foods=[];
let combos=[];
let categories=[];
let cart=JSON.parse(localStorage.getItem("cart"))||[];
let quantities={};
let searchText="";
let selectedCategory="all";
let restaurantOpen=true;

const foodList=document.getElementById("foodList");
const comboList=document.getElementById("comboList");
const comboSection=document.getElementById("comboSection");
const categoryList=document.getElementById("categoryList");
const cartBtn=document.getElementById("cartBtn");
const searchInput=document.getElementById("searchFood");
const myOrdersBtn=document.getElementById("myOrdersBtn");
const restaurantTitle=document.getElementById("restaurantTitle");
const restaurantLogo=document.getElementById("restaurantLogoHeader");
const restaurantStatus=document.getElementById("restaurantStatus");

function escapeHtml(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function normalizeImages(item){const a=Array.isArray(item.images)?item.images.filter(Boolean):[];if(item.image&&!a.includes(item.image))a.unshift(item.image);return [...new Set(a)];}

onSnapshot(collection(db,"foods"),snapshot=>{foods=snapshot.docs.map(d=>({id:d.id,...d.data()}));loadFoods();},error=>console.error("Product Load Error",error));
onSnapshot(collection(db,"categories"),snapshot=>{categories=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.active!==false);loadCategories();},error=>console.error("Category Load Error",error));
onSnapshot(collection(db,"combos"),snapshot=>{combos=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.active!==false).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));renderCombos();},error=>console.error("Combo Load Error",error));
onSnapshot(doc(db,"settings","restaurant"),snapshot=>{if(!snapshot.exists())return;const settings=snapshot.data();if(restaurantTitle&&settings.restaurantName)restaurantTitle.innerText=settings.restaurantName;if(restaurantLogo&&settings.logo){restaurantLogo.src=settings.logo;restaurantLogo.style.display="block";}checkRestaurantStatus(settings);},error=>console.error("Restaurant Settings Error",error));

function loadCategories(){
 if(!categoryList)return;
 categoryList.innerHTML=`<button class="category ${selectedCategory==="all"?"active":""}" onclick="filterCategory('all')">📦 All</button>`;
 categories.forEach(c=>{categoryList.innerHTML+=`<button class="category ${selectedCategory===String(c.name).toLowerCase()?"active":""}" onclick="filterCategory('${String(c.name).replace(/'/g,"\\'").toLowerCase()}')">${escapeHtml(c.icon||"📦")} ${escapeHtml(c.name)}</button>`;});
}

function getFilteredFoods(){
 return foods.filter(food=>{
  const categoryMatch=selectedCategory==="all"||String(food.category||"").toLowerCase().trim()===selectedCategory.toLowerCase().trim();
  const searchMatch=String(food.name||"").toLowerCase().includes(searchText.toLowerCase());
  return categoryMatch&&searchMatch;
 });
}

function loadFoods(){
 if(!foodList)return;
 const filtered=getFilteredFoods();
 foodList.innerHTML="";
 if(!filtered.length){foodList.innerHTML=`<div class="empty-food">📦 No Products Found</div>`;return;}
 filtered.forEach((food,index)=>{
  const images=normalizeImages(food);
  foodList.innerHTML+=`<div class="food-card">
   <div class="food-open-area" onclick="openProduct('${encodeURIComponent(food.id)}')">
    <div class="food-image">
     ${!food.available?`<div class="stock-badge">OUT OF STOCK</div>`:""}
     ${images[0]?`<img src="${escapeHtml(images[0])}" alt="${escapeHtml(food.name)}">`:`<div class="no-image">📦</div>`}
    </div>
    <h3>${escapeHtml(food.name)}</h3>
   </div>
   <div class="price">₹${Number(food.price||0)}</div>
   <div class="qty-box">
    <button onclick="changeQty(${index},-1)">−</button>
    <span id="qty-${index}">${quantities[index]||1}</span>
    <button onclick="changeQty(${index},1)">+</button>
   </div>
   ${food.available?`<button class="add-cart" onclick="addCart(${index})">🛒 Add To Cart</button>`:`<button class="out-stock" disabled>❌ Out Of Stock</button>`}
  </div>`;
 });
}

function renderCombos(){
 if(!comboList)return;
 comboList.innerHTML="";
 if(!combos.length){if(comboSection)comboSection.style.display="none";return;}
 if(comboSection)comboSection.style.display="block";
 combos.forEach((combo,index)=>{
  const itemList=Array.isArray(combo.items)?combo.items.map(item=>`${escapeHtml(item.name)} ×${item.qty}`).join(", "):"";
  comboList.innerHTML+=`<div class="food-card combo-card">
   <div class="food-open-area">
    <div class="food-image">${combo.image?`<img src="${escapeHtml(combo.image)}" alt="${escapeHtml(combo.name)}">`:`<div class="no-image">🎁</div>`}${combo.badge?`<span class="combo-badge">${escapeHtml(combo.badge)}</span>`:""}</div>
    <h3>${escapeHtml(combo.name)}</h3>
   </div>
   <div class="combo-items">${itemList}</div>
   <div class="combo-prices"><span class="combo-old-price">₹${Number(combo.originalPrice||0)}</span><strong class="combo-offer-price">₹${Number(combo.offerPrice||0)}</strong></div>
   <div class="combo-saving">Save ₹${Number(combo.discount||0)} ${combo.savingPercent?`(${combo.savingPercent}%)`:""}</div>
   <button class="combo-add-btn" data-index="${index}">🎁 Add Offer</button>
  </div>`;
 });
}

function changeQty(index,value){quantities[index]=(quantities[index]||1)+value;if(quantities[index]<1)quantities[index]=1;const el=document.getElementById(`qty-${index}`);if(el)el.innerText=quantities[index];}
function updateCartCount(){cart=JSON.parse(localStorage.getItem("cart"))||[];const total=cart.reduce((s,i)=>s+Number(i.qty||0),0);if(cartBtn)cartBtn.innerText=`🛒 Cart (${total})`;}
function filterCategory(category){selectedCategory=String(category).toLowerCase();loadCategories();loadFoods();}

function addCart(index){
 if(!restaurantOpen){showAlert("Shop is currently closed.","warning");return;}
 const food=getFilteredFoods()[index];if(!food)return;
 const qty=quantities[index]||1;
 cart=JSON.parse(localStorage.getItem("cart"))||[];
 const existing=cart.find(item=>item.type!=="combo"&&item.id===food.id&&!(item.selectedColor));
 if(existing)existing.qty+=qty;else cart.push({id:food.id,name:food.name,image:normalizeImages(food)[0]||"",images:normalizeImages(food),price:Number(food.price||0),qty,selectedColor:""});
 localStorage.setItem("cart",JSON.stringify(cart));updateCartCount();showAlert(`${food.name} added to cart`,`success`);
}

function addCombo(comboIndex){const combo=combos[comboIndex];if(!combo)return;cart=JSON.parse(localStorage.getItem("cart"))||[];const comboId="combo_"+combo.id;const existing=cart.find(i=>i.id===comboId);if(existing)existing.qty+=1;else cart.push({id:comboId,type:"combo",comboId:combo.id,name:combo.name,price:Number(combo.offerPrice||0),qty:1,image:combo.image||"",originalPrice:Number(combo.originalPrice||0),discount:Number(combo.discount||0),items:combo.items||[]});localStorage.setItem("cart",JSON.stringify(cart));updateCartCount();showAlert("🎁 Offer added to cart","success");}

document.addEventListener("click",e=>{const comboBtn=e.target.closest(".combo-add-btn");if(comboBtn)addCombo(Number(comboBtn.dataset.index));});
if(searchInput)searchInput.addEventListener("input",e=>{searchText=e.target.value;loadFoods();});
if(cartBtn)cartBtn.onclick=()=>location.href="cart.html";
if(myOrdersBtn)myOrdersBtn.onclick=()=>location.href="my-orders.html";

window.addCart=addCart;window.addCombo=addCombo;window.changeQty=changeQty;window.filterCategory=filterCategory;window.openProduct=id=>location.href=`product.html?id=${id}`;
updateCartCount();
if(window.renderBottomNav)window.renderBottomNav("home");

function checkRestaurantStatus(settings){
 if(!restaurantStatus)return;
 if(!settings.openingTime||!settings.closingTime){restaurantOpen=true;restaurantStatus.innerHTML="🟢 OPEN";restaurantStatus.className="restaurant-status open";return;}
 const now=new Date(),current=now.getHours()*60+now.getMinutes(),o=settings.openingTime.split(":"),c=settings.closingTime.split(":"),open=Number(o[0])*60+Number(o[1]),close=Number(c[0])*60+Number(c[1]);
 restaurantOpen=current>=open&&current<close;
 restaurantStatus.innerHTML=restaurantOpen?"🟢 OPEN NOW":"🔴 CLOSED";
 restaurantStatus.className=restaurantOpen?"restaurant-status open":"restaurant-status closed";
}
