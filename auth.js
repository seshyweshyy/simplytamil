/* ============================================================
   SimplyTamil — Firebase Auth & Cloud Save
   ============================================================= */

const firebaseConfig = {
  apiKey:            "AIzaSyC8Nq80jtvSIhD3twz__tUHrbaGUZx7xio",
  authDomain:        "simplytamil-f8938.firebaseapp.com",
  projectId:         "simplytamil-f8938",
  storageBucket:     "simplytamil-f8938.firebasestorage.app",
  messagingSenderId: "654137216348",
  appId:             "1:654137216348:web:6f07de7521542619cf0599"
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
    const photoData = localStorage.getItem('tamil_photo_data') || '';
    const initial = (_currentUser.displayName || _currentUser.email || '?')
                      .slice(0, 1).toUpperCase();
    btn.innerHTML = photoData
      ? `<img src="${photoData}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span class="pi-initials">${initial}</span>`;
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
  const name     = _currentUser.displayName || _currentUser.email.split('@')[0];
  const photoData = localStorage.getItem('tamil_photo_data') || '';
  const quizLabels = {'letter-id':'Letter ID','word-match':'Word Match','phrase-fill':'Phrase Fill','mixed':'Mixed'};
  const bestHTML = Object.keys(best).length
    ? Object.entries(best).map(([k,v]) => `
        <div class="pd-quiz-score">
          <span class="pd-quiz-label">${quizLabels[k]||k}</span>
          <span class="pd-quiz-pct" style="color:${v>=80?'var(--green)':v>=50?'var(--gold)':'var(--red)'}">${v}%</span>
        </div>`).join('')
    : '<div style="font-size:0.75rem;color:var(--text3);padding:0.2rem 0">No quizzes completed yet</div>';

  const drop = document.createElement('div');
  drop.id = 'profile-dropdown';
  drop.className = 'profile-dropdown';
  drop.innerHTML = `
    <div class="pd-header">
      <div class="pd-avatar" style="${photoData ? 'padding:0;overflow:hidden;' : ''}">
        ${photoData
          ? `<img src="${photoData}" style="width:100%;height:100%;object-fit:cover;">`
          : name.slice(0,1).toUpperCase()
        }
      </div>
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
    <div class="pd-quiz-row">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);margin-bottom:0.4rem">Best scores</div>
      ${bestHTML}
    </div>
    <div class="pd-divider"></div>
    <button class="pd-action-btn" onclick="openProfileSettings()">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit profile
    </button>
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
    chatHistory: localStorage.getItem('tamil_save_chat') === 'false' ? [] : JSON.parse(localStorage.getItem('tamil_chat_history') || '[]'),
    photoData: localStorage.getItem('tamil_photo_data') || '',
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
  if (d.chatHistory) {
    localStorage.setItem('tamil_chat_history', JSON.stringify(d.chatHistory));
  }
  if (d.photoData !== undefined) localStorage.setItem('tamil_photo_data', d.photoData);
  if (typeof loadChatHistory === 'function') loadChatHistory();

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
    await _auth.signInWithRedirect(provider);
  } catch (e) {
    setAuthError('Google sign-in failed. Please try again.');
  }
}

// Handle the redirect result when the page loads back
_auth && _auth.getRedirectResult && _auth.getRedirectResult().then(result => {
  if (result && result.user) {
    _currentUser = result.user;
    loadCloudProgress().then(() => {
      closeAuthModal();
      _showToast('Signed in with Google ✓');
    });
  }
}).catch(e => {
  if (e.code !== 'auth/no-auth-event') console.error(e);
});

/* ═══════════════════════════════════════════════════════════════
   CHAT HISTORY SAVE / LOAD
   ═══════════════════════════════════════════════════════════════ */
function saveChatHistory() {
  if (localStorage.getItem('tamil_save_chat') === 'false') return;
  const MAX_MSGS = 20;
  const msgs = chatHistory.slice(-MAX_MSGS);
  localStorage.setItem('tamil_chat_history', JSON.stringify(msgs));
  if (_currentUser) saveCloudProgress();
}

function loadChatHistory() {
  const saved = localStorage.getItem('tamil_chat_history');
  if (!saved) return;
  try {
    const msgs = JSON.parse(saved);
    if (!msgs.length) return;
    chatHistory = msgs;
    // Re-render saved messages in the UI
    const container = document.getElementById('chat-msgs');
    // Clear default welcome message
    container.innerHTML = '';
    msgs.forEach(m => {
      if (typeof m.content === 'string') {
        appendChat(m.role, m.content);
      }
    });
  } catch(e) { console.error('Chat history load failed', e); }
}

function toggleChatHistorySetting(btn) {
  const current = localStorage.getItem('tamil_save_chat') !== 'false';
  const newVal = !current;
  localStorage.setItem('tamil_save_chat', newVal ? 'true' : 'false');
  btn.textContent = newVal ? 'On' : 'Off';
  btn.classList.toggle('off', !newVal);
  if (!newVal) {
    // clear saved history when turning off
    localStorage.removeItem('tamil_chat_history');
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE SETTINGS
   ═══════════════════════════════════════════════════════════════ */
function openProfileSettings() {
  closeProfileDropdown();
  const name = _currentUser.displayName || '';
  const photoURL = localStorage.getItem('tamil_photo_data') || '';

  const overlay = document.createElement('div');
  overlay.id = 'profile-settings-overlay';
  overlay.className = 'auth-modal-overlay open';
  overlay.onclick = e => { if (e.target === overlay) closeProfileSettings(); };

  overlay.innerHTML = `
    <div class="auth-card" style="max-width:420px">
      <button class="auth-card-close" onclick="closeProfileSettings()">×</button>
      <div class="auth-logo-strip">
        <div class="auth-logo-mark">Edit <span>Profile</span></div>
      </div>

      <div class="ps-avatar-wrap">
        <div class="ps-avatar" id="ps-avatar-preview">
          ${photoURL
            ? `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
            : `<span style="font-size:2rem;font-weight:600;color:var(--accent)">${(name||'?').slice(0,1).toUpperCase()}</span>`
          }
        </div>
        <div class="ps-avatar-actions">
          <button class="ps-avatar-btn" onclick="document.getElementById('ps-photo-input').click()">Upload photo</button>
          ${photoURL ? `<button class="ps-avatar-btn danger" onclick="removeProfilePhoto()">Remove</button>` : ''}
        </div>
        <input type="file" id="ps-photo-input" accept="image/*" style="display:none" onchange="handleProfilePhotoUpload(this)">
        <p style="font-size:0.72rem;color:var(--text3);text-align:center;margin-top:0.4rem">Max 1MB · JPG or PNG</p>
      </div>

      <div class="auth-field">
        <label class="auth-label">Display Name</label>
        <input id="ps-name-input" type="text" class="auth-input"
          value="${name}"
          placeholder="Your name"
          maxlength="32">
      </div>

      <div class="ps-toggle-row">
        <div class="ps-toggle-info">
          <span class="ps-toggle-label">Save chat history</span>
          <span class="ps-toggle-sub">Syncs your last 20 tutor messages across devices</span>
        </div>
        <button class="ps-toggle-btn" id="ps-chat-toggle" onclick="toggleChatHistorySetting(this)">
          ${localStorage.getItem('tamil_save_chat') === 'false' ? 'Off' : 'On'}
        </button>
      </div>

      <div class="ps-toggle-row">
        <div class="ps-toggle-info">
          <span class="ps-toggle-label">Quiz hints</span>
          <span class="ps-toggle-sub">Show romanisation under Tamil words during quizzes</span>
        </div>
        <button class="ps-toggle-btn ${localStorage.getItem('tamil_quiz_hints') === 'false' ? 'off' : ''}"
          id="ps-hints-toggle" onclick="toggleHintsSetting(this)">
          ${localStorage.getItem('tamil_quiz_hints') === 'false' ? 'Off' : 'On'}
        </button>
      </div>

      <div class="auth-error-msg" id="ps-error" style="display:none"></div>

      <button class="auth-submit-btn" id="ps-save-btn" onclick="saveProfileSettings()">
        Save Changes
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeProfileSettings() {
  const el = document.getElementById('profile-settings-overlay');
  if (el) el.remove();
}

function handleProfilePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 1_048_576) {
    document.getElementById('ps-error').textContent = 'Image must be under 1MB.';
    document.getElementById('ps-error').style.display = 'block';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('ps-avatar-preview');
    preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    // Store temporarily
    window._pendingPhotoDataUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function removeProfilePhoto() {
  window._pendingPhotoDataUrl = null;
  window._removePhoto = true;
  const preview = document.getElementById('ps-avatar-preview');
  const name = document.getElementById('ps-name-input').value || '?';
  preview.innerHTML = `<span style="font-size:2rem;font-weight:600;color:var(--accent)">${name.slice(0,1).toUpperCase()}</span>`;
}

async function saveProfileSettings() {
  const name  = document.getElementById('ps-name-input').value.trim();
  const errEl = document.getElementById('ps-error');
  const btn   = document.getElementById('ps-save-btn');

  if (!name) { errEl.textContent = 'Please enter a display name.'; errEl.style.display = 'block'; return; }

  btn.disabled = true;
  btn.textContent = 'Saving…';
  errEl.style.display = 'none';

  try {
    // Get current photo stored in Firestore (not Firebase Auth)
    const snap = await _db.collection('users').doc(_currentUser.uid).get();
    let photoData = snap.exists ? (snap.data().photoData || '') : '';

    if (window._pendingPhotoDataUrl) {
      photoData = window._pendingPhotoDataUrl;
      window._pendingPhotoDataUrl = null;
    } else if (window._removePhoto) {
      photoData = '';
      window._removePhoto = false;
    }

    // Only update displayName in Firebase Auth (no photoURL — avoid the URL restriction)
    await _currentUser.updateProfile({ displayName: name });

    // Store everything including photo in Firestore
    await _db.collection('users').doc(_currentUser.uid).set(
      { displayName: name, photoData }, { merge: true }
    );

    // Cache locally so the UI updates immediately
    localStorage.setItem('tamil_photo_data', photoData);

    updateProfileIcon();
    closeProfileSettings();
    _showToast('Profile updated ✓');
  } catch(e) {
    console.error(e);
    errEl.textContent = 'Failed to save. Please try again.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

function toggleHintsSetting(btn) {
  const current = localStorage.getItem('tamil_quiz_hints') !== 'false';
  const newVal = !current;
  localStorage.setItem('tamil_quiz_hints', newVal ? 'true' : 'false');
  btn.textContent = newVal ? 'On' : 'Off';
  btn.classList.toggle('off', !newVal);
}