export function showAlert(message, type = "info") {

    return Swal.fire({

        text: message,

        icon: type,

        confirmButtonText: "OK",

        confirmButtonColor: "#ff9800",

        background: "#1f1f1f",

        color: "#ffffff",

        customClass: {
            popup: "hightech-alert"
        }

    });

}