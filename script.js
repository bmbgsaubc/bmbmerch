// ====== Configure contact + Sheets webhook ======
const MERCH_EMAIL = "bmbgsa.ubc@gmail.com";
const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwU8CYQKz8inkdJMjQbVAMgywphFbMDDq46xpUnFkfZlutQf9dgRISSTXhHqHlPPQs/exec";
const CUSTOMIZER_LOGOS = {
  circle: {
    label: "Circle crest",
    itemName: "Custom Circular Crest Tee",
    path: "assets/Circle_Customizable.svg",
    note: "Circular crest logo with editable primary, secondary, and background colours.",
    groups: {
      primary: "#g1",
      secondary: "#g2",
      background: "#g6",
    },
    defaults: {
      primary: "#000000",
      secondary: "#C0C0C0",
      background: "#FFFFFF",
    },
  },
  clear: {
    label: "Clear with text",
    itemName: "Custom Clear-with-Text Tee",
    path: "assets/clear-withtext.svg",
    note: "Clear-with-text logo with editable primary and secondary colour groups.",
    groups: {
      primary: "#layer3",
      secondary: "#layer2",
    },
    defaults: {
      primary: "#005785",
      secondary: "#005785",
      background: "#FFFFFF",
    },
  },
};
const CUSTOMIZER_ITEM_PRICE = 15;
const CUSTOMIZER_DESIGNS = {
  white: {
    label: "White tee",
    note: "Classic white tee base for your selected custom logo.",
  },
  black: {
    label: "Black tee",
    note: "Dark tee base that makes brighter and higher-contrast logo colours stand out.",
  },
  beige: {
    label: "Beige tee",
    note: "Warm neutral tee base for softer or vintage-inspired logo colourways.",
  },
};

const cart = new Map();
const customizerState = {
  logo: "circle",
  design: "white",
  primary: "#000000",
  secondary: "#C0C0C0",
  background: "#FFFFFF",
  svg: null,
};

