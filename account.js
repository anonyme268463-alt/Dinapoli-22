const accountBackdrop = document.querySelector('#accountBackdrop');
const accountContent = document.querySelector('#accountContent');
const accountLabel = document.querySelector('#accountLabel');
const profileKey = 'dinapoli-demo-profile';

const getProfile = () => {
  try { return JSON.parse(localStorage.getItem(profileKey)); }
  catch { return null; }
};

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function updateAccountLabel() {
  const profile = getProfile();
  accountLabel.textContent = profile?.firstName || 'Se connecter';
  document.querySelector('#openAccount').classList.toggle('connected', Boolean(profile));
}

function authField(label, type, name, placeholder, autocomplete) {
  return `<label class="auth-field"><span>${label}</span><input type="${type}" name="${name}" placeholder="${placeholder}" autocomplete="${autocomplete}" required></label>`;
}

function renderLogin() {
  accountContent.innerHTML = `
    <div class="auth-heading"><span class="auth-kicker">Heureux de vous revoir</span><h2 id="accountTitle">Connexion</h2><p>Retrouvez vos informations et vos commandes.</p></div>
    <form class="auth-form" id="loginForm">
      ${authField('Adresse e-mail', 'email', 'email', 'vous@exemple.fr', 'email')}
      ${authField('Mot de passe', 'password', 'password', 'Votre mot de passe', 'current-password')}
      <div class="auth-row"><label class="remember"><input type="checkbox"> Se souvenir de moi</label><button type="button" class="text-action" data-view="forgot">Mot de passe oublié ?</button></div>
      <button class="auth-submit" type="submit">Se connecter <span>→</span></button>
    </form>
    <div class="auth-switch">Pas encore de compte ? <button data-view="register">Créer mon compte</button></div>`;
  bindViews();
  document.querySelector('#loginForm').onsubmit = (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    const previous = getProfile();
    localStorage.setItem(profileKey, JSON.stringify(previous || { firstName: email.split('@')[0], email }));
    updateAccountLabel();
    renderDashboard();
    showToast('Connexion de démonstration réussie');
  };
}

function renderRegister() {
  accountContent.innerHTML = `
    <div class="auth-heading"><span class="auth-kicker">Rejoignez Di Napoli</span><h2 id="accountTitle">Créer un compte</h2><p>Commandez plus rapidement et préparez votre futur programme de fidélité.</p></div>
    <form class="auth-form" id="registerForm">
      <div class="auth-grid">${authField('Prénom', 'text', 'firstName', 'Noé', 'given-name')}${authField('Nom', 'text', 'lastName', 'Votre nom', 'family-name')}</div>
      ${authField('Adresse e-mail', 'email', 'email', 'vous@exemple.fr', 'email')}
      ${authField('Téléphone', 'tel', 'phone', '06 00 00 00 00', 'tel')}
      ${authField('Mot de passe', 'password', 'password', '8 caractères minimum', 'new-password')}
      <label class="consent"><input type="checkbox" required><span>J’accepte que mes informations soient utilisées pour gérer mon compte et mes commandes.</span></label>
      <button class="auth-submit" type="submit">Créer mon compte <span>→</span></button>
    </form>
    <div class="auth-switch">Déjà client ? <button data-view="login">Me connecter</button></div>`;
  bindViews();
  document.querySelector('#registerForm').onsubmit = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    localStorage.setItem(profileKey, JSON.stringify({ firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone }));
    updateAccountLabel();
    renderDashboard();
    showToast('Compte de démonstration créé');
  };
}

function renderForgot() {
  accountContent.innerHTML = `
    <button class="auth-back" data-view="login">← Retour</button>
    <div class="auth-heading"><span class="auth-kicker">Pas d’inquiétude</span><h2 id="accountTitle">Mot de passe oublié</h2><p>Indiquez votre e-mail pour recevoir un lien de réinitialisation.</p></div>
    <form class="auth-form" id="forgotForm">${authField('Adresse e-mail', 'email', 'email', 'vous@exemple.fr', 'email')}<button class="auth-submit" type="submit">Envoyer le lien <span>→</span></button></form>`;
  bindViews();
  document.querySelector('#forgotForm').onsubmit = (event) => { event.preventDefault(); showToast('Simulation : e-mail de réinitialisation envoyé'); renderLogin(); };
}

function renderDashboard() {
  const profile = getProfile();
  if (!profile) return renderLogin();
  accountContent.innerHTML = `
    <div class="profile-hero"><div class="avatar">${(profile.firstName || 'C').charAt(0).toUpperCase()}</div><div><span>Bonsoir,</span><h2 id="accountTitle">${profile.firstName || 'Client'}</h2><p>${profile.email || ''}</p></div></div>
    <div class="account-stats"><div><strong>0</strong><span>Commande</span></div><div><strong>0</strong><span>Point fidélité</span></div></div>
    <div class="account-links"><button><span>⌂</span><div><b>Mes adresses</b><small>Gérer mes lieux de livraison</small></div><i>›</i></button><button><span>♡</span><div><b>Mes favoris</b><small>Retrouver mes produits préférés</small></div><i>›</i></button><button><span>▤</span><div><b>Mes commandes</b><small>Consulter mon historique</small></div><i>›</i></button></div>
    <button class="logout-button" id="logoutAccount">Se déconnecter</button>`;
  document.querySelector('#logoutAccount').onclick = () => { localStorage.removeItem(profileKey); updateAccountLabel(); renderLogin(); showToast('Vous êtes déconnecté'); };
}

function bindViews() {
  accountContent.querySelectorAll('[data-view]').forEach((button) => {
    button.onclick = () => ({ login: renderLogin, register: renderRegister, forgot: renderForgot })[button.dataset.view]();
  });
}

function openAccount() { getProfile() ? renderDashboard() : renderLogin(); accountBackdrop.classList.add('open'); document.body.classList.add('modal-open'); }
function closeAccount() { accountBackdrop.classList.remove('open'); document.body.classList.remove('modal-open'); }

document.querySelector('#openAccount').onclick = openAccount;
document.querySelector('#closeAccount').onclick = closeAccount;
accountBackdrop.onclick = (event) => { if (event.target === accountBackdrop) closeAccount(); };
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAccount(); });
updateAccountLabel();
