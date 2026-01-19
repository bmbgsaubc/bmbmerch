// ====== Configure this email ======
const MERCH_EMAIL = "bmbgsa.ubc@gmail.com"; // <-- change to your real email
const cart = new Map();

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

function formatPrice(amount) {
  const value = typeof amount === "number" ? amount : parseFloat(amount);
  if (Number.isNaN(value)) return "";
  return `$${value.toFixed(2).replace(/\.00$/, "")} CAD`;
}

function buildCartOrderTemplate(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = items.map((item) => {
    const priceLine = item.price ? ` · ${formatPrice(item.price * item.quantity)}` : "";
    return `- ${item.name} — Size: ${item.size} · Qty: ${item.quantity}${priceLine}`;
  });
  const totalLine = total ? `Estimated total: ${formatPrice(total)}` : "";
  return [
    "Hi BMB-GSA,",
    "",
    "I’d like to place an order for:",
    ...lines,
    ...(totalLine ? ["", totalLine] : []),
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

function getCartItems() {
  return Array.from(cart.values());
}

function updateEmailLinks() {
  const subject = "BMB-GSA Merch Order";
  const items = getCartItems();
  const body = items.length ? buildCartOrderTemplate(items) : defaultOrderTemplate();
  const mailto = buildMailto(subject, body);

  const btns = [document.getElementById("emailOrderBtn"), document.getElementById("emailOrderBtn2")];
  btns.forEach((b) => {
    if (b) b.href = mailto;
  });

  const emailText = document.getElementById("merchEmailText");
  if (emailText) emailText.textContent = MERCH_EMAIL;
}

function renderCart() {
  const items = getCartItems();
  const listEl = document.getElementById("cartList");
  const countEl = document.getElementById("cartCount");
  const emptyEl = document.getElementById("cartEmpty");
  const totalEl = document.getElementById("cartTotal");
  if (!listEl || !countEl || !emptyEl || !totalEl) return;

  listEl.innerHTML = "";
  if (!items.length) {
    emptyEl.style.display = "block";
    totalEl.textContent = "";
  } else {
    emptyEl.style.display = "none";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const title = document.createElement("span");
      title.className = "cart-item-title";
      title.textContent = item.name;

      const details = document.createElement("span");
      details.className = "cart-item-details";
      const priceLine = item.price ? ` · ${formatPrice(item.price * item.quantity)}` : "";
      details.textContent = `Size: ${item.size} · Qty: ${item.quantity}${priceLine}`;

      li.appendChild(title);
      li.appendChild(details);
      listEl.appendChild(li);
    });
  }

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  countEl.textContent = String(totalQty);
  totalEl.textContent = total ? `Total: ${formatPrice(total)}` : "";
}

function addToCart(item, size, quantity, price) {
  const key = `${item}__${size}`;
  const existing = cart.get(key);
  if (existing) {
    existing.quantity += quantity;
    cart.set(key, existing);
  } else {
    cart.set(key, { name: item, size, quantity, price });
  }
  renderCart();
  updateEmailLinks();
}

function wireAddToCartButtons() {
  document.querySelectorAll(".order-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemEl = btn.closest(".merch-item");
      const sizeGroup = itemEl ? itemEl.querySelector(".size-options") : null;
      const selectedSize = itemEl ? itemEl.querySelector(".size-option.is-selected") : null;
      const size = selectedSize ? selectedSize.dataset.size : "";
      if (!size) {
        if (sizeGroup) {
          sizeGroup.classList.add("is-missing");
          setTimeout(() => sizeGroup.classList.remove("is-missing"), 1200);
        }
        return;
      }

      const qtyEl = itemEl ? itemEl.querySelector(".quantity-value") : null;
      const quantity = Math.max(1, parseInt(qtyEl ? qtyEl.textContent.trim() : "1", 10) || 1);
      const item = btn.dataset.item || "Merch item";
      const rawPrice = btn.dataset.price ? parseFloat(btn.dataset.price) : 0;
      const price = Number.isNaN(rawPrice) ? 0 : rawPrice;
      addToCart(item, size, quantity, price);

      const original = btn.textContent;
      btn.textContent = "Added ✓";
      setTimeout(() => {
        btn.textContent = original;
      }, 900);
    });
  });
}

function wireSizeOptions() {
  document.querySelectorAll(".size-option").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const group = btn.closest(".size-options");
      if (!group) return;
      group.classList.remove("is-missing");
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

function wireCartUI() {
  const cartEl = document.getElementById("cart");
  const toggleBtn = document.getElementById("cartToggle");
  const clearBtn = document.getElementById("cartClear");
  if (!cartEl || !toggleBtn || !clearBtn) return;

  const setOpen = (next) => {
    cartEl.classList.toggle("is-open", next);
    toggleBtn.setAttribute("aria-expanded", next ? "true" : "false");
  };

  toggleBtn.addEventListener("click", () => {
    const isOpen = cartEl.classList.contains("is-open");
    setOpen(!isOpen);
  });

  clearBtn.addEventListener("click", () => {
    cart.clear();
    renderCart();
    updateEmailLinks();
  });

  document.addEventListener("click", (event) => {
    if (!cartEl.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function wireCarouselDots() {
  document.querySelectorAll(".merch-photo").forEach((photo) => {
    const track = photo.querySelector(".carousel-track");
    const dots = photo.querySelectorAll(".carousel-dot");
    if (!track || dots.length === 0) return;

    let ticking = false;
    const update = () => {
      const width = track.clientWidth || 1;
      const index = Math.round(track.scrollLeft / width);
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
      });
    };

    track.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          update();
          ticking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener("resize", update);
    update();
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
updateEmailLinks();
renderCart();
wireAddToCartButtons();
wireSizeOptions();
wireQuantityControls();
wireCartUI();
wireCarouselDots();
wireCopyEmail();
setYear();