const customizerSvgTemplates = new Map();

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
    "",
    itemName ? `- Item: ${itemName}` : "- Item(s):",
    size ? `- Size(s): ${size}` : "- Size(s):",
    quantity ? `- Quantity: ${quantity}` : "- Quantity:",
    "",
    "Pickup/Dropoff preference:",
    "- (e.g., on-campus pickup / delivery / flexible)",
    "",
    "Name: ___________",
    "",
    "Phone number/email address for contact: ___________",
    "",
    "Lab (optional): _________",
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
    const detailsLine = item.details ? ` · ${item.details}` : "";
    return `- ${item.name} — Size: ${item.size} · Qty: ${item.quantity}${detailsLine}${priceLine}`;
  });
  const totalLine = total ? `Estimated total: ${formatPrice(total)}` : "";
  return [
    "Hi BMB-GSA,",
    "",
    "I’d like to place an order for:",
    "",
    ...lines,
    ...(totalLine ? ["", totalLine] : []),
    "",
    "Pickup/Dropoff preference:",
    "- (e.g., on-campus pickup / delivery / flexible)",
    "",
    "Name: ___________",
    "",
    "Phone number/email address for contact: ___________",
    "",
    "Lab (optional): _________",
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

  ["emailOrderBtn2", "emailOrderFallbackBtn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = mailto;
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
      const detailsLine = item.details ? ` · ${item.details}` : "";
      details.textContent = `Size: ${item.size} · Qty: ${item.quantity}${detailsLine}${priceLine}`;

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

function addToCart(item, size, quantity, price, meta = {}) {
  const variantKey = meta.variantKey ? `__${meta.variantKey}` : "";
  const key = `${item}__${size}${variantKey}`;
  const existing = cart.get(key);
  if (existing) {
    existing.quantity += quantity;
    cart.set(key, existing);
  } else {
    cart.set(key, {
      name: item,
      size,
      quantity,
      price,
      details: meta.details || "",
      sheetItemName: meta.sheetItemName || item,
    });
  }
  renderCart();
  updateEmailLinks();
}

function buildSheetRows(customer, items) {
  const groupedByItem = new Map();
  items.forEach((item) => {
    const itemName = item.sheetItemName || item.name;
    if (!groupedByItem.has(itemName)) {
      groupedByItem.set(itemName, { S: 0, M: 0, L: 0, XL: 0 });
    }
    const group = groupedByItem.get(itemName);
    if (Object.hasOwn(group, item.size)) {
      group[item.size] += item.quantity;
    }
  });

  return Array.from(groupedByItem.entries()).map(([itemName, sizes]) => ({
    name: customer.name,
    contact: customer.contact,
    lab: customer.lab || "",
    fulfillment: customer.fulfillment || "",
    itemName,
    sizeSmall: sizes.S,
    sizeMedium: sizes.M,
    sizeLarge: sizes.L,
    sizeXL: sizes.XL,
  }));
}

async function submitOrderToSheet(customer) {
  if (!SHEETS_WEBHOOK_URL || !SHEETS_WEBHOOK_URL.startsWith("http")) {
    throw new Error("Sheets webhook URL is not configured yet.");
  }

  const items = getCartItems();
  if (!items.length) {
    throw new Error("Your cart is empty.");
  }

  const rows = buildSheetRows(customer, items);
  const payload = {
    submittedAt: new Date().toISOString(),
    source: "bmb-gsa-merch-site",
    orders: rows,
  };

  await fetch(SHEETS_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
    if (!track) return;

    const slides = Array.from(track.querySelectorAll("img"));
    if (!slides.length) return;

    let dotsWrap = photo.querySelector(".carousel-dots");
    if (!dotsWrap) {
      dotsWrap = document.createElement("div");
      dotsWrap.className = "carousel-dots";
      dotsWrap.setAttribute("aria-hidden", "true");
      photo.appendChild(dotsWrap);
    }

    dotsWrap.innerHTML = "";
    const dots = slides.map((_, index) => {
      const dot = document.createElement("span");
      dot.className = "carousel-dot";
      if (index === 0) dot.classList.add("is-active");
      dotsWrap.appendChild(dot);
      return dot;
    });

    if (slides.length < 2) {
      dotsWrap.style.display = "none";
      return;
    }
    dotsWrap.style.display = "";

    let ticking = false;
    const update = () => {
      const width = track.clientWidth || 1;
      const rawIndex = Math.round(track.scrollLeft / width);
      const index = Math.max(0, Math.min(slides.length - 1, rawIndex));
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

function normalizeHexColor(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/^#/, "");
  if (!/^[\da-fA-F]{3}$|^[\da-fA-F]{6}$/.test(cleaned)) return null;
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned;
  return `#${expanded.toUpperCase()}`;
}

function applyColorToLogoGroup(group, color) {
  if (!group) return;

  group.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof Element)) return;
    const fill = node.getAttribute("fill") || node.style.fill;
    const stroke = node.getAttribute("stroke") || node.style.stroke;

    if (fill !== "none") {
      node.setAttribute("fill", color);
      node.style.fill = color;
    }

    if (stroke && stroke !== "none") {
      node.setAttribute("stroke", color);
      node.style.stroke = color;
    }
  });
}

function applyCustomizerLogoColors() {
  if (!customizerState.svg) return;

  const logo = getCustomizerLogoConfig();
  Object.entries(logo.groups).forEach(([role, selector]) => {
    const group = customizerState.svg.querySelector(selector);
    applyColorToLogoGroup(group, customizerState[role]);
  });
}

function getCustomizerLogoConfig(logoKey = customizerState.logo) {
  return CUSTOMIZER_LOGOS[logoKey] || CUSTOMIZER_LOGOS.circle;
}

function syncCustomizerColorInputs(role) {
  const colorInput = document.getElementById(`${role}ColorInput`);
  const hexInput = document.getElementById(`${role}ColorHex`);
  if (colorInput) colorInput.value = customizerState[role];
  if (hexInput) hexInput.value = customizerState[role];
}

function updateCustomizerPreviewDetails() {
  const design = CUSTOMIZER_DESIGNS[customizerState.design] || CUSTOMIZER_DESIGNS.white;
  const logo = getCustomizerLogoConfig();
  const shirtPreview = document.getElementById("shirtPreview");
  const previewLabel = document.getElementById("designPreviewLabel");
  const previewName = document.getElementById("designPreviewName");

  if (shirtPreview) shirtPreview.dataset.design = customizerState.design;
  if (previewLabel) previewLabel.textContent = design.label;
  if (previewName) previewName.textContent = `${logo.note} ${design.note}`;
}

async function loadCustomizerLogoSvg(logoKey = customizerState.logo) {
  const logo = getCustomizerLogoConfig(logoKey);
  if (customizerSvgTemplates.has(logo.path)) {
    return customizerSvgTemplates.get(logo.path).cloneNode(true);
  }

  const response = await fetch(logo.path);
  if (!response.ok) {
    throw new Error("Could not load the logo preview.");
  }

  const markup = await response.text();
  const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = parsed.querySelector("svg");
  if (!svg) {
    throw new Error("Could not read the logo preview.");
  }

  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const template = document.importNode(svg, true);
  customizerSvgTemplates.set(logo.path, template);
  return template.cloneNode(true);
}

async function ensureCustomizerLogoMounted(forceReload = false) {
  const preview = document.getElementById("logoPreview");
  if (!preview) return;
  if (forceReload) {
    customizerState.svg = null;
    preview.innerHTML = "";
  }
  if (customizerState.svg) return;

  const requestedLogo = customizerState.logo;
  preview.classList.add("is-loading");
  try {
    const svg = await loadCustomizerLogoSvg(requestedLogo);
    if (requestedLogo !== customizerState.logo) return;
    preview.innerHTML = "";
    preview.appendChild(svg);
    customizerState.svg = svg;
    applyCustomizerLogoColors();
  } catch (error) {
    customizerState.svg = null;
    preview.textContent = "Logo preview unavailable.";
  } finally {
    preview.classList.remove("is-loading");
  }
}

function updateCustomizerSummary() {
  const summary = document.getElementById("customizerSummaryText");
  if (!summary) return;

  const selection = getCustomizerCartSelection();
  const sizeText = selection.size ? `size ${selection.size}` : "choose a size";
  const colorDetails = [
    `primary ${selection.primary}`,
    `secondary ${selection.secondary}`,
  ];
  if (selection.background) {
    colorDetails.push(`background ${selection.background}`);
  }
  summary.textContent =
    `${selection.logoLabel}, ${selection.designLabel}, ${sizeText}, qty ${selection.quantity}, ` +
    colorDetails.join(", ");
}

function updateCustomizerDesign(designKey) {
  const design = CUSTOMIZER_DESIGNS[designKey];
  if (!design) return;

  customizerState.design = designKey;

  document.querySelectorAll("#customizerDesigns .design-option").forEach((button) => {
    const isSelected = button.dataset.design === designKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  updateCustomizerPreviewDetails();
  updateCustomizerSummary();
}

function updateCustomizerLogo(logoKey) {
  const nextLogoKey = CUSTOMIZER_LOGOS[logoKey] ? logoKey : "circle";
  const logo = getCustomizerLogoConfig(nextLogoKey);
  const preview = document.getElementById("logoPreview");
  const backgroundField = document.getElementById("backgroundColorField");

  customizerState.logo = nextLogoKey;
  customizerState.svg = null;

  Object.entries({
    primary: logo.defaults.primary,
    secondary: logo.defaults.secondary,
    background: logo.defaults.background || "#FFFFFF",
  }).forEach(([role, value]) => {
    customizerState[role] = value;
    syncCustomizerColorInputs(role);
  });

  document.querySelectorAll("#customizerLogoOptions .design-option").forEach((button) => {
    const isSelected = button.dataset.logo === nextLogoKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  if (backgroundField) {
    backgroundField.hidden = !logo.groups.background;
  }
  if (preview) {
    preview.innerHTML = "";
  }

  updateCustomizerPreviewDetails();
  updateCustomizerSummary();
  void ensureCustomizerLogoMounted(true);
}

function setCustomizerColor(role, value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return false;

  customizerState[role] = normalized;
  syncCustomizerColorInputs(role);

  applyCustomizerLogoColors();
  updateCustomizerSummary();
  return true;
}

function getCustomizerCartSelection() {
  const logo = getCustomizerLogoConfig();
  const design = CUSTOMIZER_DESIGNS[customizerState.design] || CUSTOMIZER_DESIGNS.white;
  const sizeBtn = document.querySelector("#customizerSizeOptions .size-option.is-selected");
  const quantityEl = document.querySelector("#customizerQuantity .quantity-value");
  const quantity = Math.max(1, parseInt(quantityEl ? quantityEl.textContent.trim() : "1", 10) || 1);
  const size = sizeBtn ? String(sizeBtn.dataset.size || "").trim() : "";
  const detailParts = [
    logo.label,
    design.label,
    `Primary ${customizerState.primary}`,
    `Secondary ${customizerState.secondary}`,
  ];

  if (logo.groups.background) {
    detailParts.push(`Background ${customizerState.background}`);
  }

  return {
    logoKey: customizerState.logo,
    logoLabel: logo.label,
    itemName: logo.itemName,
    designLabel: design.label,
    size,
    quantity,
    details: detailParts.join(" · "),
    primary: customizerState.primary,
    secondary: customizerState.secondary,
    background: logo.groups.background ? customizerState.background : "",
  };
}

function wireCustomizerModal() {
  const modal = document.getElementById("customizerModal");
  const openBtn = document.getElementById("openCustomizerBtn");
  const closeBtn = document.getElementById("customizerCloseBtn");
  const backdrop = document.getElementById("customizerModalBackdrop");
  const addBtn = document.getElementById("customizerAddBtn");
  const status = document.getElementById("customizerStatus");
  const logoOptions = document.getElementById("customizerLogoOptions");
  const sizeGroup = document.getElementById("customizerSizeOptions");
  const quantityControl = document.getElementById("customizerQuantity");
  const primaryColorInput = document.getElementById("primaryColorInput");
  const primaryColorHex = document.getElementById("primaryColorHex");
  const secondaryColorInput = document.getElementById("secondaryColorInput");
  const secondaryColorHex = document.getElementById("secondaryColorHex");
  const backgroundColorField = document.getElementById("backgroundColorField");
  const backgroundColorInput = document.getElementById("backgroundColorInput");
  const backgroundColorHex = document.getElementById("backgroundColorHex");
  if (
    !modal ||
    !openBtn ||
    !closeBtn ||
    !backdrop ||
    !addBtn ||
    !status ||
    !logoOptions ||
    !sizeGroup ||
    !quantityControl ||
    !primaryColorInput ||
    !primaryColorHex ||
    !secondaryColorInput ||
    !secondaryColorHex ||
    !backgroundColorField ||
    !backgroundColorInput ||
    !backgroundColorHex
  ) {
    return;
  }

  const setOpen = (next) => {
    modal.classList.toggle("is-open", next);
    modal.setAttribute("aria-hidden", next ? "false" : "true");
    if (!next) {
      status.textContent = "";
      return;
    }
    void ensureCustomizerLogoMounted();
  };

  const handleHexInput = (role, input) => {
    const normalized = normalizeHexColor(input.value);
    if (normalized) setCustomizerColor(role, normalized);
  };

  const clearStatus = () => {
    status.textContent = "";
  };

  openBtn.addEventListener("click", () => setOpen(true));
  closeBtn.addEventListener("click", () => setOpen(false));
  backdrop.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      setOpen(false);
    }
  });

  logoOptions.querySelectorAll(".design-option").forEach((button) => {
    button.addEventListener("click", () => {
      clearStatus();
      updateCustomizerLogo(button.dataset.logo || "circle");
    });
  });

  document.querySelectorAll("#customizerDesigns .design-option").forEach((button) => {
    button.addEventListener("click", () => {
      clearStatus();
      updateCustomizerDesign(button.dataset.design || "white");
    });
  });

  primaryColorInput.addEventListener("input", () => {
    clearStatus();
    setCustomizerColor("primary", primaryColorInput.value);
  });
  secondaryColorInput.addEventListener("input", () => {
    clearStatus();
    setCustomizerColor("secondary", secondaryColorInput.value);
  });
  backgroundColorInput.addEventListener("input", () => {
    clearStatus();
    setCustomizerColor("background", backgroundColorInput.value);
  });

  primaryColorHex.addEventListener("input", () => {
    clearStatus();
    handleHexInput("primary", primaryColorHex);
  });
  secondaryColorHex.addEventListener("input", () => {
    clearStatus();
    handleHexInput("secondary", secondaryColorHex);
  });
  backgroundColorHex.addEventListener("input", () => {
    clearStatus();
    handleHexInput("background", backgroundColorHex);
  });

  primaryColorHex.addEventListener("blur", () => {
    primaryColorHex.value = customizerState.primary;
  });
  secondaryColorHex.addEventListener("blur", () => {
    secondaryColorHex.value = customizerState.secondary;
  });
  backgroundColorHex.addEventListener("blur", () => {
    backgroundColorHex.value = customizerState.background;
  });

  sizeGroup.querySelectorAll(".size-option").forEach((button) => {
    button.addEventListener("click", () => {
      clearStatus();
      updateCustomizerSummary();
    });
  });

  quantityControl.querySelectorAll(".qty-btn").forEach((button) => {
    button.addEventListener("click", () => {
      clearStatus();
      updateCustomizerSummary();
    });
  });

  addBtn.addEventListener("click", () => {
    const selection = getCustomizerCartSelection();
    if (!selection.size) {
      sizeGroup.classList.add("is-missing");
      status.textContent = "Pick a size before adding this custom tee to your order.";
      setTimeout(() => sizeGroup.classList.remove("is-missing"), 1200);
      return;
    }

    addToCart(selection.itemName, selection.size, selection.quantity, CUSTOMIZER_ITEM_PRICE, {
      details: selection.details,
      sheetItemName: `${selection.itemName} — ${selection.details}`,
      variantKey: `${selection.logoKey}__${selection.details}`,
    });

    status.textContent = "Custom tee added to cart.";
    const original = addBtn.textContent;
    addBtn.textContent = "Added ✓";
    setTimeout(() => {
      addBtn.textContent = original;
    }, 900);
  });

  updateCustomizerDesign(customizerState.design);
  updateCustomizerLogo(customizerState.logo);
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
      window.prompt("Copy this email:", MERCH_EMAIL);
    }
  });
}

