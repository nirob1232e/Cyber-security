/*
  Sentinel Secure — frontend prototype
  - Simple localStorage-backed users for demo only
  - Admin user has email: admin@sentinel.test and password: Admin@123
  - Replace with real backend and secure practices before production
*/

// --- Utilities
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

// --- Elements
const authModal = qs('#auth-modal');
const openLogin = qs('#open-login');
const openRegister = qs('#open-register');
const closeModal = qs('#close-modal');
const loginForm = qs('#login-form');
const registerForm = qs('#register-form');
const forgotForm = qs('#forgot-form');

const btnLogin = qs('#btn-login');
const btnRegister = qs('#btn-register');
const btnForgot = qs('#btn-forgot');

const adminArea = qs('#admin-area');
const usersTable = qs('#users-table');
const activityLog = qs('#activity-log');
const adminLogout = qs('#admin-logout');

// --- Mock storage keys
const STORAGE_USERS = 'sentinel_users';
const STORAGE_SESSION = 'sentinel_session';
const STORAGE_ACTIVITY = 'sentinel_activity';

// --- Bootstrap demo data
function seedDemo(){
  if(!localStorage.getItem(STORAGE_USERS)){
    const admin = {id: cryptoRandom(), name:'Admin', email:'admin@sentinel.test', password:'Admin@123', role:'admin', active:true};
    const user = {id: cryptoRandom(), name:'Demo User', email:'user@sentinel.test', password:'User@123', role:'user', active:true};
    localStorage.setItem(STORAGE_USERS, JSON.stringify([admin,user]));
    logActivity('Seeded demo users');
  }
}

function cryptoRandom(){return 'u_'+Math.random().toString(36).slice(2,9)}

function getUsers(){return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]')}
function saveUsers(u){localStorage.setItem(STORAGE_USERS, JSON.stringify(u))}
function getActivity(){return JSON.parse(localStorage.getItem(STORAGE_ACTIVITY)||'[]')}
function saveActivity(a){localStorage.setItem(STORAGE_ACTIVITY, JSON.stringify(a))}

function logActivity(msg){
  const a = getActivity();
  a.unshift({ts:new Date().toISOString(), text:msg});
  saveActivity(a);
  renderActivity();
}

function setSession(email){localStorage.setItem(STORAGE_SESSION, JSON.stringify({email}))}
function clearSession(){localStorage.removeItem(STORAGE_SESSION)}
function getSession(){return JSON.parse(localStorage.getItem(STORAGE_SESSION)||'null')}

// --- Render
function renderUsers(){
  const users = getUsers();
  usersTable.innerHTML = '';
  users.forEach(u=>{
    const row = document.createElement('div'); row.className='user-row';
    row.innerHTML = `
      <div class="user-meta">
        <div style="width:48px;height:48px;border-radius:8px;background:linear-gradient(135deg,#0b2230,#072b2a);display:flex;align-items:center;justify-content:center;font-weight:700">${u.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
        <div>
          <div class="name">${u.name} <span class="small">${u.email}</span></div>
          <div class="small">Role: <strong>${u.role}</strong> • ${u.active? 'Active':'Deactivated'}</div>
        </div>
      </div>
      <div class="actions">
        <button data-id="${u.id}" class="btn btn-ghost toggle-role">Toggle role</button>
        <button data-id="${u.id}" class="btn btn-ghost toggle-active">${u.active? 'Deactivate' : 'Activate'}</button>
      </div>
    `;
    usersTable.appendChild(row);
  });

  // attach handlers
  qsa('.toggle-role').forEach(b=>b.addEventListener('click',e=>{
    const id = e.currentTarget.dataset.id; toggleRole(id);
  }));
  qsa('.toggle-active').forEach(b=>b.addEventListener('click',e=>{
    const id = e.currentTarget.dataset.id; toggleActive(id);
  }));
}

function renderActivity(){
  const a = getActivity();
  activityLog.innerHTML = a.slice(0,50).map(i=>`<li class="small">${new Date(i.ts).toLocaleString()}: ${i.text}</li>`).join('');
}

