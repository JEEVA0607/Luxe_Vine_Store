import { db } from "./firebase.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const orderId =
    params.get("id") ||
    localStorage.getItem("lastOrderId");

const statusBox = document.getElementById("status");
const tokenBox = document.getElementById("token");
const totalBox = document.getElementById("total");
const itemsBox = document.getElementById("items");

if (!orderId) {

    statusBox.innerText = "No Active Order";

} else {

    onSnapshot(doc(db, "orders", orderId), (docSnap) => {

        if (!docSnap.exists()) {

            statusBox.innerText = "Order Not Found";

            return;

        }

        const order = docSnap.data();

        document
            .querySelectorAll(".step")
            .forEach(step => step.classList.remove("active"));

        switch (order.status) {

            case "Pending":

                document.getElementById("step-pending").classList.add("active");

                break;

            case "Accepted":

                document.getElementById("step-pending").classList.add("active");
                document.getElementById("step-accepted").classList.add("active");

                break;

            case "Preparing":

                document.getElementById("step-pending").classList.add("active");
                document.getElementById("step-accepted").classList.add("active");
                document.getElementById("step-preparing").classList.add("active");

                break;

            case "Ready":

                document.getElementById("step-pending").classList.add("active");
                document.getElementById("step-accepted").classList.add("active");
                document.getElementById("step-preparing").classList.add("active");
                document.getElementById("step-ready").classList.add("active");

                break;

            case "Completed":

                localStorage.removeItem("cart");

                document.getElementById("step-pending").classList.add("active");
                document.getElementById("step-accepted").classList.add("active");
                document.getElementById("step-preparing").classList.add("active");
                document.getElementById("step-ready").classList.add("active");
                document.getElementById("step-completed").classList.add("active");

                break;

        }

        if (tokenBox) {

            tokenBox.innerText = order.token || "#---";

        }

        let color = "#f39c12";
        let message = "";

        switch (order.status) {

            case "Pending":

                color = "#f39c12";
                message = "🟡 Your order is waiting for confirmation.";

                break;

            case "Accepted":

                color = "#3498db";
                message = "🔵 Your order has been accepted.";

                break;

            case "Preparing":

                color = "#9b59b6";
                message = "👨‍🍳 Your food is being prepared.";

                break;

            case "Ready":

                color = "#2ecc71";
                message = "🍽 Your order is ready for pickup.";

                break;

            case "Completed":

                color = "#27ae60";
                message = "✅ Order completed. Thank you!";

                break;

            default:

                color = "#7f8c8d";
                message = "Waiting for update...";

        }

        statusBox.innerHTML = message;
        statusBox.style.background = color;
        statusBox.style.color = "#fff";
        statusBox.style.padding = "15px";
        statusBox.style.borderRadius = "12px";
        statusBox.style.fontWeight = "bold";
        statusBox.style.fontSize = "20px";
        statusBox.style.textAlign = "center";

        totalBox.innerText =
            "Total : ₹" + (order.total || 0);

        const items = order.items || [];

        itemsBox.innerHTML = items.map(item => `

<p>${item.name} × ${item.qty}</p>

`).join("");

    });

}