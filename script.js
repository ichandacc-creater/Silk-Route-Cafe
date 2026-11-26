const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const headerActions = document.querySelector(".header-actions");
const cartStorageKey = "silk-route-bag";

const products = {
  "house-coffee": "House Coffee",
  "silk-route-latte": "Silk Route Latte",
  cappuccino: "Cappuccino",
  "spiced-chai": "Spiced Chai",
  "iced-coffee": "Iced Coffee",
  "fresh-bakes": "Fresh Bakes",
};

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isExpanded);
});

const closeNavigationOnLinkClick = (event) => {
  if (event.target instanceof Element && event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  }
};

navigation.addEventListener("click", closeNavigationOnLinkClick);
headerActions.addEventListener("click", closeNavigationOnLinkClick);

const readCart = () => {
  const savedCart = localStorage.getItem(cartStorageKey);
  if (savedCart === null) {
    return [];
  }

  const cart = JSON.parse(savedCart);
  if (
    !Array.isArray(cart) ||
    cart.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        !Object.hasOwn(products, item.id) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    throw new Error("The saved café bag is invalid. Clear the bag and try again.");
  }

  return cart;
};

const updateBagCount = (cart) => {
  const count = cart.reduce((total, item) => total + item.quantity, 0);

  document.querySelectorAll("[data-bag-count]").forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });

  document.querySelectorAll(".bag-link").forEach((link) => {
    link.setAttribute(
      "aria-label",
      count === 0 ? "Shopping bag" : `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`,
    );
  });
};

const renderBag = (cart) => {
  const container = document.querySelector("[data-bag-items]");
  if (!container) {
    return;
  }

  const isEmpty = cart.length === 0;
  document.querySelector("[data-bag-empty]").hidden = !isEmpty;
  container.replaceChildren();

  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector("[data-bag-total-items]").textContent = String(count);

  for (const item of cart) {
    const row = document.createElement("article");
    row.className = "bag-line";

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = products[item.id];
    const priceNote = document.createElement("p");
    priceNote.textContent = "Price to be confirmed";
    details.append(title, priceNote);

    const controls = document.createElement("div");
    controls.className = "bag-line-controls";

    const decrease = document.createElement("button");
    decrease.className = "quantity-button";
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Remove one ${products[item.id]}`);
    decrease.dataset.cartAction = "decrease";
    decrease.dataset.productId = item.id;

    const quantity = document.createElement("span");
    quantity.textContent = String(item.quantity);
    quantity.setAttribute("aria-label", `Quantity ${item.quantity}`);

    const increase = document.createElement("button");
    increase.className = "quantity-button";
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Add one ${products[item.id]}`);
    increase.dataset.cartAction = "increase";
    increase.dataset.productId = item.id;

    const remove = document.createElement("button");
    remove.className = "remove-item";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.cartAction = "remove";
    remove.dataset.productId = item.id;

    controls.append(decrease, quantity, increase, remove);
    row.append(details, controls);
    container.append(row);
  }
};

const saveCart = (cart) => {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  updateBagCount(cart);
  renderBag(cart);
};

const initialCart = readCart();
updateBagCount(initialCart);
renderBag(initialCart);

document.querySelectorAll("[data-add-to-bag]").forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.dataset.addToBag;
    if (!Object.hasOwn(products, productId)) {
      throw new Error(`Unknown café item: ${productId}`);
    }

    const cart = readCart();
    const item = cart.find((entry) => entry.id === productId);
    if (item) {
      item.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }

    saveCart(cart);
    const feedback = document.querySelector("[data-cart-feedback]");
    if (feedback) {
      feedback.textContent = `${products[productId]} added to your bag.`;
    }
  });
});

const bagItems = document.querySelector("[data-bag-items]");
if (bagItems) {
  bagItems.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest("[data-cart-action]");
    if (!button) {
      return;
    }

    const { cartAction, productId } = button.dataset;
    const cart = readCart();
    const item = cart.find((entry) => entry.id === productId);
    if (!item) {
      throw new Error(`The café item ${productId} is not in your bag.`);
    }

    if (cartAction === "increase") {
      item.quantity += 1;
    } else if (cartAction === "decrease") {
      item.quantity -= 1;
    } else if (cartAction === "remove") {
      item.quantity = 0;
    } else {
      throw new Error(`Unknown bag action: ${cartAction}`);
    }

    saveCart(cart.filter((entry) => entry.quantity > 0));
  });
}

const productSearch = document.querySelector("[data-product-search]");
if (productSearch) {
  productSearch.addEventListener("input", () => {
    const searchTerm = productSearch.value.trim().toLowerCase();
    const cards = [...document.querySelectorAll("[data-product-card]")];
    let visibleCount = 0;
    cards.forEach((card) => {
      card.hidden = !card.dataset.search.includes(searchTerm);
      if (!card.hidden) {
        visibleCount += 1;
      }
    });
    document.querySelector("[data-search-empty]").hidden = visibleCount > 0;
  });
}
