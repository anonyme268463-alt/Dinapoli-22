const { categories, products } = window.DINAPOLI_MENU;
let current = categories[0];
let query = '';
let cart = (() => { try { return JSON.parse(localStorage.getItem('dinapoli-cart')) || []; } catch { return []; } })();
let checkoutStep = 1;
const checkoutData = { time: 'Dès que possible', payment: 'Carte au restaurant' };

const euro = (value) => Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const categoriesEl = document.querySelector('#categories');
const grid = document.querySelector('#productGrid');

function renderCategories() {
  categoriesEl.innerHTML = categories.map((category) => `<button class="category ${category === current ? 'active' : ''}" data-cat="${category}">${category}</button>`).join('');
  categoriesEl.querySelectorAll('button').forEach((button) => {
    button.onclick = () => {
      current = button.dataset.cat;
      query = '';
      document.querySelector('#search').value = '';
      renderCategories();
      renderProducts();
    };
  });
}

function renderProducts() {
  const normalizedQuery = query.trim().toLowerCase();
  const list = products.filter((product) => {
    const matchesCategory = normalizedQuery || product.category === current;
    const matchesQuery = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  grid.innerHTML = list.map((product) => `
    <article class="product">
      ${product.image ? `<div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"></div>` : ''}
      <div class="product-copy">
        <span class="product-category">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description || 'Découvrez ce produit sur la carte Di Napoli.'}</p>
        <div class="product-bottom">
          <div class="product-price"><small>${product.options.length > 1 ? 'À partir de' : 'Prix'}</small><b>${euro(product.price)}</b></div>
          <button class="add-button" data-id="${product.id}" aria-label="Ajouter ${product.name}">+</button>
        </div>
      </div>
    </article>`).join('');
  document.querySelector('#empty').style.display = list.length ? 'none' : 'block';
  grid.querySelectorAll('.add-button').forEach((button) => { button.onclick = () => openProduct(Number(button.dataset.id)); });
  window.animateProductCards?.();
}

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  const variants = product.options.length ? product.options : [{ name: '', price: product.price }];
  let selected = variants[0];
  document.querySelector('#modalContent').innerHTML = `
    ${product.image ? `<img class="modal-product-image" src="${product.image}" alt="${product.name}">` : ''}
    <span class="eyebrow dark">${product.category}</span><h2 id="modalTitle">${product.name}</h2>
    <p>${product.description || 'Découvrez ce produit sur la carte Di Napoli.'}</p>
    ${variants.length > 1 ? `<h4>Choisissez votre option</h4><div class="sizes">${variants.map((variant, index) => `<button class="size ${index === 0 ? 'active' : ''}" data-index="${index}"><span>${variant.name}</span><b>${euro(variant.price)}</b></button>`).join('')}</div>` : ''}
    <div class="modal-price"><b id="choicePrice">${euro(selected.price)}</b><button class="modal-add">Ajouter au panier</button></div>`;
  document.querySelectorAll('.size').forEach((button) => {
    button.onclick = () => {
      document.querySelectorAll('.size').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      selected = variants[Number(button.dataset.index)];
      document.querySelector('#choicePrice').textContent = euro(selected.price);
    };
  });
  document.querySelector('.modal-add').onclick = () => {
    const variantName = selected.name || 'Standard';
    const key = `${id}-${variantName}`;
    const found = cart.find((item) => item.key === key);
    if (found) found.qty += 1;
    else cart.push({ key, id, name: product.name, size: selected.name, price: selected.price, qty: 1 });
    closeModal();
    renderCart();
    const addButton = document.querySelector(`.add-button[data-id="${id}"]`);
    if (addButton) { addButton.classList.add('added'); setTimeout(() => addButton.classList.remove('added'), 650); }
    bumpCart();
    if (typeof showToast === 'function') showToast(`${product.name} ajouté au panier`);
  };
  document.querySelector('#modalBackdrop').classList.add('open');
}

function closeModal() { document.querySelector('#modalBackdrop').classList.remove('open'); }

function renderCart() {
  const qty = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  document.querySelector('#cartCount').textContent = qty;
  document.querySelector('#mobileCount').textContent = `${qty} article${qty > 1 ? 's' : ''}`;
  document.querySelector('#mobileTotal').textContent = euro(total);
  localStorage.setItem('dinapoli-cart', JSON.stringify(cart));
  const html = `<div class="cart-title"><h3>Votre panier</h3><small>${document.querySelector('.mode.active b').textContent}</small></div>${!cart.length ? `<div class="cart-empty"><span>◌</span><b>Votre panier est vide</b><small>Une pizza pourrait arranger ça.</small></div>` : `${cart.map((item) => `<div class="cart-item"><div><b>${item.name}</b><small>${item.size || '1 portion'} · ${euro(item.price)}</small></div><div class="qty"><button data-key="${item.key}" data-d="-1" aria-label="Retirer une unité">−</button><b>${item.qty}</b><button data-key="${item.key}" data-d="1" aria-label="Ajouter une unité">+</button></div></div>`).join('')}<div class="cart-total"><span>Total</span><span>${euro(total)}</span></div><button class="checkout">Finaliser ma commande <span>→</span></button>`}`;
  document.querySelector('#desktopCart').innerHTML = html;
  document.querySelector('#drawerContent').innerHTML = html;
  document.querySelectorAll('.qty button').forEach((button) => { button.onclick = () => changeQty(button.dataset.key, Number(button.dataset.d)); });
  document.querySelectorAll('.checkout').forEach((button) => { button.onclick = openCheckout; });
}

function changeQty(key, difference) {
  const item = cart.find((entry) => entry.key === key);
  item.qty += difference;
  if (item.qty <= 0) cart = cart.filter((entry) => entry.key !== key);
  renderCart();
  bumpCart();
}
function bumpCart() {
  document.querySelectorAll('.cart-button,.mobile-cart').forEach((element) => {
    element.classList.remove('bump'); void element.offsetWidth; element.classList.add('bump');
    setTimeout(() => element.classList.remove('bump'), 550);
  });
}
function openCart() { document.querySelector('#drawer').classList.add('open'); document.querySelector('#backdrop').classList.add('open'); }
function closeCart() { document.querySelector('#drawer').classList.remove('open'); document.querySelector('#backdrop').classList.remove('open'); }

const checkoutBackdrop = document.querySelector('#checkoutBackdrop');
const checkoutContent = document.querySelector('#checkoutContent');
const checkoutTotal = () => cart.reduce((sum, item) => sum + item.qty * item.price, 0);
const modeName = () => document.querySelector('.mode.active b').textContent;
const field = (label, name, type = 'text', placeholder = '', value = '') => `<label class="checkout-field"><span>${label}</span><input name="${name}" type="${type}" placeholder="${placeholder}" value="${value}" required></label>`;

function progress() {
  document.querySelector('#checkoutProgress').innerHTML = [1, 2, 3, 4].map((step) => `<i class="${step <= checkoutStep ? 'done' : ''}"></i>`).join('');
}

function openCheckout() {
  if (!cart.length) return;
  closeCart();
  checkoutStep = 1;
  checkoutBackdrop.classList.add('open');
  document.body.classList.add('modal-open');
  renderCheckout();
}

function closeCheckout() {
  checkoutBackdrop.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function renderCheckout() {
  progress();
  if (checkoutStep === 1) renderCheckoutSummary();
  if (checkoutStep === 2) renderCustomerDetails();
  if (checkoutStep === 3) renderOrderOptions();
  if (checkoutStep === 4) renderOrderSuccess();
}

function nextStep() { checkoutStep += 1; renderCheckout(); }
function previousStep() { checkoutStep -= 1; renderCheckout(); }

function renderCheckoutSummary() {
  checkoutContent.innerHTML = `<div class="checkout-view"><span class="auth-kicker">Étape 1 · Votre panier</span><div class="checkout-summary">${cart.map((item) => `<div class="checkout-line"><div><b>${item.qty} × ${item.name}</b><small>${item.size || 'Format standard'}</small></div><strong>${euro(item.qty * item.price)}</strong></div>`).join('')}</div><div class="checkout-total"><span>Total</span><strong>${euro(checkoutTotal())}</strong></div><div class="checkout-actions"><button class="checkout-secondary" data-action="menu">Ajouter autre chose</button><button class="checkout-primary" data-action="next">Continuer →</button></div></div>`;
  checkoutContent.querySelector('[data-action="menu"]').onclick = closeCheckout;
  checkoutContent.querySelector('[data-action="next"]').onclick = nextStep;
}

function renderCustomerDetails() {
  const delivery = modeName() === 'Livraison';
  const profile = (() => { try { return JSON.parse(localStorage.getItem('dinapoli-demo-profile')) || {}; } catch { return {}; } })();
  checkoutContent.innerHTML = `<div class="checkout-view"><span class="auth-kicker">Étape 2 · ${modeName()}</span><h3>Vos informations</h3><form class="checkout-form" id="customerForm"><div class="checkout-grid">${field('Prénom', 'firstName', 'text', 'Votre prénom', checkoutData.firstName || profile.firstName || '')}${field('Nom', 'lastName', 'text', 'Votre nom', checkoutData.lastName || profile.lastName || '')}</div><div class="checkout-grid">${field('Téléphone', 'phone', 'tel', '06 00 00 00 00', checkoutData.phone || profile.phone || '')}${field('E-mail', 'email', 'email', 'vous@exemple.fr', checkoutData.email || profile.email || '')}</div>${delivery ? `${field('Adresse de livraison', 'address', 'text', 'Numéro et rue', checkoutData.address || '')}<div class="checkout-grid">${field('Code postal', 'postal', 'text', '22400', checkoutData.postal || '22400')}${field('Ville', 'city', 'text', 'Lamballe-Armor', checkoutData.city || 'Lamballe-Armor')}</div>` : '<p class="demo-notice">Votre commande sera préparée au 9 rue Paul Langevin, Lamballe-Armor.</p>'}<div class="checkout-actions"><button type="button" class="checkout-secondary" data-action="back">← Retour</button><button class="checkout-primary" type="submit">Choisir le créneau →</button></div></form></div>`;
  checkoutContent.querySelector('[data-action="back"]').onclick = previousStep;
  document.querySelector('#customerForm').onsubmit = (event) => { event.preventDefault(); Object.assign(checkoutData, Object.fromEntries(new FormData(event.currentTarget))); nextStep(); };
}

function renderOrderOptions() {
  checkoutContent.innerHTML = `<div class="checkout-view"><span class="auth-kicker">Étape 3 · Derniers détails</span><h3>Quand et comment ?</h3><div class="checkout-form"><div class="checkout-field"><span>Créneau souhaité</span><div class="choice-grid" data-choice="time"><button class="checkout-choice active" data-value="Dès que possible"><b>Dès que possible</b><small>Environ 35–45 min</small></button><button class="checkout-choice" data-value="Plus tard"><b>Programmer</b><small>Choisir un horaire</small></button></div></div><label class="checkout-field schedule-field" hidden><span>Horaire</span><input type="time" min="11:00" max="23:00" value="19:30"></label><div class="checkout-field"><span>Mode de paiement</span><div class="choice-grid" data-choice="payment"><button class="checkout-choice active" data-value="Carte au restaurant"><b>Carte bancaire</b><small>Au retrait ou à la livraison</small></button><button class="checkout-choice" data-value="Espèces"><b>Espèces</b><small>Préparez l’appoint</small></button></div></div><label class="checkout-field"><span>Instructions facultatives</span><textarea id="orderNotes" placeholder="Digicode, allergie, précision pour la livraison…"></textarea></label><div class="checkout-actions"><button class="checkout-secondary" data-action="back">← Retour</button><button class="checkout-primary" data-action="confirm">Confirmer la commande · ${euro(checkoutTotal())}</button></div></div></div>`;
  checkoutContent.querySelector('[data-action="back"]').onclick = previousStep;
  checkoutContent.querySelectorAll('[data-choice]').forEach((group) => group.querySelectorAll('button').forEach((button) => {
    button.onclick = () => {
      group.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      checkoutData[group.dataset.choice] = button.dataset.value;
      if (group.dataset.choice === 'time') checkoutContent.querySelector('.schedule-field').hidden = button.dataset.value !== 'Plus tard';
    };
  }));
  checkoutContent.querySelector('[data-action="confirm"]').onclick = () => {
    checkoutData.notes = document.querySelector('#orderNotes').value;
    checkoutData.orderNumber = `DN-${String(Date.now()).slice(-5)}`;
    nextStep();
  };
}

function renderOrderSuccess() {
  checkoutContent.innerHTML = `<div class="checkout-view order-success"><div class="success-check">✓</div><span class="auth-kicker">Commande enregistrée en démonstration</span><h3>Merci ${checkoutData.firstName || ''} !</h3><p>Votre commande <strong>${modeName().toLowerCase()}</strong> est prête à être transmise au restaurant.<br>Aucun paiement ni envoi réel n’a été effectué.</p><strong class="order-number">${checkoutData.orderNumber}</strong><div class="order-status"><span class="active">✓ Commande reçue</span><span>Préparation</span><span>Prête / en livraison</span></div><div class="checkout-actions"><button class="checkout-primary" data-action="finish">Retourner à la carte</button></div></div>`;
  cart = [];
  renderCart();
  window.celebrateOrder?.();
  checkoutContent.querySelector('[data-action="finish"]').onclick = closeCheckout;
}

document.querySelectorAll('.mode').forEach((button) => { button.onclick = () => { document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active')); button.classList.add('active'); renderCart(); if (typeof showToast === 'function') showToast(`Mode ${button.dataset.mode} sélectionné`); }; });
document.querySelector('#search').oninput = (event) => { query = event.target.value; renderProducts(); };
document.querySelector('#catPrev').onclick = () => categoriesEl.scrollBy({ left: -280, behavior: 'smooth' });
document.querySelector('#catNext').onclick = () => categoriesEl.scrollBy({ left: 280, behavior: 'smooth' });
document.querySelector('#openCart').onclick = openCart;
document.querySelector('#mobileCart').onclick = openCart;
document.querySelector('#closeCart').onclick = closeCart;
document.querySelector('#backdrop').onclick = closeCart;
document.querySelector('#closeModal').onclick = closeModal;
document.querySelector('#modalBackdrop').onclick = (event) => { if (event.target.id === 'modalBackdrop') closeModal(); };
document.querySelector('#closeCheckout').onclick = closeCheckout;
checkoutBackdrop.onclick = (event) => { if (event.target === checkoutBackdrop) closeCheckout(); };
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeModal(); closeCart(); closeCheckout(); } });

renderCategories();
renderProducts();
renderCart();
