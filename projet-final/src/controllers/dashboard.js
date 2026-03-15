// RECUPERATION UTILISATEUR depuis sessionStorage
const user = JSON.parse(sessionStorage.getItem("currentUser"));

// si aucun utilisateur connecte → redirection vers login
if (!user) {
    document.location = "login.html";
}

// VUE D'ENSEMBLE — affichage des données

// nom de l'utilisateur
const greetingName = document.getElementById("greetingName");
greetingName.textContent = user.name;

// date actuelle
const currentDate = document.getElementById("currentDate");
const today = new Date();
currentDate.textContent = today.toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
});

// solde disponible
const availableBalance = document.getElementById("availableBalance");
availableBalance.textContent = user.wallet.balance + " " + user.wallet.currency;

// nombre de cartes actives
const activeCards = document.getElementById("activeCards");
activeCards.textContent = user.wallet.cards.length;

// CALCUL REVENUS — transactions de type credit
const creditTransactions = user.wallet.transactions
    .filter((t) => t.type === "credit");

const monthlyIncome = creditTransactions.reduce((total, t) => {
    return total + t.amount;
}, 0);

document.getElementById("monthlyIncome").textContent = monthlyIncome + " MAD";

// CALCUL DEPENSES — transactions de type debit
const debitTransactions = user.wallet.transactions
    .filter((t) => t.type === "debit");

const monthlyExpenses = debitTransactions.reduce((total, t) => {
    return total + t.amount;
}, 0);

document.getElementById("monthlyExpenses").textContent = monthlyExpenses + " MAD";

// TRANSACTIONS RECENTES — section overview
const recentTransactionsList = document.getElementById("recentTransactionsList");

user.wallet.transactions.forEach((t) => {
    const item  = document.createElement("div");
    item.classList.add("transaction-item");

    const sign  = t.type === "credit" ? "+" : "-";
    const color = t.type === "credit" ? "#2e7d32" : "#c62828";

    item.innerHTML = `
        <div class="transaction-icon ${t.type}">
            <i class="fas fa-${t.type === "credit" ? "arrow-down" : "arrow-up"}"></i>
        </div>
        <div class="transaction-details">
            <span class="transaction-name">${t.from} → ${t.to}</span>
            <span class="transaction-date">${t.date}</span>
        </div>
        <span class="transaction-amount" style="color:${color};">
            ${sign}${t.amount} MAD
        </span>
    `;
    recentTransactionsList.appendChild(item);
});

// TOUTES LES TRANSACTIONS — section transactions
const allTransactionsList = document.getElementById("allTransactionsList");

user.wallet.transactions.forEach((t) => {
    const item  = document.createElement("div");
    item.classList.add("transaction-item");

    const sign  = t.type === "credit" ? "+" : "-";
    const color = t.type === "credit" ? "#2e7d32" : "#c62828";

    item.innerHTML = `
        <div class="transaction-icon ${t.type}">
            <i class="fas fa-${t.type === "credit" ? "arrow-down" : "arrow-up"}"></i>
        </div>
        <div class="transaction-details">
            <span class="transaction-name">${t.from} → ${t.to}</span>
            <span class="transaction-date">${t.date}</span>
        </div>
        <span class="transaction-amount" style="color:${color};">
            ${sign}${t.amount} MAD
        </span>
    `;
    allTransactionsList.appendChild(item);
});

// MES CARTES — section cards
const cardsGrid = document.getElementById("cardsGrid");