function wireOrderModal() {
  const modal = document.getElementById("orderModal");
  const openBtn = document.getElementById("submitOrderBtn");
  const closeBtn = document.getElementById("orderCancelBtn");
  const backdrop = document.getElementById("orderModalBackdrop");
  const form = document.getElementById("orderForm");
  const status = document.getElementById("orderStatus");
  const submitBtn = document.getElementById("orderSubmitBtn");
  if (!modal || !openBtn || !closeBtn || !backdrop || !form || !status || !submitBtn) return;

  const setOpen = (next) => {
    modal.classList.toggle("is-open", next);
    modal.setAttribute("aria-hidden", next ? "false" : "true");
    if (!next) status.textContent = "";
  };

  openBtn.addEventListener("click", () => {
    if (!getCartItems().length) {
      status.textContent = "Add at least one item to your cart first.";
      setOpen(true);
      return;
    }
    setOpen(true);
  });

  closeBtn.addEventListener("click", () => setOpen(false));
  backdrop.addEventListener("click", () => setOpen(false));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const customer = {
      name: String(data.get("name") || "").trim(),
      contact: String(data.get("contact") || "").trim(),
      lab: String(data.get("lab") || "").trim(),
      fulfillment: String(data.get("fulfillment") || "").trim(),
    };

    if (!customer.name || !customer.contact || !customer.fulfillment) {
      status.textContent = "Name, contact, and pickup/dropoff preference are required.";
      return;
    }

    try {
      submitBtn.disabled = true;
      status.textContent = "Submitting order...";
      await submitOrderToSheet(customer);
      status.textContent = "Order submitted. Thank you.";
      form.reset();
      cart.clear();
      renderCart();
      updateEmailLinks();
      setTimeout(() => setOpen(false), 900);
    } catch (error) {
      status.textContent = `Could not submit order: ${error.message}`;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

updateEmailLinks();
renderCart();
wireAddToCartButtons();
wireSizeOptions();
wireQuantityControls();
wireCartUI();
wireCarouselDots();
wireCustomizerModal();
wireCopyEmail();
wireOrderModal();
setYear();
