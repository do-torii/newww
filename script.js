const incomeRules = {
  low: {
    label: "총급여 2,400만원 이하 / 종합소득 1,600만원 이하",
    limit: 400000,
    rate: 0.06,
  },
  midLow: {
    label: "총급여 3,600만원 이하 / 종합소득 2,600만원 이하",
    limit: 500000,
    rate: 0.046,
  },
  mid: {
    label: "총급여 4,800만원 이하 / 종합소득 3,600만원 이하",
    limit: 600000,
    rate: 0.037,
  },
  midHigh: {
    label: "총급여 6,000만원 이하 / 종합소득 4,800만원 이하",
    limit: 700000,
    rate: 0.03,
  },
  high: {
    label: "정부기여금 대상 아님",
    limit: 0,
    rate: 0,
  },
};

const MAX_PAYMENT = 700000;
const GOV2_RATE = 0.03;
const GOV2_START = { year: 2025, month: 1 };

const CHECK_DATE = { year: 2026, month: 7 };
const TOTAL_MONTHS = 60;

const startYearEl = document.getElementById("startYear");
const startMonthEl = document.getElementById("startMonth");
const remainingMonthsEl = document.getElementById("remainingMonths");
const incomeYearsEl = document.getElementById("incomeYears");
const bonusRateEl = document.getElementById("bonusRate");
const bulkPaymentEl = document.getElementById("bulkPayment");
const paymentRowsEl = document.getElementById("paymentRows");

const totalPaymentEl = document.getElementById("totalPayment");
const principalInterestEl = document.getElementById("principalInterest");
const totalGovEl = document.getElementById("totalGov");
const govInterestEl = document.getElementById("govInterest");
const effectiveAnnualRateEl = document.getElementById("effectiveAnnualRate");

const futureMonthlyPaymentEl = document.getElementById("futureMonthlyPayment");
const futureBonusRateEl = document.getElementById("futureBonusRate");
const futureTypeEl = document.getElementById("futureType");
const futureTotalPaymentEl = document.getElementById("futureTotalPayment");
const futurePrincipalInterestEl = document.getElementById("futurePrincipalInterest");
const futureGovSupportEl = document.getElementById("futureGovSupport");
const futureGovInterestEl = document.getElementById("futureGovInterest");
const futureMaturityTotalEl = document.getElementById("futureMaturityTotal");
const futureEffectiveAnnualRateEl = document.getElementById("futureEffectiveAnnualRate");

function formatWon(value) {
  return Math.round(value).toLocaleString("ko-KR") + "원";
}

