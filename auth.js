/* ============================================================
   SimplyTamil — Firebase Auth & Cloud Save
   ============================================================
   SETUP (5 min):
   1. Go to https://console.firebase.google.com
   2. New project → Add Web App → copy the config object
   3. Authentication → Sign-in method → enable Email/Password
   4. Firestore Database → Create database (production mode)
   5. Firestore → Rules tab → paste:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId} {
            allow read, write: if request.auth != null
                               && request.auth.uid == userId;
          }
        }
      }

   6. Replace firebaseConfig below with YOUR project values.
   ============================================================ */

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

/* ── Globals ─────────────────────────────────────────────────── */
let _auth = null, _db = null, _currentUser = null;
let _nudgeCount = 0;
let _nudgeTimeout = null;

/* ── Bootstrap: load Firebase SDKs then init ─────────────────── */
(function bootstrap() {
  const CDN = 'https://www.gstatic.com/firebasejs/10.12.0/';
  const load = src => new Promise(r => {
    const s = document.createElement('script');
    s.src = CDN + src; s.onload = r; document.head.appendChild(s);
  });
  Promise.all([
    load('firebase-app-compat.js'),
    load('firebase-auth-compat.js'),
    load('firebase-firestore-compat.js')
  ]).then(() => {
    firebase.initializeApp(firebaseConfig);
    _auth = firebase.auth();
    _db   = firebase.firestore();

    _auth.onAuthStateChanged(user => {
      _currentUser = user;
      updateProfileIcon();
      if (user) {
        loadCloudProgress().then(() => {
          closeAuthModal();
          _showToast('Progress synced ✓');
        });
      }
    });

    // Check streak on load
    checkAndUpdateStreak();
  });
})();

/* ═══════════════════════════════════════════════════════════════
   PROFILE ICON  (always in the nav, no login wall)
   ═══════════════════════════════════════════════════════════════ */
