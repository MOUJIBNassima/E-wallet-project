import {
  getbeneficiaries,
  finduserbyaccount,
  findbeneficiarieByid,
} from "../models/database.js";

// ─── User guard ───────────────────────────────────────────────────────────────
let user = JSON.parse(sessionStorage.getItem("currentUser"));
if (!user) {
  alert("Utilisateur non authentifié.");
  window.location.href = "index.html";
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const greetingName      = document.getElementById("greetingName");
const currentDateEl     = document.getElementById("currentDate");
const soldeEl           = document.getElementById("availableBalance");
const incomeEl          = document.getElementById("monthlyIncome");
const expensesEl        = document.getElementById("monthlyExpenses");
const activeCardsEl     = document.getElementById("activeCards");
const recentTxList      = document.getElementById("recentTransactionsList");
const allTxList         = document.getElementById("allTransactionsList");
const cardsGrid         = document.getElementById("cardsGrid");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCardSelect  = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");
const addBeneficiaryBtn = document.getElementById("addBeneficiaryBtn");
const beneficiaryModal  = document.getElementById("beneficiaryModal");
const closeModalBtn     = document.getElementById("closeModalBtn");
const cancelModalBtn    = document.getElementById("cancelModalBtn");
const confirmAddBtn     = document.getElementById("confirmAddBeneficiaryBtn");

// ─── Sidebar navigation ───────────────────────────────────────────────────────
document.querySelectorAll(".sidebar-nav a[data-target]").forEach(link => {
  link.addEventListener("click", () => {
    activateSection(link.getAttribute("data-target"));
  });
});

document.getElementById("quickTransfer")?.addEventListener("click", () =>
  activateSection("transfers")
);

function activateSection(id) {
  document.querySelectorAll(".dashboard-section").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id)?.classList.add("active");

  document.querySelectorAll(".sidebar-nav li").forEach(li =>
    li.classList.remove("active")
  );
  document.querySelector(`.sidebar-nav a[data-target="${id}"]`)
    ?.closest("li")?.classList.add("active");
}

// ─── Dashboard data ───────────────────────────────────────────────────────────
function getDashboardData() {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    userName        : user.name,
    currentDate     : new Date().toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards     : user.wallet.cards.length,
    monthlyIncome   : `${monthlyIncome} MAD`,
    monthlyExpenses : `${monthlyExpenses} MAD`,
  };
}

// ─── Render : transaction item ────────────────────────────────────────────────
function buildTransactionItem(transaction) {
  const isCredit = transaction.type === "credit";

  const dateStr = transaction.date
    ? new Date(transaction.date).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "2-digit",
      })
    : "";

  // user.account est le numéro de compte (structure ta DB)
  const fromTo = isCredit
    ? `De : ${transaction.from} → ${user.account}`
    : `De : ${user.account} → ${transaction.to}`;

  const item = document.createElement("div");
  item.className = "transaction-item";
  item.innerHTML = `
    <span class="tx-type ${isCredit ? "tx-credit" : "tx-debit"}">${transaction.type}</span>
    <span class="tx-date">${dateStr}</span>
    <span class="tx-from-to">${fromTo}</span>
    <span class="tx-amount ${isCredit ? "amount-credit" : "amount-debit"}">
      ${isCredit ? "+" : "-"}${transaction.amount} MAD
    </span>`;
  return item;
}

function renderTransactions(container, transactions) {
  if (!container) return;
  container.innerHTML = "";
  if (!transactions.length) {
    container.innerHTML =
      "<p style='color:var(--color-text-tertiary);text-align:center;padding:2rem;'>Aucune transaction.</p>";
    return;
  }
  transactions.forEach(tx => container.appendChild(buildTransactionItem(tx)));
}

// ─── Render : cards grid ──────────────────────────────────────────────────────
function renderCards() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = "";
  user.wallet.cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `
      <div class="card-type">${card.type.toUpperCase()}</div>
      <div class="card-number">**** **** **** ${card.numcards.slice(-4)}</div>
      <div class="card-expiry">Exp. ${card.expiry}</div>
      <div class="card-balance">${card.balance} MAD</div>`;
    cardsGrid.appendChild(div);
  });
}

// ─── Render : beneficiaries select ───────────────────────────────────────────
function renderBeneficiaries() {
  while (beneficiarySelect.options.length > 1) beneficiarySelect.remove(1);
  // getbeneficiaries(id) → user.wallet.beneficiaries
  getbeneficiaries(user.id).forEach(b => {
    const opt = document.createElement("option");
    opt.value       = b.id;
    opt.textContent = `${b.name} — ${b.account}`;
    beneficiarySelect.appendChild(opt);
  });
}

// ─── Render : source cards select ────────────────────────────────────────────
function renderSourceCards() {
  while (sourceCardSelect.options.length > 1) sourceCardSelect.remove(1);
  user.wallet.cards.forEach(card => {
    const opt = document.createElement("option");
    opt.value       = card.numcards;
    opt.textContent = `${card.type.toUpperCase()} ****${card.numcards.slice(-4)}`;
    sourceCardSelect.appendChild(opt);
  });
}

// ─── Full dashboard render ────────────────────────────────────────────────────
function renderDashboard() {
  const data = getDashboardData();
  greetingName.textContent  = data.userName;
  currentDateEl.textContent = data.currentDate;
  soldeEl.textContent       = data.availableBalance;
  incomeEl.textContent      = data.monthlyIncome;
  expensesEl.textContent    = data.monthlyExpenses;
  activeCardsEl.textContent = data.activeCards;

  const txSorted = [...user.wallet.transactions].reverse(); // plus récente en premier
  renderTransactions(recentTxList, txSorted.slice(0, 5));
  renderTransactions(allTxList, txSorted);
  renderCards();
  renderBeneficiaries();
  renderSourceCards();
}

