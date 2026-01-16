// ====== Configure this email ======
const MERCH_EMAIL = "bmbgsa.ubc@gmail.com"; // <-- change to your real email

function buildMailto(subject, body) {
  return (
    `mailto:${MERCH_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

function defaultOrderTemplate(itemName = "", size = "", quantity = "") {
  return [
    "Hi BMB-GSA,",
    "",
    "I’d like to place an order for:",
    itemName ? `- Item: ${itemName}` : "- Item(s):",
    size ? `- Size(s): ${size}` : "- Size(s):",
    quantity ? `- Quantity: ${quantity}` : "- Quantity:",
    "",
    "Pickup preference:",
    "- (e.g., on-campus pickup / delivery / flexible)",
    "",
    "Name:",
    "Program/Lab (optional):",
    "",
    "Thanks!",
  ].join("\n");
}

function setEmailLinks() {
  const subject = "BMB-GSA Merch Order";
  const body = defaultOrderTemplate();
  const mailto = buildMailto(subject, body);

  const btns = [document.getElementById("emailOrderBtn"), document.getElementById("emailOrderBtn2")];
  btns.forEach((b) => {
    if (b) b.href = mailto;
  });

  const emailText = document.getElementById("merchEmailText");
  if (emailText) emailText.textContent = MERCH_EMAIL;
}

function wireOrderButtons() {
  document.querySelectorAll(".order-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemEl = btn.closest(".merch-item");
      const selectedSize = itemEl ? itemEl.querySelector(".size-option.is-selected") : null;
      const size = selectedSize ? selectedSize.dataset.size : "";
      const qtyEl = itemEl ? itemEl.querySelector(".quantity-value") : null;
      const quantity = qtyEl ? qtyEl.textContent.trim() : "";
      const item = btn.dataset.item || "Merch item";
      const price = btn.dataset.price ? `$${btn.dataset.price} CAD` : "";
      const subject = `BMB-GSA Merch Order — ${item}`;
      const body = defaultOrderTemplate(`${item}${price ? ` (${price})` : ""}`, size, quantity);
      window.location.href = buildMailto(subject, body);
    });
  });
}

function wireSizeOptions() {
  document.querySelectorAll(".size-option").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const group = btn.closest(".size-options");
      if (!group) return;
      const wasSelected = btn.classList.contains("is-selected");
      group.querySelectorAll(".size-option").forEach((b) => {
        b.classList.remove("is-selected");
        b.setAttribute("aria-pressed", "false");
      });
      if (!wasSelected) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      }
    });
  });
}

function wireQuantityControls() {
  document.querySelectorAll(".quantity-control").forEach((control) => {
    const valueEl = control.querySelector(".quantity-value");
    const decreaseBtn = control.querySelector('[data-qty-action="decrease"]');
    const increaseBtn = control.querySelector('[data-qty-action="increase"]');
    if (!valueEl || !decreaseBtn || !increaseBtn) return;

    const updateValue = (next) => {
      const clamped = Math.max(1, next);
      valueEl.textContent = String(clamped);
    };

    decreaseBtn.addEventListener("click", () => {
      const current = parseInt(valueEl.textContent, 10) || 1;
      updateValue(current - 1);
    });

    increaseBtn.addEventListener("click", () => {
      const current = parseInt(valueEl.textContent, 10) || 1;
      updateValue(current + 1);
    });
  });
}

function wireCopyEmail() {
  const copyBtn = document.getElementById("copyEmailBtn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(MERCH_EMAIL);
      copyBtn.textContent = "Copied ✅";
      setTimeout(() => (copyBtn.textContent = "Copy email"), 1200);
    } catch {
      // fallback
      window.prompt("Copy this email:", MERCH_EMAIL);
    }
  });
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

// init
setEmailLinks();
wireOrderButtons();
wireSizeOptions();
wireQuantityControls();
wireCopyEmail();
setYear();
