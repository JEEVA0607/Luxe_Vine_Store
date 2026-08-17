import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { showAlert } from "./alerts.js";


// =====================================================
// CART
// =====================================================

let cart =
    JSON.parse(
        localStorage.getItem("cart")
    ) || [];


// =====================================================
// ELEMENTS
// =====================================================

const cartItems =
    document.getElementById(
        "cartItems"
    );

const totalAmount =
    document.getElementById(
        "totalAmount"
    );

const placeOrder =
    document.getElementById(
        "placeOrder"
    );

const backMenu =
    document.getElementById(
        "backMenu"
    );

const tableBox =
    document.getElementById(
        "tableBox"
    );

const addressBox =
    document.getElementById(
        "addressBox"
    );

const locationBox =
    document.getElementById(
        "locationBox"
    );

const tableNumber =
    document.getElementById(
        "tableNumber"
    );

const deliveryName =
    document.getElementById(
        "deliveryName"
    );

const deliveryPhone =
    document.getElementById(
        "deliveryPhone"
    );

const deliveryPlace =
    document.getElementById(
        "deliveryPlace"
    );

const deliveryLandmark =
    document.getElementById(
        "deliveryLandmark"
    );

const getLocationBtn =
    document.getElementById(
        "getLocationBtn"
    );

const locationStatus =
    document.getElementById(
        "locationStatus"
    );

const distanceResult =
    document.getElementById(
        "distanceResult"
    );

const selectMapLocationBtn =
    document.getElementById(
        "selectMapLocationBtn"
    );

const mapLocationBox =
    document.getElementById(
        "mapLocationBox"
    );

const deliveryMapElement =
    document.getElementById(
        "deliveryMap"
    );

const closeMapBtn =
    document.getElementById(
        "closeMapBtn"
    );

const mapSearchInput =
    document.getElementById(
        "mapSearchInput"
    );

const mapSearchBtn =
    document.getElementById(
        "mapSearchBtn"
    );

const mapSearchResults =
    document.getElementById(
        "mapSearchResults"
    );


// =====================================================
// DELIVERY LOCATION DATA
// =====================================================

let customerLatitude = null;

let customerLongitude = null;

let deliveryDistance = null;

let shopLatitude = null;

let shopLongitude = null;

let deliveryRadius = 5;

let homeDeliveryEnabled = true;

let deliveryMap = null;

let deliveryMapMarker = null;
let savedAddresses = [];
let selectedSavedAddressId = null;
let deliveryCharge = 0;

const savedAddressBox = document.getElementById("savedAddressBox");
const savedAddressList = document.getElementById("savedAddressList");
const addNewAddressBtn = document.getElementById("addNewAddressBtn");
const subtotalAmount = document.getElementById("subtotalAmount");
const deliveryChargeAmount = document.getElementById("deliveryChargeAmount");


// =====================================================
// LOAD CART
// =====================================================

