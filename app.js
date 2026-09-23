const { categories, products } = window.DINAPOLI_MENU;
let current = categories[0];
let query = '';
let cart = [];

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
  const html = `<div class="cart-title"><h3>Votre panier</h3><small>${document.querySelector('.mode.active b').textContent}</small></div>${!cart.length ? `<div class="cart-empty"><span>◌</span><b>Votre panier est vide</b><small>Une pizza pourrait arranger ça.</small></div>` : `${cart.map((item) => `<div class="cart-item"><div><b>${item.name}</b><small>${item.size || '1 portion'} · ${euro(item.price)}</small></div><div class="qty"><button data-key="${item.key}" data-d="-1">−</button><b>${item.qty}</b><button data-key="${item.key}" data-d="1">+</button></div></div>`).join('')}<div class="cart-total"><span>Total</span><span>${euro(total)}</span></div><button class="checkout">Continuer la commande</button>`}`;
  document.querySelector('#desktopCart').innerHTML = html;
  document.querySelector('#drawerContent').innerHTML = html;
  document.querySelectorAll('.qty button').forEach((button) => { button.onclick = () => changeQty(button.dataset.key, Number(button.dataset.d)); });
}

function changeQty(key, difference) {
  const item = cart.find((entry) => entry.key === key);
  item.qty += difference;
  if (item.qty <= 0) cart = cart.filter((entry) => entry.key !== key);
  renderCart();
}
function openCart() { document.querySelector('#drawer').classList.add('open'); document.querySelector('#backdrop').classList.add('open'); }
function closeCart() { document.querySelector('#drawer').classList.remove('open'); document.querySelector('#backdrop').classList.remove('open'); }

document.querySelectorAll('.mode').forEach((button) => { button.onclick = () => { document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active')); button.classList.add('active'); renderCart(); }; });
document.querySelector('#search').oninput = (event) => { query = event.target.value; renderProducts(); };
document.querySelector('#catPrev').onclick = () => categoriesEl.scrollBy({ left: -280, behavior: 'smooth' });
document.querySelector('#catNext').onclick = () => categoriesEl.scrollBy({ left: 280, behavior: 'smooth' });
document.querySelector('#openCart').onclick = openCart;
document.querySelector('#mobileCart').onclick = openCart;
document.querySelector('#closeCart').onclick = closeCart;
document.querySelector('#backdrop').onclick = closeCart;
document.querySelector('#closeModal').onclick = closeModal;
document.querySelector('#modalBackdrop').onclick = (event) => { if (event.target.id === 'modalBackdrop') closeModal(); };

renderCategories();
renderProducts();
renderCart();