renderDashboard();

// ═══════════════════════════════════════════════════════════════════════════════
//  TRANSFER — Promise chain
// ═══════════════════════════════════════════════════════════════════════════════

// Étape 1 : vérifier le destinataire via user.account
function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dest = finduserbyaccount(numcompte);
      dest
        ? resolve(dest)
        : reject(new Error("Destinataire introuvable."));
    }, 500);
  });
}

// Étape 2 : vérifier le solde
function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      expediteur.wallet.balance >= amount
        ? resolve("Solde suffisant")
        : reject(new Error(
            `Solde insuffisant. Solde actuel : ${expediteur.wallet.balance} MAD.`
          ));
    }, 300);
  });
}

// Étape 3 : mettre à jour les soldes
function updateSolde(expediteur, destinataire, amount) {
  return new Promise(resolve => {
    setTimeout(() => {
      expediteur.wallet.balance  -= amount;
      destinataire.wallet.balance += amount;
      resolve("Soldes mis à jour");
    }, 200);
  });
}

// Étape 4 : enregistrer les transactions des deux côtés
function addtransactions(expediteur, destinataire, amount) {
  return new Promise(resolve => {
    setTimeout(() => {
      const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      // Débit chez l'expéditeur
      expediteur.wallet.transactions.push({
        id    : String(Date.now()),
        type  : "debit",
        amount,
        date  : today,
        from  : expediteur.account,   // user.account  (ta structure)
        to    : destinataire.name,
      });

      // Crédit chez le destinataire
      destinataire.wallet.transactions.push({
        id    : String(Date.now() + 1),
        type  : "credit",
        amount,
        date  : today,
        from  : expediteur.name,
        to    : destinataire.account, // user.account  (ta structure)
      });

      // Synchroniser sessionStorage
      sessionStorage.setItem("currentUser", JSON.stringify(expediteur));

      resolve("Transaction enregistrée");
    }, 200);
  });
}

// Orchestration
function transfer(expediteur, numcompte, amount) {
  console.log("=== DÉBUT DU TRANSFERT ===");
  setTransferLoading(true);

  checkUser(numcompte)
    .then(destinataire => {
      console.log("Étape 1 : Destinataire trouvé —", destinataire.name);
      return checkSolde(expediteur, amount)
        .then(msg => {
          console.log("Étape 2 :", msg);
          return updateSolde(expediteur, destinataire, amount);
        })
        .then(msg => {
          console.log("Étape 3 :", msg);
          return addtransactions(expediteur, destinataire, amount);
        })
        .then(msg => {
          console.log("Étape 4 :", msg);
          renderDashboard();
          setTransferLoading(false);
          alert(`✔ Transfert de ${amount} MAD vers ${destinataire.name} réussi !`);
          document.getElementById("transferForm")?.reset();
          activateSection("overview");
        });
    })
    .catch(err => {
      console.error("✘ Erreur :", err.message);
      alert("Erreur : " + err.message);
      setTransferLoading(false);
    });
}

function setTransferLoading(loading) {
  if (!submitTransferBtn) return;
  submitTransferBtn.disabled    = loading;
  submitTransferBtn.textContent = loading ? "Envoi en cours..." : " Transférer";
}

function handleTransfer(e) {
  e.preventDefault();

  const beneficiaryId = beneficiarySelect.value;
  if (!beneficiaryId) { alert("Veuillez choisir un bénéficiaire."); return; }

  const amount = Number(document.getElementById("amount").value);
  if (!amount || amount <= 0) { alert("Montant invalide."); return; }

  // findbeneficiarieByid(userId, beneficiaryId)
  const bene = findbeneficiarieByid(user.id, beneficiaryId);
  if (!bene) { alert("Bénéficiaire introuvable."); return; }

  transfer(user, bene.account, amount);
}

submitTransferBtn?.addEventListener("click", handleTransfer);

// ─── Beneficiary modal ────────────────────────────────────────────────────────
function openModal()  { if (beneficiaryModal) beneficiaryModal.style.display = "flex"; }
function closeModal() { if (beneficiaryModal) beneficiaryModal.style.display = "none"; }

addBeneficiaryBtn?.addEventListener("click", openModal);
closeModalBtn?.addEventListener("click",  closeModal);
cancelModalBtn?.addEventListener("click", closeModal);

confirmAddBtn?.addEventListener("click", () => {
  const name    = document.getElementById("beneficiaryName")?.value.trim();
  const account = document.getElementById("beneficiaryCard")?.value.trim().replace(/\s/g, "");

  if (!name || !account) { alert("Nom et numéro de compte requis."); return; }

  // Ajouter directement dans user.wallet.beneficiaries  (ta structure)
  user.wallet.beneficiaries.push({
    id: String(Date.now()),
    name,
    account,
  });

  sessionStorage.setItem("currentUser", JSON.stringify(user));
  renderBeneficiaries();
  closeModal();
  alert(`Bénéficiaire "${name}" ajouté avec succès !`);

  document.getElementById("beneficiaryName").value = "";
  document.getElementById("beneficiaryCard").value = "";
  const emailEl = document.getElementById("beneficiaryEmail");
  if (emailEl) emailEl.value = "";
});