function loadCart() {
    if (!cartItems) return;
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty-cart">🛒 Cart is empty</div>`;
        updateCartSummary(0);
        return;
    }

    let subtotal = 0;
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

    cart.forEach((item, index) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        const amount = price * qty;
        subtotal += amount;
        const images = Array.isArray(item.images) && item.images.length ? item.images : (item.image ? [item.image] : []);
        const imageHTML = images[0]
            ? `<img src="${images[0]}" alt="${item.name || "Item"}">`
            : `<div class="cart-no-image">📦</div>`;
        const isWishlisted = wishlist.includes(item.id);
        const comboLabel = item.type === "combo" ? `<small class="combo-cart-label">🎁 Bundle Offer</small>` : "";

        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-image">${imageHTML}</div>
                <div class="cart-item-info">
                    <h3>${item.type === "combo" ? "🎁 " : ""}${item.name || "Item"}</h3>
                    ${comboLabel}
                    ${item.selectedColor ? `<small>Color / Variant: ${item.selectedColor}</small>` : ""}
                    <p>₹${price}</p>
                    <div class="cart-qty">
                        <button onclick="changeCartQty(${index},-1)">−</button>
                        <span>${qty}</span>
                        <button onclick="changeCartQty(${index},1)">+</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <strong>₹${amount}</strong>
                    <div class="cart-card-actions">
                        ${item.type !== "combo" ? `<button class="wishlist-cart-btn ${isWishlisted ? "active" : ""}" onclick="toggleCartWishlist(${index})">${isWishlisted ? "♥" : "♡"}</button>` : ""}
                        <button class="remove-cart-btn" onclick="removeCart(${index})">🗑</button>
                    </div>
                </div>
            </div>`;
    });

    updateCartSummary(subtotal);
}

function updateCartSummary(subtotal = cart.reduce((s,item)=>s + (Number(item.price)||0)*(Number(item.qty)||1),0)) {
    if (subtotalAmount) subtotalAmount.innerText = Number(subtotal).toFixed(2).replace(/\.00$/,'');
    if (deliveryChargeAmount) deliveryChargeAmount.innerText = Number(deliveryCharge).toFixed(2).replace(/\.00$/,'');
    if (totalAmount) totalAmount.innerText = Number(subtotal + Number(deliveryCharge || 0)).toFixed(2).replace(/\.00$/,'');
}

window.toggleCartWishlist = function(index){
    const item=cart[index]; if(!item) return;
    let wishlist=JSON.parse(localStorage.getItem("wishlist") || "[]");
    if(wishlist.includes(item.id)) wishlist=wishlist.filter(id=>id!==item.id); else wishlist.push(item.id);
    localStorage.setItem("wishlist",JSON.stringify(wishlist));
    loadCart();
};

// =====================================================
// CHANGE QUANTITY
// =====================================================

window.changeCartQty =
    function (index, change) {

        if (!cart[index]) return;


        let qty =
            Number(
                cart[index].qty
            ) || 1;


        qty += change;


        if (qty < 1) {

            qty = 1;

        }


        cart[index].qty =
            qty;


        saveCart();

        loadCart();

    };


// =====================================================
// REMOVE ITEM
// =====================================================

window.removeCart =
    function (index) {

        if (!cart[index]) return;


        cart.splice(
            index,
            1
        );


        saveCart();

        loadCart();

    };


// =====================================================
// SAVE CART
// =====================================================

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


// =====================================================
// GET SELECTED ORDER TYPE
// =====================================================

function getSelectedOrderType() {

    const selected =
        document.querySelector(
            'input[name="orderType"]:checked'
        );


    return selected
        ? selected.value
        : null;

}


// =====================================================
// RESET DELIVERY LOCATION
// =====================================================

function resetDeliveryLocation() {

    customerLatitude = null;

    customerLongitude = null;

    deliveryDistance = null;


    if (locationStatus) {

        locationStatus.innerText =
            "Location not selected";

        locationStatus.style.color =
            "#666";

    }


    if (distanceResult) {

        distanceResult.innerText =
            "";

        distanceResult.classList.remove(
            "delivery-available",
            "delivery-unavailable"
        );

    }


    if (getLocationBtn) {

        getLocationBtn.disabled =
            false;

        getLocationBtn.innerText =
            "📍 Use My Current Location (Optional)";

    }

}


// =====================================================
// SAVED CUSTOMER ADDRESSES
// =====================================================

async function loadSavedAddresses() {
    const customerId = localStorage.getItem("customerId");
    if (!customerId || !savedAddressList) return;

    try {
        const snap = await getDoc(doc(db, "customers", customerId));
        const data = snap.exists() ? snap.data() : {};
        savedAddresses = Array.isArray(data.savedAddresses) ? data.savedAddresses : [];
        renderSavedAddresses();
    } catch (error) {
        console.error("Saved Address Error:", error);
        if (savedAddressList) savedAddressList.innerHTML = `<div style="color:#b3261e;font-size:13px">Unable to load saved addresses.</div>`;
    }
}

function renderSavedAddresses() {
    if (!savedAddressList) return;
    if (!savedAddresses.length) {
        savedAddressList.innerHTML = `<div style="color:#777;font-size:13px;padding:8px 0">No saved address. You can add one below.</div>`;
        return;
    }

    savedAddressList.innerHTML = savedAddresses.map(address => `
        <label class="saved-address-option ${selectedSavedAddressId === address.id ? "active" : ""}">
            <input type="radio" name="savedDeliveryAddress" value="${address.id}" ${selectedSavedAddressId === address.id ? "checked" : ""}>
            <span>
                <strong>📍 ${address.label || "Saved Address"}</strong><br>
                <small>${address.name || ""} · ${address.phone || ""}</small><br>
                <small>${address.place || ""}${address.landmark ? ` · Near ${address.landmark}` : ""}</small>
            </span>
        </label>
    `).join("");
}

async function applySavedAddress(address) {
    if (!address) return;
    selectedSavedAddressId = address.id;
    if (deliveryName) deliveryName.value = address.name || "";
    if (deliveryPhone) deliveryPhone.value = address.phone || "";
    if (deliveryPlace) deliveryPlace.value = address.place || "";
    if (deliveryLandmark) deliveryLandmark.value = address.landmark || "";
    await checkHomeDeliverySettings();
    if (address.latitude !== null && address.longitude !== null && address.latitude !== undefined && address.longitude !== undefined) {
        setSelectedDeliveryLocation(address.latitude, address.longitude);
    }
    renderSavedAddresses();
}

if (savedAddressList) {
    savedAddressList.addEventListener("change", async (event) => {
        if (event.target.name !== "savedDeliveryAddress") return;
        const address = savedAddresses.find(a => String(a.id) === String(event.target.value));
        await applySavedAddress(address);
    });
}

if (addNewAddressBtn) {
    addNewAddressBtn.onclick = () => {
        selectedSavedAddressId = null;
        if (deliveryName) deliveryName.value = localStorage.getItem("customerName") || "";
        if (deliveryPhone) deliveryPhone.value = localStorage.getItem("customerPhone") || "";
        if (deliveryPlace) deliveryPlace.value = "";
        if (deliveryLandmark) deliveryLandmark.value = "";
        resetDeliveryLocation();
        renderSavedAddresses();
        if (addressBox) addressBox.classList.add("show");
    };
}

// =====================================================
// ORDER TYPE UI
// =====================================================

document
    .querySelectorAll(
        'input[name="orderType"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                async function () {

                    document
                        .querySelectorAll(
                            ".order-type-option"
                        )
                        .forEach(
                            option => {

                                option.classList.remove(
                                    "active"
                                );

                            }
                        );


                    const option =
                        this.closest(
                            ".order-type-option"
                        );


                    if (option) {

                        option.classList.add(
                            "active"
                        );

                    }


                    // =================================
                    // HIDE ALL EXTRA SECTIONS
                    // =================================

                    if (tableBox) {

                        tableBox.classList.remove(
                            "show"
                        );

                    }


                    if (addressBox) {
                        addressBox.classList.remove("show");
                    }

                    if (savedAddressBox) {
                        savedAddressBox.classList.remove("show");
                    }


                    if (locationBox) {

                        locationBox.classList.remove(
                            "show"
                        );

                    }


                    resetDeliveryLocation();


                    // =================================
                    // DINE IN
                    // =================================

                    if (
                        this.value ===
                        "dineIn"
                    ) {

                        if (tableBox) {

                            tableBox.classList.add(
                                "show"
                            );

                        }

                    }


                    // =================================
                    // HOME DELIVERY
                    // =================================

                    if (
                        this.value ===
                        "homeDelivery"
                    ) {

                        const settingsReady =
                            await checkHomeDeliverySettings();


                        if (
                            !settingsReady ||
                            !homeDeliveryEnabled
                        ) {

                            showAlert(
                                "Home delivery is currently unavailable.",
                                "error"
                            );


                            this.checked =
                                false;


                            document
                                .querySelectorAll(
                                    ".order-type-option"
                                )
                                .forEach(
                                    option => {

                                        option.classList.remove(
                                            "active"
                                        );

                                    }
                                );


                            return;

                        }


                        if (addressBox) {
                            addressBox.classList.add("show");
                        }

                        if (savedAddressBox) {
                            savedAddressBox.classList.add("show");
                        }

                        loadSavedAddresses();


                        if (locationBox) {

                            locationBox.classList.add(
                                "show"
                            );

                        }

                    }

                }
            );

        }
    );


// =====================================================
// LOAD SHOP DELIVERY SETTINGS
// =====================================================

async function checkHomeDeliverySettings() {

    try {

        const settingsRef =
            doc(
                db,
                "settings",
                "restaurant"
            );


        const snap =
            await getDoc(
                settingsRef
            );


        if (!snap.exists()) {

            homeDeliveryEnabled =
                false;

            shopLatitude =
                null;

            shopLongitude =
                null;

            return false;

        }


        const settings =
            snap.data();


        // =========================================
        // HOME DELIVERY ENABLED
        // =========================================

        homeDeliveryEnabled =
            settings.homeDeliveryEnabled !== false;


        // =========================================
        // DELIVERY RADIUS
        // =========================================

        deliveryRadius =
            Number(
                settings.deliveryRadius
            ) || 5;

        deliveryCharge =
            Number(
                settings.delivery || settings.deliveryCharge || 0
            ) || 0;

        updateCartSummary();


        // =========================================
        // SHOP LATITUDE
        // =========================================

        const storedLatitude =
            Number(
                settings.shopLatitude
            );


        // =========================================
        // SHOP LONGITUDE
        // =========================================

        const storedLongitude =
            Number(
                settings.shopLongitude
            );


        // =========================================
        // VALIDATE COORDINATES
        // =========================================

        if (
            !Number.isFinite(
                storedLatitude
            ) ||
            !Number.isFinite(
                storedLongitude
            ) ||
            storedLatitude < -90 ||
            storedLatitude > 90 ||
            storedLongitude < -180 ||
            storedLongitude > 180
        ) {

            shopLatitude =
                null;

            shopLongitude =
                null;


            if (
                homeDeliveryEnabled
            ) {

                console.error(
                    "Invalid shop coordinates:",
                    {
                        shopLatitude:
                            settings.shopLatitude,

                        shopLongitude:
                            settings.shopLongitude,

                        shopLocation:
                            settings.shopLocation
                    }
                );

            }


            return false;

        }


        shopLatitude =
            storedLatitude;


        shopLongitude =
            storedLongitude;


        return true;


    } catch (error) {

        console.error(
            "Delivery Settings Error:",
            error
        );


        homeDeliveryEnabled =
            false;


        shopLatitude =
            null;

        shopLongitude =
            null;


        return false;

    }

}


// =====================================================
// DISTANCE CALCULATION
// =====================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371;


    const dLat =
        (
            lat2 - lat1
        ) *
        Math.PI /
        180;


    const dLon =
        (
            lon2 - lon1
        ) *
        Math.PI /
        180;


    const a =
        Math.sin(
            dLat / 2
        ) *
        Math.sin(
            dLat / 2
        )

        +

        Math.cos(
            lat1 *
            Math.PI /
            180
        )

        *

        Math.cos(
            lat2 *
            Math.PI /
            180
        )

        *

        Math.sin(
            dLon / 2
        )

        *

        Math.sin(
            dLon / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(
                1 - a
            )
        );


    return earthRadius * c;

}


// =====================================================
// SET SELECTED DELIVERY LOCATION
// =====================================================

function setSelectedDeliveryLocation(latitude, longitude) {

    customerLatitude = Number(latitude);

    customerLongitude = Number(longitude);

    if (!Number.isFinite(customerLatitude) || !Number.isFinite(customerLongitude)) {
        customerLatitude = null;
        customerLongitude = null;
        deliveryDistance = null;
        return;
    }

    deliveryDistance =
        Number(
            calculateDistance(
                shopLatitude,
                shopLongitude,
                customerLatitude,
                customerLongitude
            ).toFixed(2)
        );

    if (locationStatus) {
        locationStatus.innerText =
            "📍 Delivery location selected";
        locationStatus.style.color = "#168a3a";
    }

    if (distanceResult) {
        distanceResult.classList.remove(
            "delivery-available",
            "delivery-unavailable"
        );

        if (deliveryDistance <= deliveryRadius) {
            distanceResult.innerText =
                `✅ Delivery Available — ${deliveryDistance} KM`;

            distanceResult.classList.add(
                "delivery-available"
            );
        } else {
            distanceResult.innerText =
                `❌ Delivery Not Available — ${deliveryDistance} KM away. Maximum delivery distance is ${deliveryRadius} KM.`;

            distanceResult.classList.add(
                "delivery-unavailable"
            );
        }
    }
}


// =====================================================
// MAP PLACE SEARCH
// =====================================================

function clearMapSearchResults() {

    if (!mapSearchResults) return;

    mapSearchResults.innerHTML = "";
    mapSearchResults.style.display = "none";

}

function showMapSearchMessage(message) {

    if (!mapSearchResults) return;

    mapSearchResults.innerHTML =
        `<div class="map-search-message">${message}</div>`;

    mapSearchResults.style.display = "block";

}

function escapeMapSearchText(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

async function searchMapPlace() {

    if (!mapSearchInput) return;

    const query =
        mapSearchInput.value.trim();

    if (!query) {
        showMapSearchMessage(
            "Please enter a place name."
        );
        return;
    }

    if (!deliveryMap) {
        showMapSearchMessage(
            "Please open the map first."
        );
        return;
    }

    if (mapSearchBtn) {
        mapSearchBtn.disabled = true;
        mapSearchBtn.innerText = "Searching...";
    }

    showMapSearchMessage("Searching for places...");

    try {

        const url =
            "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=" +
            encodeURIComponent(query);

        const response =
            await fetch(url, {
                headers: {
                    "Accept": "application/json"
                }
            });

        if (!response.ok) {
            throw new Error("Place search failed.");
        }

        const results =
            await response.json();

        if (!Array.isArray(results) || results.length === 0) {
            showMapSearchMessage(
                "No places found. Try a nearby area, landmark or town name."
            );
            return;
        }

        mapSearchResults.innerHTML = "";
        mapSearchResults.style.display = "block";

        results.forEach(result => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "map-search-result";

            button.innerHTML =
                `📍 ${escapeMapSearchText(result.display_name)}`;

            button.onclick = function () {

                const latitude =
                    Number(result.lat);

                const longitude =
                    Number(result.lon);

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    return;
                }

                const selected = [
                    latitude,
                    longitude
                ];

                deliveryMap.setView(
                    selected,
                    17
                );

                setSelectedDeliveryLocation(
                    latitude,
                    longitude
                );

                if (deliveryMapMarker) {
                    deliveryMapMarker.setLatLng(selected);
                } else {
                    deliveryMapMarker =
                        L.marker(
                            selected,
                            { draggable: true }
                        ).addTo(deliveryMap);

                    deliveryMapMarker.on(
                        "dragend",
                        function (markerEvent) {

                            const position =
                                markerEvent.target.getLatLng();

                            setSelectedDeliveryLocation(
                                position.lat,
                                position.lng
                            );

                        }
                    );
                }

                mapSearchInput.value =
                    result.display_name || query;

                clearMapSearchResults();

                setTimeout(function () {
                    deliveryMap.invalidateSize();
                }, 100);

            };

            mapSearchResults.appendChild(button);

        });

    }

    catch (error) {

        console.error(
            "Map Search Error:",
            error
        );

        showMapSearchMessage(
            "Unable to search this place. Please try again."
        );

    }

    finally {

        if (mapSearchBtn) {
            mapSearchBtn.disabled = false;
            mapSearchBtn.innerText = "Search";
        }

    }

}

if (mapSearchBtn) {
    mapSearchBtn.onclick =
        searchMapPlace;
}

if (mapSearchInput) {

    mapSearchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {
                event.preventDefault();
                searchMapPlace();
            }

        }
    );

}

// =====================================================
// MAP LOCATION PICKER
// =====================================================

async function openDeliveryMap() {

    if (!deliveryMapElement || typeof L === "undefined") {
        showAlert(
            "Map is not available right now. Please try again.",
            "error"
        );
        return;
    }

    const settingsReady =
        await checkHomeDeliverySettings();

    if (
        !settingsReady ||
        shopLatitude === null ||
        shopLongitude === null
    ) {
        showAlert(
            "Shop delivery location is not configured correctly.",
            "error"
        );
        return;
    }

    if (mapLocationBox) {
        mapLocationBox.classList.add("show");
    }

    if (!deliveryMap) {
        deliveryMap = L.map(
            deliveryMapElement
        ).setView(
            [shopLatitude, shopLongitude],
            15
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "© OpenStreetMap contributors"
            }
        ).addTo(deliveryMap);

        deliveryMap.on("click", function (event) {

            setSelectedDeliveryLocation(
                event.latlng.lat,
                event.latlng.lng
            );

            if (deliveryMapMarker) {
                deliveryMapMarker.setLatLng(
                    event.latlng
                );
            } else {
                deliveryMapMarker = L.marker(
                    event.latlng,
                    { draggable: true }
                ).addTo(deliveryMap);

                deliveryMapMarker.on(
                    "dragend",
                    function (markerEvent) {
                        const position =
                            markerEvent.target.getLatLng();

                        setSelectedDeliveryLocation(
                            position.lat,
                            position.lng
                        );
                    }
                );
            }

        });
    }

    if (customerLatitude !== null && customerLongitude !== null) {
        const selected = [
            customerLatitude,
            customerLongitude
        ];

        deliveryMap.setView(selected, 16);

        if (deliveryMapMarker) {
            deliveryMapMarker.setLatLng(selected);
        } else {
            deliveryMapMarker = L.marker(
                selected,
                { draggable: true }
            ).addTo(deliveryMap);

            deliveryMapMarker.on(
                "dragend",
                function (markerEvent) {
                    const position =
                        markerEvent.target.getLatLng();

                    setSelectedDeliveryLocation(
                        position.lat,
                        position.lng
                    );
                }
            );
        }
    }

    setTimeout(function () {
        deliveryMap.invalidateSize();
    }, 150);
}

if (selectMapLocationBtn) {
    selectMapLocationBtn.onclick =
        openDeliveryMap;
}

if (closeMapBtn) {
    closeMapBtn.onclick = function () {
        if (mapLocationBox) {
            mapLocationBox.classList.remove("show");
        }

        clearMapSearchResults();
    };
}


// =====================================================
// GET CUSTOMER CURRENT LOCATION
// =====================================================

if (getLocationBtn) {

    getLocationBtn.onclick =
        async function () {

            if (!navigator.geolocation) {

                showAlert(
                    "Location is not supported by this browser.",
                    "error"
                );

                return;

            }


            // =========================================
            // BUTTON LOADING
            // =========================================

            getLocationBtn.disabled = true;

            getLocationBtn.innerText =
                "📍 Finding Location...";


            if (locationStatus) {

                locationStatus.innerText =
                    "Finding your current location...";

                locationStatus.style.color =
                    "#666";

            }


            // =========================================
            // SHOW LOADING ALERT
            // =========================================

            Swal.fire({

                title:
                    "📍 Finding your location...",

                text:
                    "Please wait while we check your current location.",

                allowOutsideClick:
                    false,

                allowEscapeKey:
                    false,

                showConfirmButton:
                    false,

                didOpen: () => {

                    Swal.showLoading();

                }

            });


            try {

                // =====================================
                // LOAD SHOP SETTINGS
                // =====================================

                const settingsReady =
                    await checkHomeDeliverySettings();


                if (
                    !settingsReady ||
                    shopLatitude === null ||
                    shopLongitude === null
                ) {

                    throw new Error(
                        "Shop delivery location is not configured correctly."
                    );

                }


                // =====================================
                // GET CUSTOMER LOCATION
                // =====================================

                navigator.geolocation.getCurrentPosition(

                    function (position) {

                        // =================================
                        // CUSTOMER COORDINATES
                        // =================================

                        setSelectedDeliveryLocation(
                            position.coords.latitude,
                            position.coords.longitude
                        );

                        // =================================
                        // CLOSE LOADING ALERT
                        // =================================

                        Swal.close();


                        // =================================
                        // BUTTON
                        // =================================

                        getLocationBtn.disabled =
                            false;


                        getLocationBtn.innerText =
                            "📍 Location Selected";

                    },


                    // =====================================
                    // LOCATION ERROR
                    // =====================================

                    function (error) {

                        console.error(
                            "Geolocation Error:",
                            error
                        );


                        // Close loading alert first

                        Swal.close();


                        let message =
                            "Unable to get your location.";


                        if (
                            error.code ===
                            error.PERMISSION_DENIED
                        ) {

                            message =
                                "Location permission was denied. Please allow location access.";

                        }


                        else if (
                            error.code ===
                            error.POSITION_UNAVAILABLE
                        ) {

                            message =
                                "Your location is currently unavailable. Please try again.";

                        }


                        else if (
                            error.code ===
                            error.TIMEOUT
                        ) {

                            message =
                                "Location request timed out. Please try again.";

                        }


                        // =================================
                        // ERROR ALERT
                        // =================================

                        showAlert(
                            message,
                            "error"
                        );


                        // =================================
                        // RESET LOCATION DATA
                        // =================================

                        customerLatitude =
                            null;

                        customerLongitude =
                            null;

                        deliveryDistance =
                            null;


                        if (locationStatus) {

                            locationStatus.innerText =
                                "Location not selected";

                            locationStatus.style.color =
                                "#c62828";

                        }


                        // =================================
                        // RESET BUTTON
                        // =================================

                        getLocationBtn.disabled =
                            false;


                        getLocationBtn.innerText =
                            "📍 Use My Current Location";

                    },


                    // =====================================
                    // GEOLOCATION OPTIONS
                    // =====================================

                    {

                        enableHighAccuracy:
                            true,

                        timeout:
                            30000,

                        maximumAge:
                            0

                    }

                );


            }

            catch (error) {

                console.error(
                    "Location Error:",
                    error
                );


                // Close loading alert

                Swal.close();


                showAlert(
                    error.message ||
                    "Unable to check delivery location.",
                    "error"
                );


                getLocationBtn.disabled =
                    false;


                getLocationBtn.innerText =
                    "📍 Use My Current Location";

            }

        };

}


// =====================================================
// VALIDATE ORDER TYPE
// =====================================================

async function validateOrderType() {

    const orderType =
        getSelectedOrderType();


    // =========================================
    // ORDER TYPE REQUIRED
    // =========================================

    if (!orderType) {

        showAlert(
            "Please select Home Delivery.",
            "error"
        );

        return false;

    }


    // =========================================
    // DINE IN
    // =========================================

    if (
        orderType ===
        "dineIn"
    ) {

        const table =
            tableNumber?.value.trim();


        if (!table) {

            showAlert(
                "Please enter your table number.",
                "error"
            );


            tableNumber?.focus();


            return false;

        }

    }


    // =========================================
    // HOME DELIVERY
    // =========================================

    if (
        orderType ===
        "homeDelivery"
    ) {

        const settingsReady =
            await checkHomeDeliverySettings();


        if (!settingsReady) {

            showAlert(
                "Shop delivery location is not configured correctly.",
                "error"
            );

            return false;

        }


        if (
            !homeDeliveryEnabled
        ) {

            showAlert(
                "Home delivery is currently unavailable.",
                "error"
            );

            return false;

        }


        // =====================================
        // ADDRESS
        // =====================================

        const name =
    deliveryName?.value.trim();

const phone =
    deliveryPhone?.value.trim();

const place =
    deliveryPlace?.value.trim();

const landmark =
    deliveryLandmark?.value.trim();


if (!name) {

    showAlert(
        "Please enter customer name.",
        "error"
    );

    deliveryName?.focus();

    return false;

}


if (!phone) {

    showAlert(
        "Please enter phone number.",
        "error"
    );

    deliveryPhone?.focus();

    return false;

}


if (!place) {

    showAlert(
        "Please enter place name.",
        "error"
    );

    deliveryPlace?.focus();

    return false;

}


if (!landmark) {

    showAlert(
        "Please enter nearby landmark.",
        "error"
    );

    deliveryLandmark?.focus();

    return false;

}


        // =====================================
        // CUSTOMER LOCATION REQUIRED
        // =====================================

        if (
            customerLatitude === null ||
            customerLongitude === null ||
            deliveryDistance === null
        ) {

            showAlert(
                "Please select a delivery location using Current Location or the Map.",
                "error"
            );


            if (getLocationBtn) {

                getLocationBtn.focus();

            }


            return false;

        }


        // =====================================
        // DISTANCE CHECK
        // =====================================

        if (
            deliveryDistance >
            deliveryRadius
        ) {

            showAlert(
                `Home delivery is available only within ${deliveryRadius} KM. Your location is ${deliveryDistance} KM away.`,
                "error"
            );


            return false;

        }

    }


    return true;

}


// =====================================================
// GENERATE TOKEN
// =====================================================

async function generateToken() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "orders"
            )
        );


    return "#" +
        (
            snapshot.size +
            101
        );

}


// =====================================================
// PLACE ORDER
// =====================================================

if (placeOrder) {

    placeOrder.onclick =
        async function () {

            // =========================================
            // CART CHECK
            // =========================================

            if (
                cart.length === 0
            ) {

                showAlert(
                    "Cart is empty",
                    "error"
                );

                return;

            }


            // =========================================
            // ORDER TYPE CHECK
            // =========================================

            const valid =
                await validateOrderType();


            if (!valid) {

                return;

            }

            const paymentMethod = getSelectedPaymentMethod();

            if (paymentMethod !== "Cash on Delivery") {
                showAlert("Please select Cash on Delivery to place the order.", "error");
                return;
            }


            try {

                placeOrder.disabled =
                    true;


                placeOrder.innerText =
                    "Placing Order...";


                // =========================================
                // ORDER TYPE
                // =========================================

                const orderType =
                    getSelectedOrderType();


                // =========================================
                // TABLE
                // =========================================

                let orderTableNumber =
                    "";


                if (
                    orderType ===
                    "dineIn"
                ) {

                    orderTableNumber =
                        tableNumber.value.trim();

                }


                // =========================================
                // PLACE ORDER
                // =========================================

                let orderDeliveryAddress = "";

let orderDeliveryName = "";

let orderDeliveryPhone = "";

let orderDeliveryPlace = "";

let orderDeliveryLandmark = "";


if (
    orderType ===
    "homeDelivery"
) {

    orderDeliveryName =
        deliveryName.value.trim();

    orderDeliveryPhone =
        deliveryPhone.value.trim();

    orderDeliveryPlace =
        deliveryPlace.value.trim();

    orderDeliveryLandmark =
        deliveryLandmark.value.trim();


    // Combined address
    // Admin-ൽ പഴയ deliveryAddress field ഉപയോഗിക്കാനും കഴിയും

    orderDeliveryAddress =
    `${orderDeliveryPlace}, ${orderDeliveryLandmark}`;

}


                // =========================================
                // TOTAL
                // =========================================

                const subtotal =
                    cart.reduce(
                        (sum, item) =>
                            sum +
                            (Number(item.price) * Number(item.qty)),
                        0
                    );

                const total =
                    subtotal + Number(deliveryCharge || 0);


                // =========================================
                // TOKEN
                // =========================================

                const token =
                    await generateToken();


                // =========================================
                // ITEMS
                // =========================================

                const orderItems =
                    cart.map(
                        item => ({

                            type:
                                item.type ||
                                "food",

                            id:
                                item.id ||
                                "",

                            name:
                                item.name ||
                                "",

                            qty:
                                Number(
                                    item.qty
                                ),

                            price:
                                Number(
                                    item.price
                                ),

                            image:
                                item.image ||
                                "",

                            comboItems:
                                item.comboItems ||
                                []

                        })
                    );


                // =========================================
                // CUSTOMER
                // =========================================

                const customerName =
                    localStorage.getItem(
                        "customerName"
                    ) || "Guest";


                const customerPhone =
                    localStorage.getItem(
                        "customerPhone"
                    ) || "";


                const customerId =
                    localStorage.getItem(
                        "customerId"
                    ) || "";


                // =========================================
                // DATE / TIME
                // =========================================

                const now =
                    new Date();


                // =========================================
                // NEW ORDER
                // =========================================

                const newOrder = {

                    token,

                    customer:
                        customerName,

                    customerPhone:
                        customerPhone,

                    customerId:
                        customerId,

                    orderType,

                    tableNumber:
                        orderTableNumber,

                    deliveryAddress:
    orderDeliveryAddress,

deliveryName:
    orderDeliveryName,

deliveryPhone:
    orderDeliveryPhone,

deliveryPlace:
    orderDeliveryPlace,

deliveryLandmark:
    orderDeliveryLandmark,

                    savedAddressId:
                        selectedSavedAddressId || "",


                    // =====================================
                    // CUSTOMER DELIVERY LOCATION
                    // =====================================

                    deliveryLatitude:
                        orderType === "homeDelivery"
                            ? customerLatitude
                            : null,

                    deliveryLongitude:
                        orderType === "homeDelivery"
                            ? customerLongitude
                            : null,

                    deliveryDistance:
                        orderType === "homeDelivery"
                            ? deliveryDistance
                            : null,

                    deliveryRadius:
                        orderType === "homeDelivery"
                            ? deliveryRadius
                            : null,


                    // =====================================
                    // ITEMS
                    // =====================================

                    items:
                        orderItems,

                    subtotal,
                    deliveryCharge:
                        Number(deliveryCharge || 0),
                    total,

                    paymentMethod:
                        paymentMethod,

                    paymentStatus:
                        "Pending",

                    status:
                        "Pending",

                    date:
                        now.toLocaleDateString(),

                    time:
                        now.toLocaleTimeString(),

                    createdAt:
                        Date.now()

                };


                console.log(
                    "ORDER SAVING:",
                    newOrder
                );


                // =========================================
                // FIRESTORE
                // =========================================

                const docRef =
                    await addDoc(
                        collection(
                            db,
                            "orders"
                        ),
                        newOrder
                    );


                // =========================================
                // SAVE LAST ORDER
                // =========================================

                localStorage.setItem(
                    "lastOrderId",
                    docRef.id
                );


                // =========================================
                // CLEAR CART
                // =========================================

                cart = [];


                localStorage.removeItem(
                    "cart"
                );


                // =========================================
                // SUCCESS
                // =========================================

                await showAlert(
                    "Order Placed Successfully",
                    "success"
                );


                // =========================================
                // ORDER STATUS
                // =========================================

                window.location.replace(
                    "order-status.html"
                );

            }


            catch (error) {

                console.error(
                    "ORDER ERROR:",
                    error
                );


                showAlert(
                    error.message ||
                    "Unable to place order",
                    "error"
                );


                placeOrder.disabled =
                    false;


                placeOrder.innerText =
                    "Place Order";

            }

        };

}


// =====================================================
// BACK TO MENU
// =====================================================

if (backMenu) {

    backMenu.onclick =
        function () {

            window.location.href =
                "index.html";

        };

}




// =====================================================
// PAYMENT METHOD
// =====================================================

function getSelectedPaymentMethod() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    return selected ? selected.value : null;
}

function initializePaymentMethods() {
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener("change", function () {
            if (this.value !== "Cash on Delivery") {
                this.checked = false;
                showAlert("This payment method is currently unavailable.", "info");
                return;
            }
            document.querySelectorAll(".payment-option").forEach(option => option.classList.remove("active"));
            const option = this.closest(".payment-option");
            if (option) option.classList.add("active");
        });
    });
}

// =====================================================
// CUSTOMER MODE
// HOME DELIVERY ONLY
// =====================================================

function initializeHomeDeliveryOnly() {

    const homeDeliveryRadio =
        document.querySelector(
            'input[name="orderType"][value="homeDelivery"]'
        );

    if (!homeDeliveryRadio) return;

    homeDeliveryRadio.checked = true;

    const homeDeliveryOption =
        document.getElementById("homeDeliveryOption");

    document
        .querySelectorAll(".order-type-option")
        .forEach(option => {
            option.classList.remove("active");
        });

    if (homeDeliveryOption) {
        homeDeliveryOption.classList.add("active");
    }

    homeDeliveryRadio.dispatchEvent(
        new Event("change", { bubbles: true })
    );

}


// =====================================================
// INITIAL LOAD
// =====================================================

loadCart();
loadSavedAddresses();
initializePaymentMethods();
window.renderBottomNav?.("");
initializeHomeDeliveryOnly();