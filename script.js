const defaultState = {
  budget: 4000,
  isPremium: false,
  goalName: "Dream vacation",
  saved: 2720,
  goal: 4000,
  expenses: [
    { name: "Fresh Market", category: "Food", amount: 86.40 },
    { name: "City Transit", category: "Transport", amount: 45.00 },
    { name: "Design books", category: "Shopping", amount: 64.20 },
    { name: "Electric bill", category: "Home", amount: 118.30 },
    { name: "Movie night", category: "Fun", amount: 32.00 },
  ]
};

const categoryMeta = {
  Food: { icon: "◒", color: "#ff9364", bg: "#fff1e9" },
  Home: { icon: "⌂", color: "#7357ff", bg: "#eeeafd" },
  Transport: { icon: "➜", color: "#5dd39e", bg: "#e9f8f1" },
  Fun: { icon: "★", color: "#f59bb8", bg: "#fdeef4" },
  Health: { icon: "+", color: "#79c7eb", bg: "#ebf7fd" },
  Shopping: { icon: "◇", color: "#f2b84b", bg: "#fff7df" }
};

let state = loadState();
let account = loadAccount();
let accountTab = "signup";

function loadAccount() {
  try {
    return JSON.parse(localStorage.getItem("coinly-account")) || null;
  } catch {
    return null;
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("coinly-state"));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem("coinly-state", JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function totals() {
  const spent = state.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  return { spent, available: state.budget - spent };
}

function render() {
  document.body.classList.toggle("premium-active", Boolean(state.isPremium));
  renderAccount();
  document.getElementById("upgradeButton").textContent = state.isPremium ? "✦ Plus active" : "✦ Upgrade";
  if (state.isPremium) {
    document.getElementById("premiumStatus").textContent = "Active membership · Manage in account";
  } else {
    document.getElementById("premiumStatus").textContent = "Cancel anytime · 7-day money-back guarantee";
  }
  const { spent, available } = totals();
  document.getElementById("spentBalance").textContent = money(spent);
  document.getElementById("budgetBalance").textContent = money(state.budget);
  document.getElementById("availableBalance").textContent = money(available);
  document.getElementById("budgetProgress").style.width = `${Math.min(100, Math.max(0, spent / state.budget * 100))}%`;
  document.getElementById("weeklyAverage").textContent = money(spent / 4);

  document.getElementById("goalName").textContent = state.goalName;
  document.getElementById("savedAmount").textContent = money(state.saved);
  document.getElementById("goalAmount").textContent = money(state.goal);
  const percent = state.goal > 0 ? Math.round(state.saved / state.goal * 100) : 0;
  document.getElementById("savingsPercent").textContent = `${Math.min(percent, 100)}%`;
  document.getElementById("savingsRing").style.background =
    `conic-gradient(var(--purple) 0 ${Math.min(percent, 100)}%, var(--lavender) ${Math.min(percent, 100)}% 100%)`;
  document.getElementById("goalRemaining").textContent =
    state.saved >= state.goal ? "Goal reached! 🎉" : `${money(Math.max(0, state.goal - state.saved))} to go`;

  renderCategories();
  renderTransactions();
  renderExpenseTable();
}

function renderCategories() {
  const sums = {};
  state.expenses.forEach(item => sums[item.category] = (sums[item.category] || 0) + Number(item.amount));
  const total = Object.values(sums).reduce((a, b) => a + b, 0);
  const rows = Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 4);
  document.getElementById("categoryList").innerHTML = rows.length ? rows.map(([category, amount]) => {
    const meta = categoryMeta[category] || categoryMeta.Shopping;
    const percent = total ? Math.round(amount / total * 100) : 0;
    return `<div class="category-row">
      <div class="category-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div>
      <div class="category-info">
        <div class="category-info-top"><strong>${category}</strong><span>${money(amount)}</span></div>
        <div class="category-track"><div class="category-fill" style="width:${percent}%;background:${meta.color}"></div></div>
      </div>
      <span class="category-percent">${percent}%</span>
    </div>`;
  }).join("") : `<p class="category-percent">No expenses yet.</p>`;
}

function renderTransactions() {
  const list = document.getElementById("transactionList");
  list.innerHTML = state.expenses.slice(-6).reverse().map((item, index) => {
    const meta = categoryMeta[item.category] || categoryMeta.Shopping;
    return `<div class="transaction">
      <div class="transaction-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div>
      <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${index === 0 ? "Today" : `${index + 1} days ago`}</small></div>
      <b>−${money(item.amount)}</b>
    </div>`;
  }).join("");
}

function renderExpenseTable() {
  document.getElementById("expenseTable").innerHTML = state.expenses.length
    ? state.expenses.slice().reverse().map(item => `<div class="expense-row">
        <strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)}</span><b>${money(item.amount)}</b>
      </div>`).join("")
    : `<p style="padding:12px;color:var(--muted)">No expenses yet. Add your first one!</p>`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function showView(view) {
  document.querySelectorAll(".nav-item").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  ["overview", "expenses", "savings", "premium"].forEach(name => {
    document.getElementById(`${name}View`).hidden = name !== view;
  });
  const titles = { overview: "Good morning, <span>Owen!</span>", expenses: "Track your <span>expenses</span>", savings: "Grow your <span>savings</span>", premium: "Coinly <span>Plus</span>" };
  document.getElementById("pageTitle").innerHTML = titles[view];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAccount() {
  const avatar = document.getElementById("profileAvatar");
  const name = document.getElementById("profileName");
  const status = document.getElementById("profileStatus");
  const button = document.getElementById("accountButton");
  if (account) {
    const initials = account.name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "CO";
    avatar.textContent = initials;
    name.textContent = account.name;
    status.textContent = state.isPremium ? "Coinly Plus" : "Free account";
    button.textContent = "My account";
  } else {
    avatar.textContent = "OM";
    name.textContent = "My wallet";
    status.textContent = "Create account";
    button.textContent = "Create account";
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

document.getElementById("showExpenses").addEventListener("click", () => showView("expenses"));
document.getElementById("showAllTransactions").addEventListener("click", () => showView("expenses"));

document.getElementById("upgradeButton").addEventListener("click", () => showView("premium"));

let selectedPlan = "monthly";
document.querySelectorAll(".plan-toggle button").forEach(button => {
  button.addEventListener("click", () => {
    selectedPlan = button.dataset.plan;
    document.querySelectorAll(".plan-toggle button").forEach(item => item.classList.toggle("active", item === button));
    if (selectedPlan === "yearly") {
      document.getElementById("premiumPrice").textContent = "$40";
      document.querySelector("#premiumView .premium-price span").textContent = "/year";
      document.getElementById("checkoutPrice").textContent = "$40.00/year";
    } else {
      document.getElementById("premiumPrice").textContent = "$5";
      document.querySelector("#premiumView .premium-price span").textContent = "/month";
      document.getElementById("checkoutPrice").textContent = "$5.00/month";
    }
  });
});

const checkoutDialog = document.getElementById("checkoutDialog");
document.getElementById("buyPremium").addEventListener("click", () => {
  if (state.isPremium) {
    showToast("Your Plus membership is already active");
    return;
  }
  checkoutDialog.showModal();
});
document.getElementById("closeCheckout").addEventListener("click", () => checkoutDialog.close());
document.getElementById("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  state.isPremium = true;
  state.premiumPlan = selectedPlan;
  saveState();
  render();
  checkoutDialog.close();
  showToast("Welcome to Coinly Plus!");
});

document.getElementById("exportCsv").addEventListener("click", () => {
  if (!state.isPremium) {
    showView("premium");
    showToast("Upgrade to unlock CSV export");
    return;
  }
  const csv = ["Expense,Category,Amount", ...state.expenses.map(item =>
    `"${String(item.name).replaceAll('"', '""')}","${item.category}",${item.amount}`
  )].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "coinly-expenses.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported");
});

let darkTheme = false;
document.getElementById("themeButton").addEventListener("click", () => {
  if (!state.isPremium) {
    showToast("Upgrade to unlock premium themes");
    return;
  }
  darkTheme = !darkTheme;
  document.body.style.filter = darkTheme ? "hue-rotate(18deg) saturate(1.08)" : "";
  showToast(darkTheme ? "Premium theme applied" : "Original theme restored");
});

const dialog = document.getElementById("expenseDialog");
document.getElementById("openExpense").addEventListener("click", () => dialog.showModal());
document.getElementById("closeExpense").addEventListener("click", () => dialog.close());

document.getElementById("expenseForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("expenseName").value.trim();
  const amount = Number(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;
  if (!name || !Number.isFinite(amount) || amount <= 0) return;
  state.expenses.push({ name, category, amount });
  saveState();
  render();
  event.currentTarget.reset();
  dialog.close();
  showToast("Expense added");
});

document.getElementById("editGoal").addEventListener("click", () => showView("savings"));
document.getElementById("saveGoal").addEventListener("click", () => {
  const name = document.getElementById("goalNameInput").value.trim();
  const saved = Number(document.getElementById("savedInput").value);
  const goal = Number(document.getElementById("targetInput").value);
  if (!name || !Number.isFinite(saved) || !Number.isFinite(goal) || saved < 0 || goal <= 0) {
    showToast("Check your goal details");
    return;
  }
  state.goalName = name;
  state.saved = saved;
  state.goal = goal;
  saveState();
  render();
  showToast("Savings goal updated");
});

document.getElementById("resetData").addEventListener("click", () => {
  if (!confirm("Reset Coinly to its demo data?")) return;
  state = structuredClone(defaultState);
  localStorage.removeItem("coinly-state");
  document.getElementById("goalNameInput").value = state.goalName;
  document.getElementById("savedInput").value = state.saved;
  document.getElementById("targetInput").value = state.goal;
  render();
  showToast("Demo data restored");
});

const accountDialog = document.getElementById("accountDialog");

function openAccountDialog() {
  const signedIn = Boolean(account);
  document.getElementById("accountTabs")?.classList.toggle("hidden", signedIn);
  const tabs = document.querySelector(".account-tabs");
  tabs.hidden = signedIn;
  document.getElementById("signupFields").hidden = signedIn;
  document.getElementById("accountEmail").parentElement.hidden = signedIn;
  document.getElementById("accountPassword").parentElement.hidden = signedIn;
  document.getElementById("accountSubmit").hidden = signedIn;
  document.getElementById("accountSignedInPanel").hidden = !signedIn;
  if (signedIn) {
    document.getElementById("accountKicker").textContent = "YOUR COINLY ACCOUNT";
    document.getElementById("accountTitle").textContent = "Account";
    document.getElementById("accountSignedInEmail").textContent = account.email;
  } else {
    setAccountTab(accountTab);
  }
  accountDialog.showModal();
}

function setAccountTab(tab) {
  accountTab = tab;
  document.querySelectorAll(".account-tabs button").forEach(button =>
    button.classList.toggle("active", button.dataset.accountTab === tab)
  );
  const isSignup = tab === "signup";
  document.getElementById("accountKicker").textContent = isSignup ? "JOIN COINLY" : "WELCOME BACK";
  document.getElementById("accountTitle").textContent = isSignup ? "Create an account" : "Sign in";
  document.getElementById("accountSubmit").textContent = isSignup ? "Create account" : "Sign in";
  document.getElementById("signupFields").hidden = !isSignup;
  document.getElementById("accountName").required = isSignup;
  document.getElementById("accountPassword").autocomplete = isSignup ? "new-password" : "current-password";
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

document.getElementById("accountButton").addEventListener("click", openAccountDialog);
document.getElementById("profileButton").addEventListener("click", openAccountDialog);
document.getElementById("closeAccount").addEventListener("click", () => accountDialog.close());
document.querySelectorAll(".account-tabs button").forEach(button => {
  button.addEventListener("click", () => setAccountTab(button.dataset.accountTab));
});

document.getElementById("accountForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (account) return;
  const email = document.getElementById("accountEmail").value.trim().toLowerCase();
  const password = document.getElementById("accountPassword").value;
  const passwordHash = await hashPassword(password);
  if (accountTab === "signup") {
    const name = document.getElementById("accountName").value.trim();
    if (!name) {
      showToast("Enter your name");
      return;
    }
    account = { name, email, passwordHash };
    localStorage.setItem("coinly-account", JSON.stringify(account));
    render();
    accountDialog.close();
    showToast(`Welcome, ${name}!`);
  } else {
    const saved = loadAccount();
    if (!saved || saved.email !== email || saved.passwordHash !== passwordHash) {
      showToast("Email or password does not match");
      return;
    }
    account = saved;
    render();
    accountDialog.close();
    showToast(`Welcome back, ${saved.name}!`);
  }
  event.currentTarget.reset();
});

document.getElementById("signOutAccount").addEventListener("click", () => {
  account = null;
  localStorage.removeItem("coinly-account");
  render();
  accountDialog.close();
  showToast("Signed out");
});

const now = new Date();
document.getElementById("dateLabel").textContent = now.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
document.getElementById("monthSelect").textContent = `${now.toLocaleDateString("en-US", { month: "long" })}⌄`;
document.getElementById("goalNameInput").value = state.goalName;
document.getElementById("savedInput").value = state.saved;
document.getElementById("targetInput").value = state.goal;

const tips = ["A tiny daily save adds up.", "Name every expense to spot patterns.", "Pay yourself before you spend.", "A 5-minute review beats a surprise bill."];
let tipIndex = 0;
setInterval(() => {
  tipIndex = (tipIndex + 1) % tips.length;
  document.getElementById("tipText").textContent = tips[tipIndex];
}, 6000);

render();