function initOptions() {
  for (let year = 2020; year <= 2030; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year}년`;
    if (year === 2023) option.selected = true;
    startYearEl.appendChild(option);
  }

  for (let month = 1; month <= 12; month++) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = `${month}월`;
    if (month === 7) option.selected = true;
    startMonthEl.appendChild(option);
  }

  for (let year = 1; year <= 5; year++) {
    const label = document.createElement("label");
    label.className = "income-year-row";
    label.innerHTML = `
      <span>${year}년차</span>
      <select id="incomeYear${year}">
        ${Object.entries(incomeRules)
          .map(([key, rule]) => `<option value="${key}">${rule.label}</option>`)
          .join("")}
      </select>
    `;
    incomeYearsEl.appendChild(label);
  }

  for (let i = 0; i <= 15; i++) {
  const rate = (i / 10).toFixed(1);

  const option = document.createElement("option");
  option.value = rate;
  option.textContent = `${rate}%`;

  // 기본 선택값 0%
  if (i === 0) option.selected = true;

  bonusRateEl.appendChild(option);
  }

  for (let amount = 0; amount <= MAX_PAYMENT; amount += 10000) {
    const option = document.createElement("option");
    option.value = amount;
    option.textContent = `${amount.toLocaleString("ko-KR")}원`;
    if (amount === MAX_PAYMENT) option.selected = true;
    bulkPaymentEl.appendChild(option);
  }

  for (let amount = 0; amount <= 500000; amount += 10000) {
    const option = document.createElement("option");
    option.value = amount;
    option.textContent = `${amount.toLocaleString("ko-KR")}원`;
    if (amount === 500000) option.selected = true;
    futureMonthlyPaymentEl.appendChild(option);
  }

  for (let i = 0; i <= 30; i++) {
    const rate = (i / 10).toFixed(1);
    const option = document.createElement("option");
    option.value = rate;
    option.textContent = `${rate}%`;
    if (i === 20) option.selected = true;
    futureBonusRateEl.appendChild(option);
  }
}

function createPaymentOptions() {
  let options = "";

  for (let amount = 0; amount <= MAX_PAYMENT; amount += 10000) {
    options += `<option value="${amount}">${amount / 10000}만원</option>`;
  }

  return options;
}

function renderRows() {
  paymentRowsEl.innerHTML = "";

  for (let i = 0; i < TOTAL_MONTHS; i++) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="payment-info"></td>
      <td>
        <select class="payment-select">
          ${createPaymentOptions()}
        </select>
      </td>
      <td class="gov1">0원</td>
      <td class="gov2">0원</td>
      <td class="gov-total">0원</td>
    `;

    paymentRowsEl.appendChild(row);
  }

  document.querySelectorAll(".payment-select").forEach((select) => {
    select.value = "700000";
    select.addEventListener("change", updateAll);
  });
}

function setAllPayments() {
  document.querySelectorAll(".payment-select").forEach((select) => {
    select.value = bulkPaymentEl.value;
  });

  updateAll();
}

