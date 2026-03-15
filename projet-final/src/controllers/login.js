import finduserbymail from "../models/database.js";

// recuperation des elements DOM
const mailInput = document.getElementById("mail");
const password  = document.getElementById("password");
const submitBtn = document.getElementById("submitbtn");
const display   = document.getElementById("display");

// toggle visibilite du mot de passe
display.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
});

// event listener sur le bouton Se connecter
submitBtn.addEventListener("click", handleSubmit);

function handleSubmit() {
    let mail = mailInput.value;
    let pass = password.value;

    if (!mail || pass === "") {
        alert("Bad credentials.");
    } else {
        submitBtn.textContent = "Checking!!!";
        const user = finduserbymail(mail, pass);

        setTimeout(() => {
            if (user) {
                sessionStorage.setItem("currentUser", JSON.stringify(user));
                document.location = "dashboard.html";
            } else {
                alert("Bad credentials.");
                submitBtn.textContent = "Se connecter";
            }
        }, 2000);
    }
}
