import { db } from "./firebase.js";


import {
collection,
query,
where,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const customerId = localStorage.getItem("customerId");

const ordersList = document.getElementById("ordersList");

if(!ordersList) {
    console.error("ordersList not found");
    throw new Error("Missing ordersList element");
}

if (!customerId) {

    ordersList.innerHTML = `
    <h2 style="text-align:center;padding:30px;">
        No Customer Found
    </h2>
    `;

} else {

    const q = query(
        collection(db, "orders"),
        where("customerId", "==", customerId)
    );

    onSnapshot(q, (snapshot) => {

        let orders = [];

        snapshot.forEach(doc => {

            orders.push({
                id: doc.id,
                ...doc.data()
            });

        });

        orders.sort((a,b)=>
(b.createdAt || 0) - (a.createdAt || 0)
);

        renderOrders(orders);

    });

}

function renderOrders(orders) {

    if (orders.length === 0) {

        ordersList.innerHTML = `
        <h2 style="text-align:center;padding:30px;">
            No Orders Yet
        </h2>
        `;

        return;

    }

    ordersList.innerHTML = "";

    orders.forEach(order => {

        ordersList.innerHTML += `

        <div class="order-card"
             onclick="location.href='order-status.html?id=${order.id}'">

            <div class="order-top">

                <h3>${order.token}</h3>

                <span class="order-status">
                    ${order.status}
                </span>

            </div>

            <div>

                🕒 ${order.date} ${order.time}

            </div>

            <div>

                🍽 ${(order.items || []).length} Item(s)

            </div>

            <div class="order-total">

                ₹${order.total}

            </div>

        </div>

        `;

    });

}