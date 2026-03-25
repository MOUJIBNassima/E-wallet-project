import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid, getCardByNum, isCardExpired } from "../Model/database.js";
const user = JSON.parse(sessionStorage.getItem("currentUser"));
// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn=document.getElementById("submitTransferBtn");

// DOM - Rechargement
const topupBtn       = document.getElementById("quickTopup");
const topupSection   = document.getElementById("topupPopup");
const closeTopupBtn  = document.getElementById("closeTopupBtn");
const cancelTopupBtn = document.getElementById("cancelTopupBtn");
const topupCardSelect = document.getElementById("topupCard");
const submitTopupBtn = document.getElementById("submitTopupBtn");
const topupMessage   = document.getElementById("topupMessage");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
  transferBtn.addEventListener("click", handleTransfersection);
  closeTransferBtn.addEventListener("click", closeTransfer);
  cancelTransferBtn.addEventListener("click", closeTransfer);
  submitTransferBtn.addEventListener("click",handleTransfer)

  topupBtn.addEventListener("click", handleTopupSection);
  closeTopupBtn.addEventListener("click", closeTopup);
  cancelTopupBtn.addEventListener("click", closeTopup);
  submitTopupBtn.addEventListener("click", handleTopup);

// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard(){
const dashboardData = getDashboardData();
if (dashboardData) {
  greetingName.textContent = dashboardData.userName;
  currentDate.textContent = dashboardData.currentDate;
  solde.textContent = dashboardData.availableBalance;
  incomeElement.textContent = dashboardData.monthlyIncome;
  expensesElement.textContent = dashboardData.monthlyExpenses;
  activecards.textContent = dashboardData.activeCards;
}
// Display transactions
transactionsList.innerHTML = "";
user.wallet.transactions.forEach(transaction => {
  const transactionItem = document.createElement("div");
  transactionItem.className = "transaction-item";
  transactionItem.innerHTML = `
    <div>${transaction.date}</div>
    <div>${transaction.amount} MAD</div>
    <div>${transaction.type}</div>
  `;
  transactionsList.appendChild(transactionItem);
});

}
renderDashboard();

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();
function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type+"****"+card.numcards;
    sourceCard.appendChild(option);
  });
}

renderCards();

//###################################  Transfer  #####################################################//

// check function 

/* function checkUser(numcompte, callback) {
  setTimeout(() => {
    const destinataire = finduserbyaccount(numcompte);
    if (destinataire) {
      callback(destinataire);
    } else {
      console.log("Destinataire non trouvé");
    }
  }, 500);
}

function checkSolde(exp, amount, callback) {
  setTimeout(() => {
    const solde = exp.wallet.balance;
    if (solde >= amount) {
      callback("Solde suffisant");
    } else {
      callback("Solde insuffisant");
    }
  }, 400);
}

function updateSolde(exp, destinataire, amount, callback) {
  setTimeout(() => {  
    exp.wallet.balance -= amount;
    destinataire.wallet.balance += amount;
    callback("Solde mis à jour");
  }, 300);
}


function addtransactions(exp, destinataire, amount, callback) {
  setTimeout(() => { 
    // Transaction pour l'expéditeur (débit)
    const transactionDebit = {
      id: Date.now(),
      type: "debit",
      amount: amount,
      from: exp.name,
      to: destinataire.name,
      date: new Date().toLocaleDateString()
    };

    // Transaction pour le destinataire (crédit)
    const transactionCredit = {
      id: Date.now() + 1,
      type: "credit",
      amount: amount,
      from: exp.name,
      to: destinataire.name,
      date: new Date().toLocaleDateString()
    };

    user.wallet.transactions.push(transactionDebit);
    destinataire.wallet.transactions.push(transactionCredit);
    renderDashboard();
    callback("Transaction enregistrée");
  }, 200);
}


export function transferer(exp, numcompte, amount) {
  console.log("\n DÉBUT DU TRANSFERT ");

  // Étape 1: Vérifier le destinataire
  checkUser(numcompte, function afterCheckUser(destinataire) {
    console.log("Étape 1: Destinataire trouvé -", destinataire.name);

    // Étape 2: Vérifier le solde
    checkSolde(exp, amount, function afterCheckSolde(soldemessage) {
      console.log(" Étape 2:", soldemessage);

      if (soldemessage.includes("Solde suffisant")) {
        // Étape 3: Mettre à jour les soldes
        updateSolde(exp, destinataire, amount, function afterUpdateSolde(updatemessage) {
          console.log(" Étape 3:", updatemessage);

          // Étape 4: Enregistrer la transaction
          addtransactions(exp, destinataire, amount, function afterAddTransactions(transactionMessage) {
            console.log(" Étape 4:", transactionMessage);
            console.log(`Transfert de ${amount} réussi!`);
          });
        });
      }
    });
  });
}


function handleTransfer(e) {
 e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount=findbeneficiarieByid(user.id,beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

  
  transferer(user, beneficiaryAccount, amount);

} */

function checkUser(numcompte){
  return new Promise((resolve,reject) => {
     setTimeout(()=>{
     const beneficiary=finduserbyaccount(numcompte);
     if(beneficiary){
        resolve(beneficiary);
     }
     else{
        reject("beneficiary not found");
     }
     },2000);
} );}


function checkSolde(expediteur,amount){
  return new Promise((resolve, reject) => {
  setTimeout(()=>{
      if(expediteur.wallet.balance>amount){
        resolve("Sufficient balance");
      }else{
        reject("Insufficient balance");
      }
  },3000)
});}

function updateSolde(expediteur,destinataire,amount){
  return new Promise((resolve) => {
    setTimeout(()=>{
        expediteur.wallet.balance-=amount;
        destinataire.wallet.balance+=amount;
        resolve("update balance done");
  },200);
});}

