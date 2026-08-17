import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    OAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { showAlert } from "./alerts.js";


// =====================================================
// ELEMENTS
// =====================================================

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const goSignup = document.getElementById("goSignup");
const goLogin = document.getElementById("goLogin");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

const phoneLoginBtn = document.getElementById("phoneLoginBtn");
const appleLoginBtn = document.getElementById("appleLoginBtn");

const phoneLoginSection =
    document.getElementById("phoneLoginSection");

const sendOtpBtn =
    document.getElementById("sendOtpBtn");

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");

const phoneNumberInput =
    document.getElementById("phoneNumber");

const otpCodeInput =
    document.getElementById("otpCode");


// =====================================================
// ALREADY LOGGED IN
// =====================================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        window.location.replace("index.html");

    }

});


// =====================================================
// TAB SWITCHING
// =====================================================

function showLogin() {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.add("active");
    signupForm.classList.remove("active");

}

function showSignup() {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.add("active");
    loginForm.classList.remove("active");

}

loginTab.onclick = showLogin;
goLogin.onclick = showLogin;

signupTab.onclick = showSignup;
goSignup.onclick = showSignup;


// =====================================================
// SIGN UP
// =====================================================

signupBtn.onclick = async function () {

    const name =
        document.getElementById("signupName").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const confirmPassword =
        document.getElementById("signupConfirmPassword").value;


    if (!name || !email || !password || !confirmPassword) {

        showAlert(
            "Please fill all fields.",
            "warning"
        );

        return;

    }


    if (name.length < 3) {

        showAlert(
            "Enter a valid name.",
            "warning"
        );

        return;

    }


    if (password.length < 6) {

        showAlert(
            "Password must contain at least 6 characters.",
            "warning"
        );

        return;

    }


    if (password !== confirmPassword) {

        showAlert(
            "Passwords do not match.",
            "warning"
        );

        return;

    }


    try {

        signupBtn.disabled = true;
        signupBtn.textContent = "Creating Account...";


        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;


        // Save customer profile
        await setDoc(
            doc(db, "customers", user.uid),
            {
                uid: user.uid,
                name: name,
                email: email,
                phone: "",
                provider: "password",
                createdAt: serverTimestamp()
            }
        );


        // Keep existing app compatibility
        localStorage.setItem(
            "customerId",
            user.uid
        );

        localStorage.setItem(
            "customerName",
            name
        );

        localStorage.setItem(
            "customerEmail",
            email
        );

        localStorage.removeItem("customerPhone");


        showAlert(
            "Account created successfully!",
            "success"
        );


        setTimeout(() => {

            window.location.replace("index.html");

        }, 700);


    } catch (error) {

        console.error(error);

        let message = "Unable to create account.";

        if (error.code === "auth/email-already-in-use") {
            message = "This email is already registered.";
        }

        if (error.code === "auth/invalid-email") {
            message = "Please enter a valid email.";
        }

        if (error.code === "auth/weak-password") {
            message = "Password is too weak.";
        }


        showAlert(message, "error");


    } finally {

        signupBtn.disabled = false;
        signupBtn.textContent = "Create Account";

    }

};


// =====================================================
// EMAIL LOGIN
// =====================================================

loginBtn.onclick = async function () {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    if (!email || !password) {

        showAlert(
            "Enter your email and password.",
            "warning"
        );

        return;

    }


    try {

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";


        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;


        const customerRef =
            doc(db, "customers", user.uid);

        const customerSnap =
            await getDoc(customerRef);


        if (customerSnap.exists()) {

            const customer =
                customerSnap.data();


            localStorage.setItem(
                "customerId",
                user.uid
            );

            localStorage.setItem(
                "customerName",
                customer.name || ""
            );

            localStorage.setItem(
                "customerEmail",
                user.email || ""
            );

            localStorage.setItem(
                "customerPhone",
                customer.phone || ""
            );

        } else {

            localStorage.setItem(
                "customerId",
                user.uid
            );

            localStorage.setItem(
                "customerEmail",
                user.email || ""
            );

        }


        window.location.replace("index.html");


    } catch (error) {

        console.error(error);

        let message = "Login failed.";

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {

            message =
                "Incorrect email or password.";

        }


        showAlert(
            message,
            "error"
        );


    } finally {

        loginBtn.disabled = false;
        loginBtn.textContent = "Login";

    }

};


// =====================================================
// PHONE LOGIN UI
// =====================================================

phoneLoginBtn.onclick = function () {

    phoneLoginSection.style.display = "block";

    phoneLoginBtn.style.display = "none";

};


