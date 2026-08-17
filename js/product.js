import { db } from "./firebase.js";
import { doc,getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { showAlert } from "./alerts.js";

const detail=document.getElementById("productDetail");
const id=new URLSearchParams(location.search).get("id");
let product=null;let images=[];let selectedImage=0;let qty=1;let selectedColor="";
function escapeHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function normalizeImages(p){const a=Array.isArray(p.images)?p.images.filter(Boolean):[];if(p.image&&!a.includes(p.image))a.unshift(p.image);return [...new Set(a)];}
function render(){
 if(!detail||!product)return;
 images=normalizeImages(product);
 detail.innerHTML=`<section class="product-gallery">
  <img id="mainProductImage" class="product-main-image" src="${escapeHtml(images[selectedImage]||"")}" alt="${escapeHtml(product.name)}">
  <div class="product-thumbs">${images.map((u,i)=>`<button class="product-thumb ${i===selectedImage?"active":""}" data-index="${i}"><img src="${escapeHtml(u)}" alt=""></button>`).join("")}</div>
 </section>
 <section class="product-detail-info">
  <h1>${escapeHtml(product.name)}</h1>
  <div class="product-detail-price">₹${Number(product.price||0)}</div>
  ${product.description?`<p>${escapeHtml(product.description)}</p>`:""}
  ${Array.isArray(product.colors)&&product.colors.length?`<div><strong>Select Color / Variant</strong><div class="product-color-options">${product.colors.map((c,i)=>`<button type="button" class="product-color-btn ${i===0?"active":""}" data-color="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}</div></div>`:""}
  <div class="product-detail-actions">
   <div class="qty-box"><button id="minusQty">−</button><strong id="productQty">${qty}</strong><button id="plusQty">+</button></div>
   <button class="add-cart" id="addProductCart">🛒 Add To Cart</button>
   <button class="product-buy-btn" id="buyNow">⚡ Buy Now</button>
   <button class="favorite-btn" id="wishlistBtn">♡</button>
  </div>
 </section>`;
 if(Array.isArray(product.colors)&&product.colors.length)selectedColor=product.colors[0];
}
async function load(){
 if(!id){detail.innerHTML="<div class='empty-food'>Product not found.</div>";return;}
 try{const snap=await getDoc(doc(db,"foods",decodeURIComponent(id)));if(!snap.exists()){detail.innerHTML="<div class='empty-food'>Product not found.</div>";return;}product={id:snap.id,...snap.data()};render();}catch(e){console.error(e);detail.innerHTML="<div class='empty-food'>Unable to load product.</div>";}
}
function addToCart(goCart=false){
 if(!product)return;
 if(product.available===false){showAlert("This product is out of stock.","warning");return;}
 let cart=JSON.parse(localStorage.getItem("cart"))||[];
 const color=selectedColor||"";
 const existing=cart.find(i=>i.type!=="combo"&&i.id===product.id&&String(i.selectedColor||"")===color);
 if(existing)existing.qty+=qty;else cart.push({id:product.id,name:product.name,image:images[0]||"",images,price:Number(product.price||0),qty,selectedColor:color});
 localStorage.setItem("cart",JSON.stringify(cart));
 if(goCart)location.href="cart.html";else showAlert("Product added to cart","success");
}

document.addEventListener("click",e=>{
 const thumb=e.target.closest(".product-thumb");if(thumb){selectedImage=Number(thumb.dataset.index);const img=document.getElementById("mainProductImage");if(img)img.src=images[selectedImage];document.querySelectorAll(".product-thumb").forEach(x=>x.classList.remove("active"));thumb.classList.add("active");}
 const color=e.target.closest(".product-color-btn");if(color){selectedColor=color.dataset.color;document.querySelectorAll(".product-color-btn").forEach(x=>x.classList.remove("active"));color.classList.add("active");}
 if(e.target.id==="minusQty"){qty=Math.max(1,qty-1);document.getElementById("productQty").innerText=qty;}
 if(e.target.id==="plusQty"){qty++;document.getElementById("productQty").innerText=qty;}
 if(e.target.id==="addProductCart")addToCart(false);
 if(e.target.id==="buyNow")addToCart(true);
 if(e.target.id==="productCartBtn")location.href="cart.html";
 if(e.target.id==="wishlistBtn"){let w=JSON.parse(localStorage.getItem("wishlist"))||[];if(!w.includes(product.id)){w.push(product.id);e.target.innerText="♥";showAlert("Added to wishlist","success");}else{w=w.filter(x=>x!==product.id);e.target.innerText="♡";showAlert("Removed from wishlist","success");}localStorage.setItem("wishlist",JSON.stringify(w));}
});
window.renderBottomNav?.("home");
load();