function updateProfileIcon() {
  const btn = document.getElementById('profile-icon-btn');
  if (!btn) return;
  if (_currentUser) {
    const initial = (_currentUser.displayName || _currentUser.email || '?')
                      .slice(0, 1).toUpperCase();
    btn.innerHTML = `<span class="pi-initials">${initial}</span>`;
    btn.classList.add('signed-in');
    btn.title = _currentUser.displayName || _currentUser.email;
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="19" height="19" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>`;
    btn.classList.remove('signed-in');
    btn.title = 'Log in to save progress';
  }
}

function onProfileIconClick() {
  if (_currentUser) showProfileDropdown();
  else openAuthModal();
}

/* ═══════════════════════════════════════════════════════════════
   AUTH MODAL
   ═══════════════════════════════════════════════════════════════ */
let _authMode = 'login';

function openAuthModal(nudgeMsg) {
  const ov = document.getElementById('auth-modal-overlay');
  ov.classList.add('open');
  setAuthMode('login');
  setAuthError('');
  const nm = document.getElementById('auth-nudge-msg');
  if (nudgeMsg) { nm.textContent = nudgeMsg; nm.style.display = 'block'; }
  else           { nm.style.display = 'none'; }
  setTimeout(() => {
    const inp = document.getElementById('auth-email-input');
    if (inp) inp.focus();
  }, 120);
}

function closeAuthModal() {
  document.getElementById('auth-modal-overlay').classList.remove('open');
  setAuthError('');
}

function setAuthMode(mode) {
  _authMode = mode;
  const signup = mode === 'signup';
  document.getElementById('auth-modal-title').textContent = signup ? 'Create Account' : 'Welcome Back';
  document.getElementById('auth-name-field').style.display = signup ? 'flex' : 'none';
  document.getElementById('auth-submit-btn').textContent   = signup ? 'Create Account' : 'Log In';
  document.getElementById('auth-toggle-text').innerHTML    = signup
    ? `Already have an account? <a onclick="setAuthMode('login')" href="#">Log in</a>`
    : `New here? <a onclick="setAuthMode('signup')" href="#">Create account</a>`;
  setAuthError('');
}

function setAuthError(msg, type) {
  const el = document.getElementById('auth-error-msg');
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
  el.className = 'auth-error-msg' + (type === 'success' ? ' success' : '');
}

function _setAuthLoading(on) {
  const btn = document.getElementById('auth-submit-btn');
  btn.disabled = on;
  if (!on) btn.textContent = _authMode === 'signup' ? 'Create Account' : 'Log In';
  else btn.textContent = 'Please wait…';
}

async function handleAuthSubmit() {
  const email = document.getElementById('auth-email-input').value.trim();
  const pass  = document.getElementById('auth-password-input').value;
  const name  = document.getElementById('auth-name-input').value.trim();
  if (!email || !pass) { setAuthError('Please fill in all fields.'); return; }
  if (_authMode === 'signup' && !name) { setAuthError('Please enter a display name.'); return; }
  _setAuthLoading(true);
  try {
    if (_authMode === 'signup') {
      const cred = await _auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      _currentUser = cred.user;
      await saveCloudProgress();
    } else {
      await _auth.signInWithEmailAndPassword(email, pass);
    }
  } catch (e) {
    _setAuthLoading(false);
    const map = {
      'auth/email-already-in-use': 'That email is already registered.',
      'auth/invalid-email':        'Please enter a valid email.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/user-not-found':       'No account found with that email.',
      'auth/wrong-password':       'Incorrect password.',
      'auth/invalid-credential':   'Incorrect email or password.',
    };
    setAuthError(map[e.code] || e.message);
  }
}

async function handleSignOut() {
  closeProfileDropdown();
  await saveCloudProgress();
  await _auth.signOut();
  _currentUser = null;
  updateProfileIcon();
  _showToast('Signed out');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAuthModal(); });

/* ═══════════════════════════════════════════════════════════════
   PROFILE DROPDOWN  (when signed in)
   ═══════════════════════════════════════════════════════════════ */
function showProfileDropdown() {
  closeProfileDropdown();
  const btn    = document.getElementById('profile-icon-btn');
  const rect   = btn.getBoundingClientRect();
  const streak = parseInt(localStorage.getItem('tamil_streak') || '0');
  const xp     = parseInt(localStorage.getItem('tamil_xp')     || '0');
  const best   = JSON.parse(localStorage.getItem('tamil_quiz_best') || '{}');
  const name   = _currentUser.displayName || _currentUser.email.split('@')[0];
  const bestStr = Object.keys(best).length
    ? Object.entries(best).map(([k,v]) => `${k}: ${v}%`).join(' · ')
    : 'No quizzes yet';

  const drop = document.createElement('div');
  drop.id = 'profile-dropdown';
  drop.className = 'profile-dropdown';
  drop.innerHTML = `
    <div class="pd-header">
      <div class="pd-avatar">${name.slice(0,1).toUpperCase()}</div>
      <div class="pd-info">
        <div class="pd-name">${name}</div>
        <div class="pd-email">${_currentUser.email}</div>
      </div>
    </div>
    <div class="pd-stats">
      <div class="pd-stat"><div class="pd-stat-val">🔥 ${streak}</div><div class="pd-stat-lbl">day streak</div></div>
      <div class="pd-stat"><div class="pd-stat-val">⭐ ${xp}</div><div class="pd-stat-lbl">total XP</div></div>
      <div class="pd-stat"><div class="pd-stat-val">${Object.keys(JSON.parse(localStorage.getItem('tamil_learned')||'[]')).length || JSON.parse(localStorage.getItem('tamil_learned')||'[]').length}</div><div class="pd-stat-lbl">letters learned</div></div>
    </div>
    <div class="pd-quiz-row">Best scores: ${bestStr}</div>
    <div class="pd-divider"></div>
    <button class="pd-action-btn" onclick="saveCloudProgress().then(()=>{ closeProfileDropdown(); _showToast('Saved ✓'); })">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
      Save progress now
    </button>
    <button class="pd-action-btn danger" onclick="handleSignOut()">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Sign out
    </button>
  `;
  drop.style.top   = (rect.bottom + 10) + 'px';
  drop.style.right = (window.innerWidth - rect.right) + 'px';
  document.body.appendChild(drop);
  requestAnimationFrame(() => drop.classList.add('open'));
  setTimeout(() => document.addEventListener('click', _outsideDropdown), 10);
}

function _outsideDropdown(e) {
  const drop = document.getElementById('profile-dropdown');
  const btn  = document.getElementById('profile-icon-btn');
  if (drop && !drop.contains(e.target) && btn && !btn.contains(e.target)) closeProfileDropdown();
}

function closeProfileDropdown() {
  const d = document.getElementById('profile-dropdown');
  if (d) d.remove();
  document.removeEventListener('click', _outsideDropdown);
}

/* ═══════════════════════════════════════════════════════════════
   SAVE NUDGE BANNER  (gentle, dismissable)
   ═══════════════════════════════════════════════════════════════ */
const _nudgeMessages = {
  learned: "Log in to save your learned letters across every device",
  xp:      "Log in to keep your XP — don't lose it when you close the tab",
  quiz:    "Log in to track your quiz best scores",
  streak:  "Log in to save your daily streak 🔥",
  vocab:   "Log in to save your mastered vocabulary cards",
};

function triggerSaveNudge(type) {
  if (_currentUser) return;              // already logged in
  _nudgeCount++;
  if (_nudgeCount > 4) return;           // don't spam

  const msg = _nudgeMessages[type] || "Log in to save your progress";
  let banner = document.getElementById('save-nudge-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'save-nudge-banner';
    banner.className = 'save-nudge-banner';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <span class="snb-icon">☁️</span>
    <span class="snb-msg">${msg}</span>
    <button class="snb-login" onclick="openAuthModal('${msg}');dismissNudge()">Log in</button>
    <button class="snb-dismiss" onclick="dismissNudge()">×</button>
  `;
  banner.classList.add('visible');
  clearTimeout(_nudgeTimeout);
  _nudgeTimeout = setTimeout(dismissNudge, 7000);
}

function dismissNudge() {
  const b = document.getElementById('save-nudge-banner');
  if (b) b.classList.remove('visible');
}

/* ═══════════════════════════════════════════════════════════════
   CLOUD SAVE / LOAD
   ═══════════════════════════════════════════════════════════════ */
async function saveCloudProgress() {
  if (!_currentUser || !_db) return;
  const payload = {
    xp:             parseInt(localStorage.getItem('tamil_xp')            || '0'),
    learnedLetters: JSON.parse(localStorage.getItem('tamil_learned')      || '[]'),
    masteredVocab:  JSON.parse(localStorage.getItem('tamil_mastered_vocab')|| '[]'),
    quizBest:       JSON.parse(localStorage.getItem('tamil_quiz_best')    || '{}'),
    streak:         parseInt(localStorage.getItem('tamil_streak')         || '0'),
    lastActive:     localStorage.getItem('tamil_last_active')             || '',
    displayName:    _currentUser.displayName || '',
    updatedAt:      firebase.firestore.FieldValue.serverTimestamp()
  };
  await _db.collection('users').doc(_currentUser.uid).set(payload, { merge: true });
}

async function loadCloudProgress() {
  if (!_currentUser || !_db) return;
  const snap = await _db.collection('users').doc(_currentUser.uid).get();
  if (!snap.exists) return;
  const d = snap.data();
  const setLS = (key, val) => { if (val !== undefined && val !== null) localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val); };
  setLS('tamil_xp',             d.xp);
  setLS('tamil_learned',        d.learnedLetters);
  setLS('tamil_mastered_vocab', d.masteredVocab);
  setLS('tamil_quiz_best',      d.quizBest);
  setLS('tamil_streak',         d.streak);
  setLS('tamil_last_active',    d.lastActive);

  // Push into live globals defined in script.js
  if (typeof XP !== 'undefined') {
    XP = parseInt(d.xp || 0);
    learnedLetters = d.learnedLetters || [];
    if (typeof saveXP         === 'function') saveXP();
    if (typeof renderLetters  === 'function') renderLetters();
    if (typeof updateProgress === 'function') updateProgress();
  }
  if (typeof updateStreakDisplay === 'function') updateStreakDisplay();
}