// --- Admin actions
function toggleRole(id){
  const users = getUsers();
  const u = users.find(x=>x.id===id); if(!u) return;
  u.role = (u.role==='admin')? 'user' : 'admin';
  saveUsers(users); renderUsers(); logActivity(`Role changed for ${u.email} -> ${u.role}`);
}
function toggleActive(id){
  const users = getUsers();
  const u = users.find(x=>x.id===id); if(!u) return;
  u.active = !u.active; saveUsers(users); renderUsers(); logActivity(`${u.email} ${u.active? 'activated':'deactivated'}`);
}

// --- Auth flows (frontend-only)
function openModal(view='login'){
  authModal.classList.remove('hidden');
  loginForm.classList.toggle('hidden', view!=='login');
  registerForm.classList.toggle('hidden', view!=='register');
  forgotForm.classList.toggle('hidden', view!=='forgot');
}
function closeModalFn(){authModal.classList.add('hidden')}

function registerUser(){
  const name = qs('#reg-name').value.trim();
  const email = qs('#reg-email').value.trim().toLowerCase();
  const pw = qs('#reg-password').value;
  if(!name||!email||!pw){alert('Please fill all fields');return}
  const users = getUsers();
  if(users.some(u=>u.email===email)){alert('Email already registered');return}
  const user = {id:cryptoRandom(),name, email, password:pw, role:'user', active:true};
  users.push(user); saveUsers(users); logActivity(`New user registered: ${email}`); alert('Registered successfully — you can now login'); openModal('login');
}

function loginUser(){
  const email = qs('#login-email').value.trim().toLowerCase();
  const pw = qs('#login-password').value;
  const users = getUsers();
  const u = users.find(x=>x.email===email && x.password===pw);
  if(!u){alert('Invalid credentials'); logActivity(`Failed login attempt: ${email}`);return}
  if(!u.active){alert('Account is deactivated. Contact admin.'); return}
  setSession(u.email); logActivity(`${u.email} logged in`);
  closeModalFn();
  if(u.role==='admin') showAdmin(); else alert('Login successful — no further UI for regular users in this demo.');
}

function forgotPassword(){
  const email = qs('#forgot-email').value.trim().toLowerCase();
  const users = getUsers();
  const u = users.find(x=>x.email===email);
  if(!u){alert('No account with that email'); return}
  // demo: generate a token and show it (in real app, send email)
  const token = Math.floor(100000 + Math.random()*900000).toString();
  // store token temporary on user object (demo only)
  u.resetToken = token; saveUsers(users); logActivity(`Password reset requested for ${email}`);
  alert(`Recovery token (demo): ${token}\nUse console or UI to reset - replace with email sending on server.`);
}

// --- Admin UI show/hide
function showAdmin(){
  adminArea.classList.remove('hidden');
  renderUsers(); renderActivity();
}

function adminLogoutFn(){
  clearSession(); adminArea.classList.add('hidden'); logActivity('Admin logged out'); alert('Logged out');
}

// --- Attach events
openLogin.addEventListener('click',()=>openModal('login'));
openRegister.addEventListener('click',()=>openModal('register'));
qs('#cta-register').addEventListener('click',()=>openModal('register'));
qs('#cta-learn').addEventListener('click',()=>alert('This is a demo frontend prototype.'));
closeModal.addEventListener('click',closeModalFn);
qs('#show-forgot').addEventListener('click',(e)=>{e.preventDefault(); openModal('forgot')});
qs('#to-login').addEventListener('click',()=>openModal('login'));
qs('#to-login-2').addEventListener('click',()=>openModal('login'));
btnRegister.addEventListener('click',registerUser);
btnLogin.addEventListener('click',loginUser);
btnForgot.addEventListener('click',forgotPassword);
adminLogout.addEventListener('click',adminLogoutFn);

// --- Startup
seedDemo();
// if session exists and admin -> show admin immediately
const sess = getSession(); if(sess){
  const users = getUsers(); const u = users.find(x=>x.email===sess.email);
  if(u && u.role==='admin') showAdmin();
}

// Expose for debugging in console
window._sentinel = {getUsers, saveUsers, getActivity, logActivity};