user.wallet.cards.forEach((card) => {
    const cardItem = document.createElement("div");
    cardItem.classList.add("card-item");

    cardItem.innerHTML = `
        <div class="card-preview ${card.type}">
            <div class="card-chip"></div>
            <div class="card-type">${card.type.toUpperCase()}</div>
            <div class="card-number">**** **** **** ${card.numcards.slice(-4)}</div>
            <div class="card-holder">${user.name}</div>
            <div class="card-expiry">${card.expiry}</div>
        </div>
        <div class="card-actions">
            <button class="card-action" title="Définir par défaut">
                <i class="fas fa-star"></i>
            </button>
            <button class="card-action" title="Geler la carte">
                <i class="fas fa-snowflake"></i>
            </button>
            <button class="card-action" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    cardsGrid.appendChild(cardItem);
});

// REMPLIR SELECT CARTE SOURCE — section transferts
const sourceCardSelect = document.getElementById("sourceCard");

user.wallet.cards.forEach((card) => {
    const opt = document.createElement("option");
    opt.value = card.numcards;
    opt.textContent = card.type.toUpperCase() + " - **** " + card.numcards.slice(-4);
    sourceCardSelect.appendChild(opt);
});

// REMPLIR SELECT BENEFICIAIRES — depuis sessionStorage
const beneficiarySelect = document.getElementById("beneficiary");

// recuperer la liste des beneficiaires sauvegardes
// chaque beneficiaire : { name, card, email }
let savedBeneficiaries = JSON.parse(sessionStorage.getItem("beneficiaries")) || [
    { name: "Ahmed",  card: "124847", email: "ahmed@example.com"  },
    { name: "Amazon", card: "000001", email: "contact@amazon.com" }
];

function renderBeneficiaries() {
    beneficiarySelect.innerHTML = `<option value="" disabled selected>Choisir un bénéficiaire</option>`;
    savedBeneficiaries.forEach((b, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = b.name + " — " + b.card;
        beneficiarySelect.appendChild(opt);
    });
}

renderBeneficiaries();

// FRAIS TRANSFERT INSTANTANE
const INSTANT_TRANSFER_FEES = 13.4;

// recuperation de la checkbox et du champ montant
const instantTransferCheckbox = document.getElementById("instantTransfer");
const amountInput             = document.getElementById("amount");

// mise a jour de l'affichage des frais quand la checkbox change
instantTransferCheckbox.addEventListener("change", () => {
    updateTotalDisplay();
});

// mise a jour de l'affichage des frais quand le montant change
amountInput.addEventListener("input", () => {
    updateTotalDisplay();
});

// affiche le montant total (montant + frais si instantane coche)
function updateTotalDisplay() {
    const amount  = parseFloat(amountInput.value) || 0;
    let totalEl   = document.getElementById("totalAmountDisplay");

    // creer l'element d'affichage s'il n'existe pas encore
    if (!totalEl) {
        totalEl = document.createElement("p");
        totalEl.id = "totalAmountDisplay";
        totalEl.style.cssText = "font-size:0.9rem; color:#555; margin-top:6px;";
        amountInput.parentElement.appendChild(totalEl);
    }

    if (instantTransferCheckbox.checked && amount > 0) {
        const total = amount + INSTANT_TRANSFER_FEES;
        totalEl.textContent = `Total débité : ${total.toFixed(2)} MAD (dont ${INSTANT_TRANSFER_FEES} MAD de frais instantané)`;
        totalEl.style.color = "#c62828";
    } else {
        totalEl.textContent = "";
    }
}

// MODAL — Ajouter un nouveau bénéficiaire
const beneficiaryModal      = document.getElementById("beneficiaryModal");
const addBeneficiaryBtn     = document.getElementById("addBeneficiaryBtn");
const closeModalBtn         = document.getElementById("closeModalBtn");
const cancelModalBtn        = document.getElementById("cancelModalBtn");
const confirmAddBeneficiary = document.getElementById("confirmAddBeneficiaryBtn");

// ouvrir le modal
addBeneficiaryBtn.addEventListener("click", () => {
    beneficiaryModal.style.display = "flex";
});

// fermer le modal
closeModalBtn.addEventListener("click", () => {
    beneficiaryModal.style.display = "none";
    clearModal();
});

cancelModalBtn.addEventListener("click", () => {
    beneficiaryModal.style.display = "none";
    clearModal();
});

// confirmer l'ajout du beneficiaire
confirmAddBeneficiary.addEventListener("click", () => {
    const name  = document.getElementById("beneficiaryName").value.trim();
    const card  = document.getElementById("beneficiaryCard").value.trim();
    const email = document.getElementById("beneficiaryEmail").value.trim();

    if (!name || !card || !email) {
        showToast("Veuillez remplir tous les champs.");
        return;
    }

    // verifier si le beneficiaire existe deja
    const exists = savedBeneficiaries.find((b) => b.card === card);
    if (exists) {
        showToast("Ce bénéficiaire existe déjà.");
        return;
    }

    // ajouter le nouveau beneficiaire
    savedBeneficiaries.push({ name, card, email });
    sessionStorage.setItem("beneficiaries", JSON.stringify(savedBeneficiaries));
    renderBeneficiaries();

    // selectionner automatiquement le nouveau beneficiaire
    beneficiarySelect.value = savedBeneficiaries.length - 1;

    beneficiaryModal.style.display = "none";
    clearModal();
    showToast("Bénéficiaire ajouté avec succès !");
});

// vider les champs du modal
function clearModal() {
    document.getElementById("beneficiaryName").value  = "";
    document.getElementById("beneficiaryCard").value  = "";
    document.getElementById("beneficiaryEmail").value = "";
}

// NAVIGATION SIDEBAR
const sidebarLinks = document.querySelectorAll(".sidebar-nav a");
const sections     = document.querySelectorAll(".dashboard-section");

sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
        const target = link.getAttribute("data-target");

        // si support → toast
        if (target === "support") {
            showToast("Cette fonctionnalité n'est pas encore disponible.");
            return;
        }

        // retirer active de tous les liens et sections
        sidebarLinks.forEach((l) => l.parentElement.classList.remove("active"));
        sections.forEach((s) => s.classList.remove("active"));

        // activer le lien cliqué et sa section correspondante
        link.parentElement.classList.add("active");
        document.getElementById(target).classList.add("active");
    });
});

// BOUTONS RAPIDES — actions rapides overview

// helper : naviguer vers une section depuis les boutons rapides
function goToSection(targetId) {
    sidebarLinks.forEach((l) => l.parentElement.classList.remove("active"));
    sections.forEach((s) => s.classList.remove("active"));
    document.getElementById(targetId).classList.add("active");
}

document.getElementById("quickTransfer").addEventListener("click", () => {
    goToSection("transfers");
});

document.getElementById("quickTopup").addEventListener("click", () => {
    showToast("Cette fonctionnalité n'est pas encore disponible.");
});

document.getElementById("quickRequest").addEventListener("click", () => {
    showToast("Cette fonctionnalité n'est pas encore disponible.");
});

// FONCTION TRANSFER — callbacks imbriques (Async)
const transferForm = document.getElementById("transferForm");

// verrou anti double-clic
let isTransferring = false;

transferForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // bloquer si un transfert est deja en cours
    if (isTransferring) {
        showToast("Un transfert est déjà en cours, veuillez patienter.");
        return;
    }

    transfer();
});

function transfer() {
    const amount            = parseFloat(document.getElementById("amount").value);
    const sourceCardNum     = document.getElementById("sourceCard").value;
    const selectedIndex     = document.getElementById("beneficiary").value;
    const isInstant         = instantTransferCheckbox.checked;

    // calcul du montant total avec frais si transfert instantane
    const fees              = isInstant ? INSTANT_TRANSFER_FEES : 0;
    const totalAmount       = amount + fees;

    // recuperer le beneficiaire selectionne depuis la liste
    const selectedBenef     = savedBeneficiaries[selectedIndex];
    const beneficiary       = selectedBenef ? selectedBenef.name : null;

    // confirmation avant envoi si transfert instantane
    if (isInstant) {
        const confirmed = confirm(
            `Transfert instantané sélectionné.\n\n` +
            `Montant : ${amount} MAD\n` +
            `Frais instantané : ${INSTANT_TRANSFER_FEES} MAD\n` +
            `─────────────────────\n` +
            `Total débité : ${totalAmount.toFixed(2)} MAD\n\n` +
            `Confirmer le transfert ?`
        );
        if (!confirmed) return;
    }

    // activer le verrou
    isTransferring = true;

    // checkAmount — on vérifie le montant saisi (sans les frais)
    checkAmount(amount, () => {

        // checkSolde — on vérifie que le solde couvre montant + frais
        checkSolde(sourceCardNum, totalAmount, () => {

            // checkBeneficiaire
            checkBeneficiaire(beneficiary, () => {

                // creationTransaction — on enregistre le montant total
                creationTransaction(sourceCardNum, totalAmount, beneficiary, isInstant, () => {

                    // debitCredit — on débite le montant total (montant + frais)
                    debitCredit(sourceCardNum, totalAmount, () => {

                        // mise a jour affichage + sessionStorage
                        sessionStorage.setItem("currentUser", JSON.stringify(user));
                        availableBalance.textContent = user.wallet.balance + " " + user.wallet.currency;

                        // message de succes adapte selon le type de transfert
                        const successMsg = isInstant
                            ? `Transfert instantané effectué avec succès !\nMontant : ${amount} MAD + ${INSTANT_TRANSFER_FEES} MAD de frais = ${totalAmount.toFixed(2)} MAD débités.`
                            : "Transfert effectué avec succès !";

                        showToast(successMsg);
                        transferForm.reset();

                        // remettre a zero l'affichage du total
                        const totalEl = document.getElementById("totalAmountDisplay");
                        if (totalEl) totalEl.textContent = "";

                        // liberer le verrou
                        isTransferring = false;
                    });
                });
            });
        });
    });
}

// verifier le montant
function checkAmount(amount, callback) {
    if (!amount || amount <= 0) {
        showToast("Montant invalide.");
        isTransferring = false;
        return;
    }
    callback();
}

// verifier le solde — setTimeout simulation asynchrone
// le parametre amount contient deja le total (montant + frais eventuels)
function checkSolde(sourceCardNum, amount, callback) {
    const sourceCard = user.wallet.cards.find((c) => c.numcards === sourceCardNum);

    if (!sourceCard) {
        showToast("Carte introuvable.");
        isTransferring = false;
        return;
    }

    setTimeout(() => {
        if (parseFloat(sourceCard.balance) < amount) {
            showToast(`Solde insuffisant. Solde disponible : ${sourceCard.balance} MAD, montant requis : ${amount.toFixed(2)} MAD.`);
            isTransferring = false;
            return;
        }
        callback();
    }, 1000);
}

// verifier le beneficiaire
function checkBeneficiaire(beneficiary, callback) {
    if (!beneficiary) {
        showToast("Veuillez choisir un bénéficiaire.");
        isTransferring = false;
        return;
    }
    callback();
}

// creation de la transaction
// isInstant est stocké dans la transaction pour l'historique
function creationTransaction(sourceCardNum, totalAmount, beneficiary, isInstant, callback) {
    const newTransaction = {
        id:      String(user.wallet.transactions.length + 1),
        type:    "debit",
        amount:  totalAmount,
        instant: isInstant,
        date:    (() => {
            const d  = new Date();
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yy = String(d.getFullYear()).slice(-2);
            return dd + "-" + mm + "-" + yy;
        })(),
        from:    sourceCardNum,
        to:      beneficiary
    };
    user.wallet.transactions.push(newTransaction);
    callback();
}

// debit — mise a jour du solde de la carte et du wallet
// totalAmount inclut les frais si transfert instantane
function debitCredit(sourceCardNum, totalAmount, callback) {
    const sourceCard    = user.wallet.cards.find((c) => c.numcards === sourceCardNum);
    sourceCard.balance  = String(parseFloat(sourceCard.balance) - totalAmount);
    user.wallet.balance = user.wallet.balance - totalAmount;
    callback();
}

// TOAST — message en bas a droite
function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #333;
        color: #fff;
        padding: 14px 22px;
        border-radius: 10px;
        font-size: 0.95rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.4s ease;
        max-width: 320px;
        line-height: 1.5;
    `;
    document.body.appendChild(toast);

    setTimeout(() => { toast.style.opacity = "1"; }, 50);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { document.body.removeChild(toast); }, 400);
    }, 3000);
}