setInterval(() => { if (_currentUser) saveCloudProgress(); }, 90_000);
window.addEventListener('beforeunload', () => { if (_currentUser) saveCloudProgress(); });

/* ═══════════════════════════════════════════════════════════════
   STREAK
   ═══════════════════════════════════════════════════════════════ */
function checkAndUpdateStreak() {
  const today     = new Date().toDateString();
  const last      = localStorage.getItem('tamil_last_active');
  let   streak    = parseInt(localStorage.getItem('tamil_streak') || '0');
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();

  if (last === today) { /* already counted */ }
  else if (last === yesterday) { streak++; }
  else { streak = 1; }

  localStorage.setItem('tamil_streak',      streak);
  localStorage.setItem('tamil_last_active', today);
  if (_currentUser) saveCloudProgress();
  if (typeof updateStreakDisplay === 'function') updateStreakDisplay();
  if (streak > 1) triggerSaveNudge('streak');
  return streak;
}

/* ═══════════════════════════════════════════════════════════════
   QUIZ BEST SCORES
   ═══════════════════════════════════════════════════════════════ */
function saveQuizBest(type, pct) {
  const best = JSON.parse(localStorage.getItem('tamil_quiz_best') || '{}');
  if (!best[type] || pct > best[type]) {
    best[type] = pct;
    localStorage.setItem('tamil_quiz_best', JSON.stringify(best));
    if (_currentUser) saveCloudProgress();
    else triggerSaveNudge('quiz');
  }
}

/* ═══════════════════════════════════════════════════════════════
   TOAST helper (reuses existing #xp-toast)
   ═══════════════════════════════════════════════════════════════ */
function _showToast(msg) {
  const t = document.getElementById('xp-toast');
  if (!t) return;
  const prev = t.textContent;
  t.textContent = msg; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; t.textContent = prev; }, 2200);
}

async function handleGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await _auth.signInWithPopup(provider);
  } catch (e) {
    setAuthError('Google sign-in failed. Please try again.');
  }
}