function addtransactions(expediteur,destinataire,amount){
  return new Promise((resolve) => {
   setTimeout(()=>{
    // create credit transaction
 const credit={
    id:Date.now(),
    type:"credit",
    amount: amount,
    date: Date.now().toLocaleString(),
    from: expediteur.name
 }
 //create debit transaction
const debit={
    id:Date.now(),
    type:"debit",
    amount: amount,
    date: Date.now().toLocaleString(),
    to: destinataire.name, 
 }
  expediteur.wallet.transactions.push(debit);
  destinataire.wallet.transactions.push(credit);
   resolve("transaction added successfully");
   },3000)
});}

// **************************************transfer***************************************************//
function transfer(expediteur, numcompte, amount) {
  checkUser(numcompte) // p0
    .then(destinataire => { //p1
      console.log("Étape 1: Beneficiary found -", destinataire.name);
      return  checkSolde(expediteur, amount) //p2
      .then(() => destinataire); //p3
    })
    .then(destinataire => { //P4
      console.log("Étape 2: Sufficient balance");
      return updateSolde(expediteur, destinataire, amount) //P5
        .then(() => destinataire); //P6
    })
    .then(destinataire => {
      console.log("Étape 3: update balance done");
      return addtransactions(expediteur, destinataire, amount);
    })
    .then(message => {
      console.log("Étape 4:", message);
      renderDashboard();
      closeTransfer();
    })
    .catch(error => {
      console.log("Erreur lors du transfert :", error.message);
    });
}

function handleTransfer(e) {
 e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount=findbeneficiarieByid(user.id,beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

transfer(user, beneficiaryAccount, amount);

} 

/*
    function func1(number,callback){
        console.log("start function");
       if(number%2===0){
        console.log("start callback");
        callback(number);
        console.log("end callback");
       }else{
        
       }
       console.log("end function");
    }

    function produit(number){
        console.log("the result is : ", (number*number));
    }

    func1(4,produit);
    */
  
/*function m_paiement(){
  if(!user){
    alert("L'Utilisateur non authantifié.")
    window.location.href="/index.html";
  }
  if(user.wallet.cards.length == 0){
    alert("L'Utilisateur n'a aucun outil de paiment!!");
    window.location.href="/index.html";
  }
  let today = new Date();
  let expiry = new Date(cards.expiry);
  const selectedCard = user.wallet.cards.find(cards => expiry > today && cards.numcards === selectedCardNumber)
  if (expiry - today < 0) {
    console.log("La carte a expiré !");
    return;
  }
}*/

//RECHARGEMENT

function closeTopup() {
  topupSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTopupSection() {
  topupSection.classList.add("active");
  document.body.classList.add("popup-open");
  renderTopupCards(); // remplir le select des cartes
}

function renderTopupCards() {
  topupCardSelect.innerHTML = '<option value="" disabled selected>Sélectionner une carte</option>';
  user.wallet.cards.forEach(card => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + " " +card.numcards;
    topupCardSelect.appendChild(option);
  });
}

// Étape 1 : Valider la carte ( moyen de paiment + non expirée)
function validateCard(userId, numcard) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = getCardByNum(userId, numcard);
      if (!card) {
        reject("L'utilisateur n'a aucune moyen de paiement.");
      } else if (isCardExpired(card)) {
        reject("Cette carte est expirée.");
      } else {
        resolve(card);
      }
    }, 500);
  });
}

// Étape 2 : Valider le montant
function validateAmount(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!amount || amount <= 0) {
        reject("Le montant doit être supérieur à zéro.");
      } else if (amount < 10 && amount > 5000) {
        reject("Le montant minimum est 10 MAD et le montant maximum est 5000 MAD.");
      } else {
        resolve(amount);
      }
    }, 300);
  });
}

// Étape 3 : Mettre à jour le solde du wallet
function updateWalletBalance(amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      user.wallet.balance += amount;
      resolve("Solde mis à jour.");
    }, 400);
  });
}

// Étape 4 : Enregistrer la transaction de type RECHARGE
function addRechargeTransaction(amount, card) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transaction = {
        id: String(Date.now()),
        type: "recharge",
        amount: amount,
        date: new Date().toLocaleDateString("fr-FR"),
        from: card.type + " ****" + card.numcards.slice(-4),
        to: user.account
      };
      user.wallet.transactions.push(transaction);
      resolve("Transaction RECHARGE enregistrée.");
    }, 300);
  });
}

// Orchestration principale avec Promises chaînées
function recharger(userId, numcard, amount) {
  let validatedCard;

  validateCard(userId, numcard)
    .then(card => {
      console.log("Étape 1 : Carte valide -", card.type);
      validatedCard = card;
      return validateAmount(amount);
    })
    .then(validAmount => {
      console.log("Étape 2 : Montant valide -", validAmount, "MAD");
      return updateWalletBalance(validAmount);
    })
    .then(msg => {
      console.log("Étape 3 :", msg);
      return addRechargeTransaction(amount, validatedCard);
    })
    .then(msg => {
      console.log("Étape 4 :", msg);
      topupMessage.style.color = "green";
      topupMessage.textContent = `Rechargement de ${amount} MAD effectué avec succès !`;
      renderDashboard();
      setTimeout(() => closeTopup(), 1500);
    })
    .catch(erreur => {
      console.error("Erreur rechargement :", erreur);
      topupMessage.style.color = "red";
      topupMessage.textContent =`${erreur}`;
    });
}

function handleTopup(e) {
  e.preventDefault();
  topupMessage.textContent = "";
  const numcard = topupCardSelect.value;
  const amount = Number(document.getElementById("topupAmount").value);
  recharger(user.id, numcard, amount);
}