// =====================================================
// FIREBASE PHONE OTP
// =====================================================

let confirmationResult = null;
let recaptchaVerifier = null;


function setupRecaptcha() {

    if (recaptchaVerifier) {
        return;
    }


    recaptchaVerifier =
        new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "normal",

                callback: () => {

                    console.log(
                        "✅ reCAPTCHA verified"
                    );

                },

                "expired-callback": () => {

                    showAlert(
                        "reCAPTCHA expired. Please try again.",
                        "warning"
                    );

                }

            }
        );


    recaptchaVerifier.render();

}


sendOtpBtn.onclick = async function () {

    let phone =
        phoneNumberInput.value.trim();


    if (!phone) {

        showAlert(
            "Enter your phone number.",
            "warning"
        );

        return;

    }


    // Sri Lankan number
    // 0771234567 → +94771234567

    if (
        phone.startsWith("0") &&
        phone.length === 10
    ) {

        phone =
            "+94" + phone.substring(1);

    }


    if (!/^\+\d{10,15}$/.test(phone)) {

        showAlert(
            "Enter a valid phone number. Example: +94771234567",
            "warning"
        );

        return;

    }


    try {

        setupRecaptcha();


        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "Sending OTP...";


        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                phone,
                recaptchaVerifier
            );


        otpCodeInput.style.display = "block";
        verifyOtpBtn.style.display = "block";


        showAlert(
            "OTP sent successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showAlert(
            error.message || "Unable to send OTP.",
            "error"
        );


        if (recaptchaVerifier) {

            try {

                recaptchaVerifier.clear();

            } catch (e) {}

            recaptchaVerifier = null;

        }

    } finally {

        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Send OTP";

    }

};


// =====================================================
// VERIFY PHONE OTP
// =====================================================

verifyOtpBtn.onclick = async function () {

    const code =
        otpCodeInput.value.trim();


    if (!confirmationResult) {

        showAlert(
            "Please request an OTP first.",
            "warning"
        );

        return;

    }


    if (!/^\d{6}$/.test(code)) {

        showAlert(
            "Enter the 6-digit OTP.",
            "warning"
        );

        return;

    }


    try {

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = "Verifying...";


        const result =
            await confirmationResult.confirm(code);


        const user = result.user;


        const customerRef =
            doc(db, "customers", user.uid);

        const customerSnap =
            await getDoc(customerRef);


        if (!customerSnap.exists()) {

            await setDoc(
                customerRef,
                {
                    uid: user.uid,
                    name: "",
                    email: user.email || "",
                    phone: user.phoneNumber || "",
                    provider: "phone",
                    createdAt: serverTimestamp()
                }
            );

        }


        localStorage.setItem(
            "customerId",
            user.uid
        );

        localStorage.setItem(
            "customerPhone",
            user.phoneNumber || ""
        );

        localStorage.setItem(
            "customerName",
            customerSnap.exists()
                ? customerSnap.data().name || ""
                : ""
        );


        window.location.replace("index.html");


    } catch (error) {

        console.error(error);

        showAlert(
            "Invalid or expired OTP.",
            "error"
        );


    } finally {

        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "Verify OTP";

    }

};


// =====================================================
// APPLE LOGIN
// =====================================================

appleLoginBtn.onclick = async function () {

    try {

        appleLoginBtn.disabled = true;
        appleLoginBtn.textContent = "Connecting...";


        const provider =
            new OAuthProvider("apple.com");


        provider.addScope("email");
        provider.addScope("name");


        const result =
            await signInWithPopup(
                auth,
                provider
            );


        const user = result.user;


        const customerRef =
            doc(db, "customers", user.uid);

        const customerSnap =
            await getDoc(customerRef);


        if (!customerSnap.exists()) {

            await setDoc(
                customerRef,
                {
                    uid: user.uid,
                    name: user.displayName || "",
                    email: user.email || "",
                    phone: user.phoneNumber || "",
                    provider: "apple",
                    createdAt: serverTimestamp()
                }
            );

        }


        localStorage.setItem(
            "customerId",
            user.uid
        );

        localStorage.setItem(
            "customerName",
            user.displayName || ""
        );

        localStorage.setItem(
            "customerEmail",
            user.email || ""
        );


        window.location.replace("index.html");


    } catch (error) {

        console.error(error);

        showAlert(
            error.message || "Apple login failed.",
            "error"
        );


    } finally {

        appleLoginBtn.disabled = false;
        appleLoginBtn.innerHTML =
            " Continue with Apple";

    }

};