function getPaymentDate(index) {
  const startYear = Number(startYearEl.value);
  const startMonth = Number(startMonthEl.value);

  const date = new Date(startYear, startMonth - 1 + index, 1);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function getYearRound(index) {
  return Math.ceil((index + 1) / 12);
}

function isAfterGov2Start(year, month) {
  if (year > GOV2_START.year) return true;
  if (year === GOV2_START.year && month >= GOV2_START.month) return true;
  return false;
}

function getRemainingMonths() {
  const startYear = Number(startYearEl.value);
  const startMonth = Number(startMonthEl.value);

  const monthsPassed =
    (CHECK_DATE.year - startYear) * 12 +
    (CHECK_DATE.month - startMonth);

  const remaining = TOTAL_MONTHS - monthsPassed;

  return Math.max(0, Math.min(TOTAL_MONTHS, remaining));
}

function calculateGov(payment, rule, year, month) {
  const cappedPayment = Math.min(payment, MAX_PAYMENT);

  const gov1 = Math.min(cappedPayment, rule.limit) * rule.rate;

  let gov2 = 0;

  if (isAfterGov2Start(year, month) && rule.limit > 0) {
    const extraBase = Math.max(0, cappedPayment - rule.limit);
    gov2 = extraBase * GOV2_RATE;
  }

  return {
    gov1,
    gov2,
    total: gov1 + gov2,
  };
}

function calculateInstallmentInterest(amount, index, includeBonus) {
  const bonusRate = includeBonus ? Number(bonusRateEl.value) / 100 : 0;
  const firstRate = 0.045 + bonusRate;
  const secondRate = 0.03 + bonusRate;

  if (index < 36) {
    const firstRateMonths = 36 - index;
    const secondRateMonths = 24;

    const firstRateInterest =
      amount * (firstRate / 12) * firstRateMonths;
    const secondRateInterest =
      amount * (secondRate / 12) * secondRateMonths;

    return firstRateInterest + secondRateInterest;
  } else {
    const secondRateMonths = TOTAL_MONTHS - index;

    return amount * (secondRate / 12) * secondRateMonths;
  }
}

function updateAll() {
  let totalPayment = 0;
  let totalGov = 0;
  let totalPrincipalInterest = 0;
  let totalGovInterest = 0;

  remainingMonthsEl.textContent = `${getRemainingMonths()}개월`;

  const rows = paymentRowsEl.querySelectorAll("tr");

  rows.forEach((row, index) => {
    const paymentDate = getPaymentDate(index);
    const yearRound = getYearRound(index);
    const payment = Number(row.querySelector(".payment-select").value);

    const incomeKey = document.getElementById(`incomeYear${yearRound}`).value;
    const rule = incomeRules[incomeKey];

    const gov = calculateGov(payment, rule, paymentDate.year, paymentDate.month);

    row.querySelector(".payment-info").textContent =
      `${index + 1}차 (${paymentDate.year}년 ${paymentDate.month}월 / ${yearRound}년차)`;

    row.querySelector(".gov1").textContent = formatWon(gov.gov1);
    row.querySelector(".gov2").textContent = formatWon(gov.gov2);
    row.querySelector(".gov-total").textContent = formatWon(gov.total);

    totalPayment += payment;
    totalGov += gov.total;

    totalPrincipalInterest += calculateInstallmentInterest(payment, index, true);
    totalGovInterest += calculateInstallmentInterest(gov.total, index, false);
  });

  totalPaymentEl.textContent = formatWon(totalPayment);
  principalInterestEl.textContent = formatWon(totalPrincipalInterest);
  totalGovEl.textContent = formatWon(totalGov);
  govInterestEl.textContent = formatWon(totalGovInterest);

  const effectiveAnnualRate = totalPayment > 0
    ? ((totalPrincipalInterest + totalGov + totalGovInterest) / totalPayment / 5) * 100
    : 0;

  effectiveAnnualRateEl.textContent = `${effectiveAnnualRate.toFixed(2)}%`;
}

function updateFutureSavings() {
  const monthlyPayment = Number(futureMonthlyPaymentEl.value);
  const baseRate = 0.05;
  const principalRate = baseRate + Number(futureBonusRateEl.value) / 100;
  const supportRate = Number(futureTypeEl.value);
  const monthlySupport = monthlyPayment * supportRate;

  let principalInterest = 0;
  let govInterest = 0;

  for (let index = 0; index < 36; index++) {
    const remainingMonths = 36 - index;
    principalInterest += monthlyPayment * (principalRate / 12) * remainingMonths;
    govInterest += monthlySupport * (baseRate / 12) * remainingMonths;
  }

  const totalPayment = monthlyPayment * 36;
  const totalGovSupport = monthlySupport * 36;
  const maturityTotal =
    totalPayment + principalInterest + totalGovSupport + govInterest;
  const effectiveAnnualRate = totalPayment > 0
    ? ((principalInterest + totalGovSupport + govInterest) / totalPayment / 3) * 100
    : 0;

  futureTotalPaymentEl.textContent = formatWon(totalPayment);
  futurePrincipalInterestEl.textContent = formatWon(principalInterest);
  futureGovSupportEl.textContent = formatWon(totalGovSupport);
  futureGovInterestEl.textContent = formatWon(govInterest);
  futureMaturityTotalEl.textContent = formatWon(maturityTotal);
  futureEffectiveAnnualRateEl.textContent = `${effectiveAnnualRate.toFixed(2)}%`;
}

initOptions();
renderRows();
updateAll();
updateFutureSavings();

startYearEl.addEventListener("change", updateAll);
startMonthEl.addEventListener("change", updateAll);
bonusRateEl.addEventListener("change", updateAll);
bulkPaymentEl.addEventListener("change", setAllPayments);
futureMonthlyPaymentEl.addEventListener("change", updateFutureSavings);
futureBonusRateEl.addEventListener("change", updateFutureSavings);
futureTypeEl.addEventListener("change", updateFutureSavings);

document.querySelectorAll("[id^='incomeYear']").forEach((select) => {
  select.addEventListener("change", updateAll);
});
