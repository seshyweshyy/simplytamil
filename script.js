var XP = parseInt(localStorage.getItem('tamil_xp')||0);
var learnedLetters = JSON.parse(localStorage.getItem('tamil_learned')||'[]');
var currentLetter = null;

function saveXP(){
  localStorage.setItem('tamil_xp',XP);
  document.getElementById('xp-display').textContent=XP+' XP';
}

function addXP(n) {
  XP += n;
  saveXP();
  showToast('+' + n + ' XP');
  if (n >= 5 && typeof triggerSaveNudge === 'function') {
    triggerSaveNudge('xp');
  }
}

function showToast(msg) {
  var t = document.getElementById('xp-toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(function() { t.style.display = 'none'; }, 2000);
}
document.getElementById('xp-display').textContent=XP+' XP';

/* ── Device detection ──────────────────────────────────────────────────────
   True if the browser is running on a phone/tablet (touch device with a
   mobile UA). iPads report desktop UA in modern Safari, but maxTouchPoints
   catches them too.
   ─────────────────────────────────────────────────────────────────────── */
var IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
             || ('ontouchstart' in window && navigator.maxTouchPoints > 1);

var VOWELS = [
  {
    t:'அ',
    r:'a',
    name:'short a',
    guide:'Like the "a" in "about". Short and quick.',
    words:[
      {t:'அம்மா',r:'ammā',e:'mother'},
      {t:'அன்பு',r:'anbu',e:'love'}
    ]
  },
  {
    t:'ஆ',
    r:'ā',
    name:'long a',
    guide:'Like "ah" — held longer. The mouth opens wide.',
    words:[
      {t:'ஆமா',r:'āmā',e:'yes (informal)'},
      {t:'ஆகாயம்',r:'ākāyam',e:'sky'}
    ]
  },
  {
    t:'இ',
    r:'i',
    name:'short i',
    guide:'Like "i" in "bit". Short, front of mouth.',
    words:[
      {t:'இல்லை',r:'illai',e:'no'},
      {t:'இந்தியா',r:'Indhiyā',e:'India'}
    ]
  },
  {
    t:'ஈ',
    r:'ī',
    name:'long i',
    guide:'Like "ee" in "feet". Held longer.',
    words:[
      {t:'ஈ',r:'ī',e:'fly (insect)'},
      {t:'ஈர்ப்பு',r:'īrppu',e:'gravity'}
    ]
  },
  {
    t:'உ',
    r:'u',
    name:'short u',
    guide:'Like "u" in "put". Lips rounded, short.',
    words:[
      {t:'உணவு',r:'uṇavu',e:'food'},
      {t:'உடல்',r:'uḍal',e:'body'}
    ]
  },
  {
    t:'ஊ',
    r:'ū',
    name:'long u',
    guide:'Like "oo" in "food". Held longer.',
    words:[{t:'ஊர்',r:'ūr',e:'village/town'},
      {t:'ஊசி',r:'ūci',e:'needle'}
    ]
  },
  {
    t:'எ',
    r:'e',
    name:'short e',
    guide:'Like "e" in "pet". Short and crisp.',
    words:[
      {t:'எலி',r:'eli',e:'rat'},
      {t:'எங்கே',r:'eṅkē',e:'where'}
    ]
  },
  {
    t:'ஏ',
    r:'ē',
    name:'long e',guide:'Like "ay" in "say". Held longer.',
    words:[
      {t:'ஏன்',r:'ēn',e:'why'},
      {t:'ஏணி',r:'ēṇi',e:'ladder'}
    ]
  },
  {
    t:'ஐ',
    r:'ai',
    name:'ai diphthong',
    guide:'Like "ai" in "aisle". Two vowel sounds blended.',
    words:[
      {t:'ஐந்து',r:'aindu',e:'five'},
      {t:'ஐயம்',r:'aiyam',e:'doubt'}
    ]
  },
  {
    t:'ஒ',
    r:'o',
    name:'short o',
    guide:'Like "o" in "got" (British). Short and round.',
    words:[
      {t:'ஒன்று',r:'ondru',e:'one'},
      {t:'ஒளி',r:'oḷi',e:'light'}
    ]
  },
  {
    t:'ஓ',
    r:'ō',
    name:'long o',
    guide:'Like "o" in "go". Held longer.',
    words:[
      {t:'ஓடு',r:'ōḍu',e:'run (verb)'},
      {t:'ஓவியம்',r:'ōviyam',e:'painting'}
    ]
  },
  {
    t:'ஔ',
    r:'au',
    name:'au diphthong',
    guide:'Like "ow" in "cow". Two sounds blended. Rare in modern Tamil.',
    words:[
      {t:'ஔவியர்',r:'auviyar',e:'Auviyar (classical poet)'}
    ]
  }
];


var CONSONANTS = [
  {
    t:'க',
    r:'k/g',
    name:'ka',
    guide:'Hard "k" at start, softer "g" between vowels. Very common letter.',
    words:[
      {t:'கை',r:'kai',e:'hand'},
      {t:'கல்',r:'kal',e:'stone'},
      {t:'காட்டு',r:'kāṭṭu',e:'forest'}
    ]
  },
  {
    t:'ங',
    r:'ng',
    name:'nga',
    guide:'Like "ng" in "ring". Only appears after க sounds. Rare at word start.',
    words:[
      {t:'அங்கே',r:'aṅkē',e:'there'},
      {t:'சங்கம்',r:'caṅkam',e:'assembly'}
    ]
  },
  {
    t:'ச',
    r:'ch/s/j',
    name:'ca',
    guide:'Sounds like "ch", "s", or "j" depending on position. Versatile consonant.',
    words:[
      {t:'சாப்பிடு',r:'cāppiḍu',e:'eat'},
      {t:'சூரியன்',r:'cūriyaṉ',e:'sun'},
      {t:'செல்',r:'cel',e:'go'}
    ]
  },
  {
    t:'ஞ',
    r:'ny',
    name:'nya',
    guide:'Like "ny" in Spanish "mañana". Nasal + palatal sound.',
    words:[
      {t:'ஞாயிறு',r:'ñāyiṟu',e:'Sunday/sun'},
      {t:'ஞானம்',r:'ñāṉam',e:'wisdom'}
    ]
  },
  {
    t:'ட',
    r:'ṭ/ḍ',
    name:'ṭa',
    guide:'Retroflex "t" — tongue curls back to touch the roof of the mouth. Hard at start, soft between vowels.',
    words:[
      {t:'டீ',r:'ṭī',e:'tea'},
      {t:'கோடி',r:'kōḍi',e:'crore/flag'}
    ]
  },
  {
    t:'ண',
    r:'ṇ',
    name:'ṇa',
    guide:'Retroflex nasal — tongue curls back. Like "n" but with tongue curled back.',
    words:[
      {t:'வண்ணம்',r:'vaṇṇam',e:'colour'},
      {t:'மண்',r:'maṇ',e:'soil/earth'}
    ]
  },
  {
    t:'த',
    r:'th/dh',
    name:'ta',
    guide:'Dental "t" — tongue touches back of top teeth. Like a soft "th" in "the".',
    words:[
      {t:'தண்ணீர்',r:'taṇṇīr',e:'water'},
      {t:'தாய்',r:'tāy',e:'mother'},
      {t:'தமிழ்',r:'tamiḻ',e:'Tamil'}
    ]
  },
  {
    t:'ந',
    r:'n',
    name:'na',
    guide:'Dental nasal — like "n" but with tongue against the teeth.',
    words:[
      {t:'நான்',r:'nāṉ',e:'I/me'},
      {t:'நாடு',r:'nāḍu',e:'country'},
      {t:'நல்ல',r:'nalla',e:'good'}
    ]
  },
  {
    t: 'ப',
    r: 'p/b',
    name: 'pa',
    guide: 'Hard "p" at start, softer "b" between vowels.',
    words: [
      { t: 'பால்',  r: 'pāl',   e: 'milk'          },
      { t: 'பூ',    r: 'pū',    e: 'flower'        },
      { t: 'படம்',  r: 'paḍam', e: 'picture/film'  }
    ]
  },
  {
    t: 'ம',
    r: 'm',
    name: 'ma',
    guide: 'Exactly like English "m". One of the most common Tamil letters.',
    words: [
      { t: 'மனிதன்', r: 'maṉitaṉ', e: 'human/man' },
      { t: 'மழை',    r: 'maḻai',   e: 'rain'      },
      { t: 'மரம்',   r: 'maram',   e: 'tree'      }
    ]
  },
  {
    t: 'ய',
    r: 'y',
    name: 'ya',
    guide: 'Like English "y" in "yes". Glide consonant.',
    words: [
      { t: 'யார்',  r: 'yār',   e: 'who'      },
      { t: 'யானை', r: 'yāṉai', e: 'elephant'  }
    ]
  },
  {
    t: 'ர',
    r: 'r',
    name: 'ra',
    guide: 'Flap "r" — tongue briefly touches the ridge behind teeth.',
    words: [
      { t: 'ரோடு',   r: 'rōḍu',  e: 'road'  },
      { t: 'ரத்தம்', r: 'rattam', e: 'blood' }
    ]
  },
  {
    t: 'ல',
    r: 'l',
    name: 'la',
    guide: 'Dental "l" — tongue touches back of teeth.',
    words: [
      { t: 'லட்சணம்', r: 'laṭcaṇam', e: 'character' },
      { t: 'லோக்கல்', r: 'lōkkal',   e: 'local'     }
    ]
  },
  {
    t: 'வ',
    r: 'v/w',
    name: 'va',
    guide: 'Like English "v" but softer — sometimes almost like "w".',
    words: [
      { t: 'வீடு',  r: 'vīḍu',  e: 'house'      },
      { t: 'வாழ்க', r: 'vāḻka', e: 'long live!' },
      { t: 'வா',    r: 'vā',    e: 'come'        }
    ]
  },
  {
    t: 'ழ',
    r: 'ḻ',
    name: 'ḻa (unique!)',
    guide: '🌟 UNIQUE TO TAMIL! No equivalent in any other language. Tongue curls far back, then flips forward.',
    words: [
      { t: 'தமிழ்', r: 'tamiḻ', e: 'Tamil (the language)' },
      { t: 'வாழை',  r: 'vāḻai', e: 'banana'               },
      { t: 'மழை',   r: 'maḻai', e: 'rain'                 }
    ]
  },
  {
    t: 'ள',
    r: 'ḷ',
    name: 'ḷa',
    guide: 'Retroflex "l" — tongue curls back. Different from regular ல.',
    words: [
      { t: 'ஆள்',       r: 'āḷ',       e: 'person/man' },
      { t: 'தமிழ்நாடு', r: 'tamiḻnāḍu', e: 'Tamil Nadu' }
    ]
  },
  {
    t: 'ற',
    r: 'ṟ',
    name: 'ṟa',
    guide: 'Trill "r" — a rolled "r" similar to Spanish "rr".',
    words: [
      { t: 'நாற்று', r: 'nāṟṟu', e: 'seedling' }
    ]
  },
  {
    t: 'ன',
    r: 'ṉ',
    name: 'ṉa',
    guide: 'Alveolar nasal — tongue tip touches the ridge.',
    words: [
      { t: 'தன்',  r: 'taṉ',  e: 'self/oneself' },
      { t: 'இன்று', r: 'iṉṟu', e: 'today'        }
    ]
  }
];


var NUMBERS = [
  { t: '௧', r: 'ondru',   name: '1 — one',        guide: 'Pronounced "on-dru".',      words: [{ t: 'ஒன்று',   r: 'ondru',   e: 'one'      }] },
  { t: '௨', r: 'irandu',  name: '2 — two',        guide: 'Pronounced "i-ran-du".',    words: [{ t: 'இரண்டு',  r: 'irandu',  e: 'two'      }] },
  { t: '௩', r: 'moonru',  name: '3 — three',      guide: 'Pronounced "mōon-ru".',     words: [{ t: 'மூன்று',  r: 'mūnru',   e: 'three'    }] },
  { t: '௪', r: 'naangu',  name: '4 — four',       guide: 'Pronounced "nāan-gu".',     words: [{ t: 'நான்கு',  r: 'nāngu',   e: 'four'     }] },
  { t: '௫', r: 'aindu',   name: '5 — five',       guide: 'Pronounced "ain-du".',      words: [{ t: 'ஐந்து',   r: 'aindu',   e: 'five'     }] },
  { t: '௬', r: 'aaru',    name: '6 — six',        guide: 'Pronounced "ā-ru".',        words: [{ t: 'ஆறு',     r: 'āru',     e: 'six'      }] },
  { t: '௭', r: 'ezhu',    name: '7 — seven',      guide: 'Pronounced "ē-zhu".',       words: [{ t: 'ஏழு',     r: 'ēzhu',    e: 'seven'    }] },
  { t: '௮', r: 'ettu',    name: '8 — eight',      guide: 'Pronounced "et-tu".',       words: [{ t: 'எட்டு',   r: 'ettu',    e: 'eight'    }] },
  { t: '௯', r: 'onbadu',  name: '9 — nine',       guide: 'Pronounced "on-ba-du".',    words: [{ t: 'ஒன்பது',  r: 'onbadu',  e: 'nine'     }] },
  { t: '௰', r: 'pattu',   name: '10 — ten',       guide: 'Pronounced "pat-tu".',      words: [{ t: 'பத்து',   r: 'pattu',   e: 'ten'      }] },
  { t: '௱', r: 'nooru',   name: '100 — hundred',  guide: 'Pronounced "nū-ru".',       words: [{ t: 'நூறு',    r: 'nūru',    e: 'hundred'  }] },
  { t: '௲', r: 'aayiram', name: '1000 — thousand', guide: 'Pronounced "ā-yi-ram".',   words: [{ t: 'ஆயிரம்',  r: 'āyiram',  e: 'thousand' }] }
];


var PROPER_COMPOUNDS = [
  { t: 'கா',  r: 'kā',  name: 'ka+ā',  guide: 'க + ா = கா.',        words: [{ t: 'காடு',      r: 'kāḍu',    e: 'forest'          }, { t: 'கால்', r: 'kāl', e: 'leg/foot' }] },
  { t: 'கி',  r: 'ki',  name: 'ka+i',  guide: 'க + ி = கி.',        words: [{ t: 'கிடை',      r: 'kiḍai',   e: 'to get/receive'  }] },
  { t: 'கீ',  r: 'kī',  name: 'ka+ī',  guide: 'க + ீ = கீ.',        words: [{ t: 'கீழ்',      r: 'kīḻ',     e: 'below/down'      }] },
  { t: 'கு',  r: 'ku',  name: 'ka+u',  guide: 'க + ு = கு.',        words: [{ t: 'குழந்தை',   r: 'kuḻandai', e: 'child'           }] },
  { t: 'கூ',  r: 'kū',  name: 'ka+ū',  guide: 'க + ூ = கூ.',        words: [{ t: 'கூட',       r: 'kūḍa',    e: 'together/also'   }] },
  { t: 'கெ',  r: 'ke',  name: 'ka+e',  guide: 'க + ெ = கெ.',        words: [{ t: 'கெட்ட',     r: 'keṭṭa',   e: 'bad/spoiled'     }] },
  { t: 'கே',  r: 'kē',  name: 'ka+ē',  guide: 'க + ே = கே.',        words: [{ t: 'கேள்',      r: 'kēḷ',     e: 'ask/listen'      }] },
  { t: 'கை',  r: 'kai', name: 'ka+ai', guide: 'க + ை = கை.',        words: [{ t: 'கை',        r: 'kai',     e: 'hand'            }] },
  { t: 'கொ',  r: 'ko',  name: 'ka+o',  guide: 'க + ொ = கொ.',        words: [{ t: 'கொடு',      r: 'koḍu',    e: 'give'            }] },
  { t: 'கோ',  r: 'kō',  name: 'ka+ō',  guide: 'க + ோ = கோ.',        words: [{ t: 'கோயில்',    r: 'kōyil',   e: 'temple'          }] },
  { t: 'கௌ',  r: 'kau', name: 'ka+au', guide: 'க + ௌ = கௌ. Rare.',  words: [] },
  { t: 'சா',  r: 'cā',  name: 'ca+ā',  guide: 'ச + ா = சா.',        words: [{ t: 'சாப்பாடு',  r: 'cāppāḍu', e: 'food/meal'       }] },
  { t: 'சி',  r: 'ci',  name: 'ca+i',  guide: 'ச + ி = சி.',        words: [] },
  { t: 'சீ',  r: 'cī',  name: 'ca+ī',  guide: 'ச + ீ = சீ.',        words: [] },
  { t: 'சு',  r: 'cu',  name: 'ca+u',  guide: 'ச + ு = சு.',        words: [] },
  { t: 'நா',  r: 'nā',  name: 'na+ā',  guide: 'ந + ா = நா.',        words: [{ t: 'நாடு',      r: 'nāḍu',    e: 'country'         }] },
  { t: 'நி',  r: 'ni',  name: 'na+i',  guide: 'ந + ி = நி.',        words: [] },
  { t: 'தா',  r: 'tā',  name: 'ta+ā',  guide: 'த + ா = தா.',        words: [{ t: 'தாய்',      r: 'tāy',     e: 'mother'          }] },
  { t: 'வா',  r: 'vā',  name: 'va+ā',  guide: 'வ + ா = வா.',        words: [{ t: 'வாழை',      r: 'vāḻai',   e: 'banana'          }] },
  { t: 'மா',  r: 'mā',  name: 'ma+ā',  guide: 'ம + ா = மா.',        words: [{ t: 'மாம்பழம்',  r: 'māmpaḻam', e: 'mango'          }] },
  { t: 'பா',  r: 'pā',  name: 'pa+ā',  guide: 'ப + ா = பா.',        words: [{ t: 'பால்',      r: 'pāl',     e: 'milk'            }] }
];
var currentLetterTab = 'vowels';

function showLetterTab(tab, btn) {
  currentLetterTab = tab;
  document.querySelectorAll('#section-alphabet .tab-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
  renderLetters();
}

function renderLetters() {
  var grid = document.getElementById('letter-grid');
  var data = currentLetterTab === 'vowels'     ? VOWELS
           : currentLetterTab === 'consonants' ? CONSONANTS
           : currentLetterTab === 'numbers'    ? NUMBERS
           : PROPER_COMPOUNDS;
  window._letterData = data;
  grid.innerHTML = data.map(function(l, i) {
    var learned = learnedLetters.indexOf(l.t) >= 0;
    return '<div class="letter-card' + (learned ? ' learned' : '') + '" onclick="openModal(' + i + ')">'
      + '<button class="speak-btn" onclick="event.stopPropagation();speakTamil(\'' + l.t + '\',this)">' + speakerSVG() + '</button>'
      + '<span class="letter-tamil">' + l.t + '</span>'
      + '<div class="letter-roman">' + l.r + '</div>'
      + '<div class="letter-name">' + l.name + '</div>'
      + '</div>';
  }).join('');
}


function openModal(i) {
  var l = window._letterData[i];
  currentLetter = l;
  document.getElementById('modal-tamil').textContent = l.t;
  document.getElementById('modal-type').textContent = l.name;
  document.getElementById('modal-guide').textContent = l.guide;
  var ws = l.words || [];
  document.getElementById('modal-words-section').style.display = ws.length ? 'block' : 'none';
  document.getElementById('modal-words').innerHTML = ws.map(function(w) {
    var safe = w.t.replace(/'/g, "\\'");
    return '<div class="word-ex">'
      + '<span class="word-ex-tamil">' + w.t + '</span>'
      + '<button class="speak-btn" onclick="speakTamil(\'' + safe + '\',this)" style="position:static;flex-shrink:0;margin:0 8px;">' + speakerSVG() + '</button>'
      + '<div class="word-ex-right">'
      + '<div class="word-ex-roman">' + w.r + '</div>'
      + '<div class="word-ex-en">' + w.e + '</div>'
      + '</div></div>';
  }).join('');
  var learned = learnedLetters.indexOf(l.t) >= 0;
  document.getElementById('mark-btn').textContent = learned ? '✓ Learned — tap to undo' : 'Mark as learned';
  document.getElementById('mark-btn').style.background = learned ? 'var(--green)' : '';
  document.getElementById('mark-btn').style.color = learned ? '#000' : '';
  document.getElementById('modal-roman').innerHTML = l.r
    + '<button class="speak-btn" onclick="speakTamil(\'' + l.t + '\',this)" style="vertical-align:middle">'
    + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10v4h3l4 3V7l-4 3H5z"/></svg>'
    + '</button>';
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

function markLearned() {
  if (!currentLetter) return;
  var idx = learnedLetters.indexOf(currentLetter.t);
  if (idx < 0) {
    learnedLetters.push(currentLetter.t);
    localStorage.setItem('tamil_learned', JSON.stringify(learnedLetters));
    if (typeof triggerSaveNudge === 'function') triggerSaveNudge('learned');
    if (typeof saveCloudProgress === 'function') saveCloudProgress();
    addXP(5);
    document.getElementById('mark-btn').textContent = '✓ Learned — tap to undo';
    document.getElementById('mark-btn').style.background = 'var(--green)';
    document.getElementById('mark-btn').style.color = '#000';
  } else {
    learnedLetters.splice(idx, 1);
    localStorage.setItem('tamil_learned', JSON.stringify(learnedLetters));
    document.getElementById('mark-btn').textContent = 'Mark as learned';
    document.getElementById('mark-btn').style.background = '';
    document.getElementById('mark-btn').style.color = '';
    XP = Math.max(0, XP - 5);
    saveXP();
  }
  renderLetters();
  updateProgress();
}

function updateProgress() {
  var total = VOWELS.length + CONSONANTS.length;
  var pct = Math.round((learnedLetters.length / total) * 100);
  document.getElementById('pb-alpha').style.width = pct + '%';
}
updateProgress();

var VOCAB = [
  // Family
  { t: 'அம்மா',       r: 'ammā',          e: 'mother',         cat: 'Family'     },
  { t: 'அப்பா',       r: 'appā',          e: 'father',         cat: 'Family'     },
  { t: 'அண்ணன்',      r: 'aṇṇaṉ',        e: 'older brother',  cat: 'Family'     },
  { t: 'அக்கா',       r: 'akkā',          e: 'older sister',   cat: 'Family'     },
  { t: 'தம்பி',       r: 'tampi',         e: 'younger brother', cat: 'Family'    },
  { t: 'தங்கை',       r: 'taṅkai',        e: 'younger sister', cat: 'Family'     },
  { t: 'தாத்தா',      r: 'tāttā',         e: 'grandfather',    cat: 'Family'     },
  { t: 'பாட்டி',      r: 'pāṭṭi',         e: 'grandmother',    cat: 'Family'     },
  { t: 'குழந்தை',     r: 'kuḻandai',      e: 'child',          cat: 'Family'     },
  { t: 'கணவன்',       r: 'kaṇavaṉ',       e: 'husband',        cat: 'Family'     },
  { t: 'மனைவி',       r: 'maṉaivi',       e: 'wife',           cat: 'Family'     },
  // Food
  { t: 'உணவு',        r: 'uṇavu',         e: 'food',           cat: 'Food'       },
  { t: 'தண்ணீர்',     r: 'taṇṇīr',        e: 'water',          cat: 'Food'       },
  { t: 'சாப்பாடு',    r: 'cāppāḍu',       e: 'meal/rice dish', cat: 'Food'       },
  { t: 'பால்',        r: 'pāl',           e: 'milk',           cat: 'Food'       },
  { t: 'காய்கறி',     r: 'kāykaṟi',       e: 'vegetables',     cat: 'Food'       },
  { t: 'பழம்',        r: 'paḻam',         e: 'fruit',          cat: 'Food'       },
  { t: 'மாம்பழம்',    r: 'māmpaḻam',      e: 'mango',          cat: 'Food'       },
  { t: 'வாழைப்பழம்',  r: 'vāḻaippaḻam',  e: 'banana',         cat: 'Food'       },
  { t: 'தோசை',        r: 'tōcai',         e: 'dosa',           cat: 'Food'       },
  { t: 'இட்லி',       r: 'iṭli',          e: 'idli',           cat: 'Food'       },
  { t: 'சாம்பார்',    r: 'cāmpār',        e: 'sambar',         cat: 'Food'       },
  // Places
  { t: 'கடை',         r: 'kaḍai',         e: 'shop/store',     cat: 'Places'     },
  { t: 'வீடு',        r: 'vīḍu',          e: 'house',          cat: 'Places'     },
  { t: 'பள்ளி',       r: 'paḷḷi',         e: 'school',         cat: 'Places'     },
  { t: 'மருத்துவமனை', r: 'maruttuvamanai', e: 'hospital',      cat: 'Places'     },
  { t: 'கோயில்',      r: 'kōyil',         e: 'temple',         cat: 'Places'     },
  { t: 'நகரம்',       r: 'nakaram',       e: 'city',           cat: 'Places'     },
  { t: 'கடற்கரை',     r: 'kaḍaṟkarai',    e: 'beach',          cat: 'Places'     },
  { t: 'சாலை',        r: 'cālai',         e: 'road',           cat: 'Places'     },
  // Colours
  { t: 'சிவப்பு',     r: 'civappu',       e: 'red',            cat: 'Colours'    },
  { t: 'நீலம்',       r: 'nīlam',         e: 'blue',           cat: 'Colours'    },
  { t: 'பச்சை',       r: 'paccai',        e: 'green',          cat: 'Colours'    },
  { t: 'மஞ்சள்',      r: 'mañcaḷ',        e: 'yellow',         cat: 'Colours'    },
  { t: 'கறுப்பு',     r: 'kaṟuppu',       e: 'black',          cat: 'Colours'    },
  { t: 'வெள்ளை',      r: 'veḷḷai',        e: 'white',          cat: 'Colours'    },
  { t: 'ஆரஞ்சு',      r: 'ārancu',        e: 'orange',         cat: 'Colours'    },
  // Numbers
  { t: 'ஒன்று',       r: 'oṉṟu',         e: 'one',            cat: 'Numbers'    },
  { t: 'இரண்டு',      r: 'iraṇḍu',        e: 'two',            cat: 'Numbers'    },
  { t: 'மூன்று',      r: 'mūṉṟu',        e: 'three',          cat: 'Numbers'    },
  { t: 'நான்கு',      r: 'nāṉku',        e: 'four',           cat: 'Numbers'    },
  { t: 'ஐந்து',       r: 'aintu',         e: 'five',           cat: 'Numbers'    },
  { t: 'ஆறு',         r: 'āṟu',           e: 'six',            cat: 'Numbers'    },
  { t: 'ஏழு',         r: 'ēḻu',           e: 'seven',          cat: 'Numbers'    },
  { t: 'எட்டு',       r: 'eṭṭu',          e: 'eight',          cat: 'Numbers'    },
  { t: 'ஒன்பது',      r: 'oṉpatu',        e: 'nine',           cat: 'Numbers'    },
  { t: 'பத்து',       r: 'pattu',         e: 'ten',            cat: 'Numbers'    },
  // Pronouns
  { t: 'நான்',        r: 'nāṉ',           e: 'I',              cat: 'Pronouns'   },
  { t: 'நீ',          r: 'nī',            e: 'you (informal)', cat: 'Pronouns'   },
  { t: 'நீங்கள்',     r: 'nīṅkaḷ',        e: 'you (formal)',   cat: 'Pronouns'   },
  { t: 'அவன்',        r: 'avaṉ',          e: 'he (informal)',  cat: 'Pronouns'   },
  { t: 'அவள்',        r: 'avaḷ',          e: 'she (informal)', cat: 'Pronouns'   },
  { t: 'அவர்',        r: 'avar',          e: 'he/she (formal)', cat: 'Pronouns'  },
  { t: 'அது',         r: 'atu',           e: 'it/that',        cat: 'Pronouns'   },
  { t: 'நாம்',        r: 'nām',           e: 'we (inclusive)', cat: 'Pronouns'   },
  { t: 'அவர்கள்',     r: 'avarkaḷ',       e: 'they (formal)',  cat: 'Pronouns'   },
  // Verbs
  { t: 'செல்',        r: 'cel',           e: 'to go',          cat: 'Verbs'      },
  { t: 'வா',          r: 'vā',            e: 'to come',        cat: 'Verbs'      },
  { t: 'சாப்பிடு',    r: 'cāppiḍu',       e: 'to eat',         cat: 'Verbs'      },
  { t: 'குடி',        r: 'kuḍi',          e: 'to drink',       cat: 'Verbs'      },
  { t: 'படி',         r: 'paḍi',          e: 'to study/read',  cat: 'Verbs'      },
  { t: 'பேசு',        r: 'pēcu',          e: 'to speak',       cat: 'Verbs'      },
  { t: 'கேள்',        r: 'kēḷ',           e: 'to ask/hear',    cat: 'Verbs'      },
  { t: 'பார்',        r: 'pār',           e: 'to see/look',    cat: 'Verbs'      },
  { t: 'தா',          r: 'tā',            e: 'to give',        cat: 'Verbs'      },
  { t: 'வாங்கு',      r: 'vāṅku',         e: 'to buy/take',    cat: 'Verbs'      },
  // Adjectives
  { t: 'நல்ல',        r: 'nalla',         e: 'good',           cat: 'Adjectives' },
  { t: 'கெட்ட',       r: 'keṭṭa',         e: 'bad',            cat: 'Adjectives' },
  { t: 'பெரிய',       r: 'periya',        e: 'big',            cat: 'Adjectives' },
  { t: 'சின்ன',       r: 'ciṉṉa',        e: 'small',          cat: 'Adjectives' },
  { t: 'புது',        r: 'putu',          e: 'new',            cat: 'Adjectives' },
  { t: 'பழைய',        r: 'paḻaiya',       e: 'old',            cat: 'Adjectives' },
  { t: 'அழகான',       r: 'aḻakāṉa',      e: 'beautiful',      cat: 'Adjectives' },
  { t: 'வலிமையான',    r: 'valimaiān',     e: 'strong',         cat: 'Adjectives' },
  // Time
  { t: 'இப்போது',     r: 'ippōtu',        e: 'now',            cat: 'Time'       },
  { t: 'நாளை',        r: 'nāḷai',         e: 'tomorrow',       cat: 'Time'       },
  { t: 'நேற்று',      r: 'nēṟṟu',        e: 'yesterday',      cat: 'Time'       },
  { t: 'இன்று',       r: 'iṉṟu',          e: 'today',          cat: 'Time'       },
  { t: 'காலை',        r: 'kālai',         e: 'morning',        cat: 'Time'       },
  { t: 'மாலை',        r: 'mālai',         e: 'evening',        cat: 'Time'       },
  { t: 'இரவு',        r: 'iravu',         e: 'night',          cat: 'Time'       },
  { t: 'வாரம்',       r: 'vāram',         e: 'week',           cat: 'Time'       },
  { t: 'மாதம்',       r: 'mātam',         e: 'month',          cat: 'Time'       },
  { t: 'வருடம்',      r: 'varuḍam',       e: 'year',           cat: 'Time'       }
];
var vocabCat = 'All';

function renderVocab(){var cats=['All'].concat([...new Set(VOCAB.map(function(v){return v.cat}))]);document.getElementById('vocab-cats').innerHTML=cats.map(function(c){return '<button class="tab-btn'+(c===vocabCat?' active':'')+'" onclick="setVocabCat(\''+c+'\')">'+(c==='All'?'All':c)+'</button>';}).join('');var data=vocabCat==='All'?VOCAB:VOCAB.filter(function(v){return v.cat===vocabCat});document.getElementById('vocab-grid').innerHTML=data.map(function(v){var tSafe=v.t.replace(/'/g,"\\'");return '<div class="vocab-card" onclick="flipCard(this)">'+'<div class="vocab-front">'+'<div class="vocab-cat">'+v.cat+'</div>'+'<div class="vocab-tamil">'+v.t+'</div>'+'<button class="speak-btn" onclick="event.stopPropagation();speakTamil(\''+tSafe+'\',this)">'+speakerSVG()+'</button>'+'<div class="letter-roman" style="font-size:0.8rem;color:var(--text3)">'+v.r+'</div>'+'</div>'+'<div class="vocab-back"><div class="vocab-english">'+v.e+'</div><div class="vocab-roman-back">'+v.r+'</div></div>'+'</div>';}).join('');}
function setVocabCat(c){vocabCat=c;renderVocab();}
function flipCard(el){if(el.classList.contains('flipped')){el.classList.remove('flipped');}else{el.classList.add('flipped');addXP(1);}}
renderVocab();autoResizeTamilText();
var PHRASES=[{t:'வணக்கம்',r:'Vaṇakkam',e:'Hello / Greetings',ctx:'The universal Tamil greeting. Used any time of day.',cat:'Greetings'},{t:'நலமா?',r:'Nalamā?',e:'Are you well?',ctx:'Informal way to ask "how are you?"',cat:'Greetings'},{t:'நலம்',r:'Nalam',e:'I am well / Fine',ctx:'Reply to நலமா',cat:'Greetings'},{t:'என் பெயர் ...',r:'En peyar ...',e:'My name is ...',ctx:'Fill in your name after "peyar"',cat:'Greetings'},{t:'உங்கள் பெயர் என்ன?',r:'Uṅkaḷ peyar eṉṉa?',e:'What is your name? (formal)',ctx:'Polite form — use with elders/strangers',cat:'Greetings'},{t:'நன்றி',r:'Naṉṟi',e:'Thank you',ctx:'Essential phrase.',cat:'Greetings'},{t:'மன்னிக்கவும்',r:'Maṉṉikkavum',e:'Excuse me / Sorry',ctx:'Use to apologise or get attention',cat:'Greetings'},{t:'சரி',r:'Cari',e:'OK / Alright',ctx:'Very common filler.',cat:'Greetings'},{t:'போகிறேன்',r:'Pōkiṟēṉ',e:'I am going / Goodbye',ctx:'Casual goodbye.',cat:'Greetings'},{t:'எவ்வளவு?',r:'Evvaḷavu?',e:'How much?',ctx:'First thing you need in any shop!',cat:'Shopping'},{t:'விலை என்ன?',r:'Vilai eṉṉa?',e:'What is the price?',ctx:'More formal way to ask the price',cat:'Shopping'},{t:'கொஞ்சம் கம்மி பண்ணுங்க',r:'Koñcam kammi paṇṇuṅka',e:'Please reduce a little',ctx:'For bargaining at markets',cat:'Shopping'},{t:'வேண்டும்',r:'Vēṇḍum',e:'I want / I need',ctx:'Attach to a noun',cat:'Shopping'},{t:'வேண்டாம்',r:'Vēṇḍām',e:"I don't want / No thanks",ctx:'Polite way to decline',cat:'Shopping'},{t:'எங்கே?',r:'Eṅkē?',e:'Where?',ctx:'Basic question word for directions',cat:'Travel'},{t:'எப்படி போவது?',r:'Eppaḍi pōvatu?',e:'How do I get there?',ctx:'Ask for directions anywhere',cat:'Travel'},{t:'நேரடியாக போ',r:'Nēraḍiyāka pō',e:'Go straight ahead',ctx:'Direction instruction',cat:'Travel'},{t:'வலது பக்கம்',r:'Valatu pakkam',e:'Right side / To the right',ctx:'Directions',cat:'Travel'},{t:'இடது பக்கம்',r:'Iḍatu pakkam',e:'Left side / To the left',ctx:'Directions',cat:'Travel'},{t:'பஸ் நிறுத்தம் எங்கே?',r:'Bas niṟuttam eṅkē?',e:'Where is the bus stop?',ctx:'Essential for getting around',cat:'Travel'},{t:'டிக்கெட் வேண்டும்',r:'Ṭikkeṭ vēṇḍum',e:'I need a ticket',ctx:'At bus/train stations',cat:'Travel'},{t:'நான் தமிழ் கற்றுக்கொள்கிறேன்',r:'Nāṉ tamiḻ kaṟṟukkoḷkiṟēṉ',e:'I am learning Tamil',ctx:'A great phrase to impress locals!',cat:'Learning'},{t:'மீண்டும் சொல்லுங்கள்',r:'Mīṇḍum colluṅkaḷ',e:'Please say it again',ctx:"When you didn't understand",cat:'Learning'},{t:'தமிழில் எப்படி சொல்வது?',r:'Tamiḻil eppaḍi colvatu?',e:'How do you say it in Tamil?',ctx:'Ask a local for the Tamil word',cat:'Learning'},{t:'புரியவில்லை',r:'Puriyavillai',e:"I don't understand",ctx:"Essential — don't be shy!",cat:'Learning'},{t:'மெதுவாக பேசுங்கள்',r:'Metuvāka pēcuṅkaḷ',e:'Please speak slowly',ctx:'Ask someone to slow down',cat:'Learning'},{t:'டாக்டர் தேவை',r:'Ṭākṭar tēvai',e:'I need a doctor',ctx:'Medical emergency phrase',cat:'Emergency'},{t:'உதவி செய்யுங்கள்',r:'Utavi ceyyuṅkaḷ',e:'Please help me',ctx:'Calling for help',cat:'Emergency'},{t:'போலீஸ் அழையுங்கள்',r:'Pōlīs aḻaiyuṅkaḷ',e:'Call the police',ctx:'Emergency situation',cat:'Emergency'}];
var phraseCat='Greetings';var _phraseData=[];
function renderPhrases(){var cats=[...new Set(PHRASES.map(function(p){return p.cat}))];document.getElementById('phrase-cats').innerHTML=cats.map(function(c){return '<button class="tab-btn'+(c===phraseCat?' active':'')+'" onclick="setPhraseCat(\''+c+'\')">'+(c)+'</button>';}).join('');_phraseData=PHRASES.filter(function(p){return p.cat===phraseCat});document.getElementById('phrase-list').innerHTML=_phraseData.map(function(p){return '<div class="phrase-card" style="position:relative;">'+'<div class="phrase-cat-label">'+p.cat+'</div>'+'<div class="phrase-tamil">'+p.t+'</div>'+'<button class="speak-btn" onclick="event.stopPropagation();speakTamil(\''+p.t.replace(/'/g,"\\'")+'\',this)">'+speakerSVG()+'</button>'+'<div class="phrase-roman">'+p.r+'</div>'+'<div class="phrase-english">'+p.e+'</div>'+'<div class="phrase-context">'+p.ctx+'</div>'+'</div>';}).join('');}
function setPhraseCat(c){phraseCat=c;renderPhrases();}
renderPhrases();
var GRAMMAR_DATA=[{section:'Word Order',rules:[{title:'Subject-Object-Verb (SOV)',body:'Tamil follows SOV order — the verb always comes last.',examples:[{t:'நான் தண்ணீர் குடிக்கிறேன்',r:'Nāṉ taṇṇīr kuḍikkiṟēṉ',e:'I water drink → I drink water'}]},{title:'Modifiers come before nouns',body:'Adjectives always appear before the noun they modify.',examples:[{t:'நல்ல உணவு',r:'Nalla uṇavu',e:'good food'}]}]},{section:'Nouns & Cases',rules:[{title:'No articles (a/an/the)',body:'Tamil has no articles. Context determines definiteness.',examples:[{t:'வீடு நல்லது',r:'Vīḍu nallatu',e:'The/a house is good'}]},{title:'Case suffixes (வேற்றுமை)',body:'Tamil adds suffixes to nouns to show grammatical role.',examples:[{t:'வீட்டில்',r:'vīṭṭil',e:'"in the house"'},{t:'வீட்டிற்கு',r:'vīṭṭiṟku',e:'"to the house"'}]},{title:'Nominative (subject)',body:'The base form of the noun is used as subject.',examples:[{t:'அவர் வருகிறார்',r:'Avar varukiṟār',e:'He/she is coming'}]},{title:'Accusative (direct object)',body:'Add -ஐ (-ai) to mark the direct object.',examples:[{t:'நான் பழத்தை சாப்பிட்டேன்',r:'Nāṉ paḻattai cāppiṭṭēṉ',e:'I ate the fruit'}]}]},{section:'Verbs',rules:[{title:'Verbs conjugate for tense AND person',body:'Tamil verbs change form based on tense and subject.',examples:[{t:'சாப்பிடுகிறேன்',r:'cāppikuṟēṉ',e:'I eat (present)'},{t:'சாப்பிட்டேன்',r:'cāppiṭṭēṉ',e:'I ate (past)'},{t:'சாப்பிடுவேன்',r:'cāppiḍuvēṉ',e:'I will eat (future)'}]},{title:'Present tense: add கிற + person suffix',body:'Present tense is formed by adding கிற to the verb stem.',examples:[{t:'வருகிறேன்',r:'varukiṟēṉ',e:'I am coming'},{t:'வருகிறார்',r:'varukiṟār',e:'He/She is coming (formal)'}]},{title:'Past tense',body:'Past tense uses a modified stem, then personal suffix.',examples:[{t:'போனேன்',r:'pōṉēṉ',e:'I went'},{t:'வந்தேன்',r:'vanttēṉ',e:'I came'}]},{title:'Future tense: add வ + personal suffix',body:'Future tense adds வ (va) after the verb stem.',examples:[{t:'வருவேன்',r:'varuvēṉ',e:'I will come'}]}]},{section:'Pronouns',rules:[{title:'Formal vs informal distinction',body:'Always use formal (நீங்கள், அவர்) with elders/strangers.',examples:[{t:'நீ — நீங்கள்',r:'nī — nīṅkaḷ',e:'you (informal) — you (formal)'}]},{title:'Inclusive vs exclusive "we"',body:'நாம் includes the listener; நாங்கள் excludes them.',examples:[{t:'நாம் போவோம்',r:'Nām pōvōm',e:"Let's go (inclusive)"},{t:'நாங்கள் போனோம்',r:'Nāṅkaḷ pōṉōm',e:'We went (exclusive)'}]}]},{section:'Postpositions',rules:[{title:'Postpositions, not prepositions',body:'Tamil uses postpositions — they come AFTER the noun.',examples:[{t:'மரத்தின் மேல்',r:'marattil mēl',e:'on the tree'},{t:'கடையில் இருந்து',r:'kaḍaiyil iruntu',e:'from the shop'}]}]},{section:'Negation',rules:[{title:'Negative verb forms',body:'Tamil uses special negative verb forms rather than a "not" word.',examples:[{t:'வரவில்லை',r:'varavillai',e:'did not come'},{t:'போகமாட்டேன்',r:'pōkamāṭṭēṉ',e:'I will not go'}]}]}];
function renderGrammar(){document.getElementById('grammar-content').innerHTML=GRAMMAR_DATA.map(function(sec){return '<div class="grammar-section"><h3>'+sec.section+'</h3>'+sec.rules.map(function(r){return '<div class="grammar-rule"><h4>'+r.title+'</h4><p>'+r.body+'</p>'+r.examples.map(function(ex){return '<div class="grammar-example"><div class="grammar-ex-tamil">'+ex.t+'</div><div class="grammar-ex-roman">'+ex.r+'</div><div class="grammar-ex-en">'+ex.e+'</div></div>';}).join('')+'</div>';}).join('')+'</div>';}).join('');}
renderGrammar();
var quizState={questions:[],current:0,score:0,answered:false,type:''};
function buildLetterIdQuestions(){var qs=[];var pool=VOWELS.concat(CONSONANTS);var shuffled=pool.sort(function(){return Math.random()-0.5}).slice(0,10);shuffled.forEach(function(l){var wrongs=pool.filter(function(x){return x.t!==l.t}).sort(function(){return Math.random()-0.5}).slice(0,3);var opts=[l.r].concat(wrongs.map(function(w){return w.r})).sort(function(){return Math.random()-0.5});qs.push({type:'mcq',prompt:'What sound does this letter make?',big:l.t,answer:l.r,options:opts,isHintAnswer:true});});return qs;}
function buildWordMatchQuestions(){var pool=VOCAB.sort(function(){return Math.random()-0.5}).slice(0,10);return pool.map(function(v){var wrongs=VOCAB.filter(function(x){return x.t!==v.t}).sort(function(){return Math.random()-0.5}).slice(0,3);var opts=[v.e].concat(wrongs.map(function(w){return w.e})).sort(function(){return Math.random()-0.5});return{type:'mcq',prompt:'What does this Tamil word mean?',big:v.t,hint:v.r,answer:v.e,options:opts};});}
function buildPhraseFillQuestions(){var pool=PHRASES.sort(function(){return Math.random()-0.5}).slice(0,8);return pool.map(function(p){var wrongs=PHRASES.filter(function(x){return x.t!==p.t}).sort(function(){return Math.random()-0.5}).slice(0,3);var opts=[p.e].concat(wrongs.map(function(w){return w.e})).sort(function(){return Math.random()-0.5});return{type:'mcq',prompt:'What does this phrase mean?',big:p.t,hint:p.r,answer:p.e,options:opts};});}
function buildMixedQuestions(){return buildLetterIdQuestions().slice(0,4).concat(buildWordMatchQuestions().slice(0,4)).concat(buildPhraseFillQuestions().slice(0,4)).sort(function(){return Math.random()-0.5});}
function startQuiz(type){var qs=type==='letter-id'?buildLetterIdQuestions():type==='word-match'?buildWordMatchQuestions():type==='phrase-fill'?buildPhraseFillQuestions():buildMixedQuestions();quizState={questions:qs,current:0,score:0,answered:false,type:type};document.getElementById('quiz-start').style.display='none';document.getElementById('quiz-main').style.display='block';renderQuizQ();}
function renderQuizQ(){var s=quizState;if(s.current>=s.questions.length){renderQuizScore();return;}var q=s.questions[s.current];var dots=s.questions.map(function(_,i){return '<div class="quiz-prog-dot'+(i<s.current?' done':i===s.current?' current':'')+'"></div>';}).join('');var html='<button class="quiz-back-btn" onclick="confirmQuitQuiz()">← Back</button>'+'<div class="quiz-progress">'+dots+'</div>'+'<div class="quiz-q">'+q.prompt+'</div>'+'<div class="quiz-big-tamil">'+q.big+'</div>'
+(localStorage.getItem('tamil_quiz_hints')!=='false' && q.hint && !q.isHintAnswer
  ? '<div class="quiz-hint">'+q.hint+'</div>'
  : '')
  +'<div class="quiz-options">'+q.options.map(function(o){return '<button class="quiz-opt" onclick="answerQuiz(this,\''+o.replace(/'/g,"\\'")+'\')">'+(o)+'</button>';}).join('')+'</div>'+'<div id="quiz-feedback" style="display:none"></div>';document.getElementById('quiz-main').innerHTML=html;s.answered=false;}
function answerQuiz(btn,chosen){var s=quizState;if(s.answered)return;s.answered=true;var q=s.questions[s.current];var correct=chosen===q.answer;document.querySelectorAll('.quiz-opt').forEach(function(b){b.disabled=true;});btn.classList.add(correct?'correct':'wrong');if(!correct){document.querySelectorAll('.quiz-opt').forEach(function(b){if(b.textContent===q.answer)b.classList.add('reveal');});}if(correct){s.score++;addXP(10);}var fb=document.getElementById('quiz-feedback');fb.style.display='block';fb.className='quiz-feedback '+(correct?'correct':'wrong');var speakBtn='';if(q.big){var safe=q.big.replace(/'/g,"\\'");speakBtn='<button class="speak-btn" style="position:static;margin-top:10px;" onclick="speakTamil(\''+safe+'\',this)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10v4h3l4 3V7l-4 3H5z"/><path d="M14 9a3 3 0 0 1 0 6"/><path d="M17 7a6 6 0 0 1 0 10"/></svg></button>';}fb.innerHTML=(correct?'Correct! Well done.':'Not quite — the answer is: '+q.answer)+'<br><br>'+'Tamil: '+(q.big||'')+speakBtn;var nextBtn=document.createElement('button');nextBtn.className='quiz-btn';nextBtn.style.marginTop='0.5rem';nextBtn.textContent=s.current<s.questions.length-1?'Next question':'See results';nextBtn.onclick=function(){s.current++;renderQuizQ();};document.getElementById('quiz-main').appendChild(nextBtn);}
function renderQuizScore(){var s=quizState;var pct=Math.round((s.score/s.questions.length)*100);if(typeof saveQuizBest==='function') saveQuizBest(s.type, pct);var msg=pct>=80?'Excellent work!':pct>=50?'Good effort — keep practising!':'Keep going — you\'ll get there!';document.getElementById('quiz-main').innerHTML='<div class="quiz-score"><div class="score-circle">'+pct+'%</div><h2>'+msg+'</h2><p>You got '+s.score+' out of '+s.questions.length+' correct.</p><div style="display:flex;gap:0.75rem;justify-content:center"><button class="quiz-btn" onclick="startQuiz(\''+s.type+'\')">Try again</button><button class="quiz-btn secondary" onclick="document.getElementById(\'quiz-start\').style.display=\'block\';document.getElementById(\'quiz-main\').style.display=\'none\'">Choose quiz type</button></div></div>';}

function confirmQuitQuiz(){
  var overlay = document.createElement('div');
  overlay.id = 'quit-quiz-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:1rem';
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:2rem;max-width:360px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.5)">
      <h3 style="font-family:'DM Sans',sans-serif;font-size:1.05rem;font-weight:600;color:var(--text);margin-bottom:0.5rem">Leave this quiz?</h3>
      <p style="font-size:0.85rem;color:var(--text2);margin-bottom:1.5rem">Your progress will be lost and you'll return to the quiz menu.</p>
      <div style="display:flex;gap:0.75rem;justify-content:flex-end">
        <button onclick="document.getElementById('quit-quiz-overlay').remove()"
          style="background:var(--surface2);border:1px solid var(--border2);border-radius:10px;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:0.9rem;padding:0.6rem 1.2rem;cursor:pointer">
          Cancel
        </button>
        <button onclick="document.getElementById('quit-quiz-overlay').remove();quitQuiz()"
          style="background:var(--red-bg);border:1px solid var(--red);border-radius:10px;color:var(--red);font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:500;padding:0.6rem 1.2rem;cursor:pointer">
          Leave quiz
        </button>
      </div>
    </div>
  `;
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}
function quitQuiz(){
  quizState={questions:[],current:0,score:0,answered:false,type:''};
  document.getElementById('quiz-start').style.display='block';
  document.getElementById('quiz-main').style.display='none';
}

/* =====================================================
   AI TUTOR
   ===================================================== */
var chatHistory=[];
var chatAttachments=[];

(function buildAttachMenu(){
  var menu=document.getElementById('attach-menu');
  var fileIcon = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.48"/>
</svg>
`;

  var btn=document.createElement('button');
  btn.className='attach-menu-item';btn.setAttribute('role','menuitem');
  btn.innerHTML=fileIcon+' Upload files or photos';
  btn.onclick=function(){pickFile('image/*,application/pdf,.pdf','any');};
  menu.appendChild(btn);
})();

/* pickFile: 'img' = image-only input, 'cam' = camera, 'any' = broad file input */
function pickFile(accept,mode){
  const input =
    mode==='cam' ? document.getElementById('chat-camera-input') :
    mode==='any' ? document.getElementById('chat-any-input') :
                   document.getElementById('chat-file-input');

  input.accept = accept;
  input.value = null;

  input.click(); // trigger FIRST
  setTimeout(closeAttachMenu, 100); // close AFTER
}

function compressImage(file,callback){
  var MAX_PX=1600,QUALITY=0.82;
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var w=img.width,h=img.height;
      if(w>MAX_PX||h>MAX_PX){if(w>=h){h=Math.round(h*(MAX_PX/w));w=MAX_PX;}else{w=Math.round(w*(MAX_PX/h));h=MAX_PX;}}
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      var dataUrl=canvas.toDataURL('image/jpeg',QUALITY);var base64=dataUrl.split(',')[1];
      if(base64.length*0.75>4.5*1024*1024){dataUrl=canvas.toDataURL('image/jpeg',0.6);base64=dataUrl.split(',')[1];}
      callback(base64,'image/jpeg',dataUrl);
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleChatAttachment(input){
  var files = Array.from(input.files || []);
  if(!files.length) return;
  input.value = '';

  files.forEach(function(file, index){

    // IMAGE
    if(file.type.startsWith('image/')){
      compressImage(file,function(base64,mediaType,previewUrl){
        chatAttachments.push({
          type:'image',
          base64:base64,
          mediaType:mediaType,
          name:file.name,
          previewUrl:previewUrl
        });
        if(index === files.length - 1){
         renderAttachmentPreviews();
}
      });

    // PDF
    } else if(file.type === 'application/pdf'){
      const reader = new FileReader();

      reader.onload = function(e){
        const base64 = e.target.result.split(',')[1];

        chatAttachments.push({
          type:'document',
          base64:base64,
          mediaType:'application/pdf',
          name:file.name,
          previewUrl:null
        });

        renderAttachmentPreviews();
      };

      reader.readAsDataURL(file);

    } else {
      appendChat('ai','⚠️ Only images or PDF files are supported.');
    }

  });
}

function handleChatPaste(e){
  var items=e.clipboardData&&e.clipboardData.items;if(!items)return;
  for(var i=0;i<items.length;i++){if(items[i].type.indexOf('image')>=0){e.preventDefault();var file=items[i].getAsFile();if(file)handleChatAttachment({files:[file],value:''});return;}}
}

function renderAttachmentPreviews(){
  var preview=document.getElementById('chat-attachment-preview');

  if(!chatAttachments.length){
    preview.classList.remove('has-items');
    preview.innerHTML='';
    return;
  }

  preview.classList.add('has-items');

  const MAX_VISIBLE = 3; // adjust if you want
  const visible = chatAttachments.slice(0, MAX_VISIBLE);
  const remaining = chatAttachments.length - MAX_VISIBLE;

  const pdfIcon = `
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/>
    <path d="M14 2v5h5"/>
    <path d="M9 15h6"/>
    <path d="M9 11h6"/>
  </svg>
  `;

  preview.innerHTML = visible.map(function(a,i){
    if(a.type === 'image'){
      return `
        <div class="chat-attach-thumb" onclick="openAttachmentPreview(${i})">
          <img src="${a.previewUrl}">
          <button class="remove-attach" onclick="event.stopPropagation();removeAttachment(${i})">×</button>
        </div>
      `;
    } else {
      return `
        <div class="chat-attach-thumb pdf" onclick="openAttachmentPreview(${i})">
          ${pdfIcon}
          <button class="remove-attach" onclick="event.stopPropagation();removeAttachment(${i})">×</button>
        </div>
`;
    }
  }).join('');

  // overflow badge
  if(remaining > 0){
    preview.innerHTML += `
      <div class="chat-attach-overflow" onclick="openAllAttachmentsModal()">
        +${remaining}
      </div>
    `;
  }
}
function removeAttachment(i){chatAttachments.splice(i,1);renderAttachmentPreviews();}

function sendChat(){
  var input=document.getElementById('chat-input');var msg=input.value.trim();
  if(!msg&&!chatAttachments.length)return;
  var sendBtn=document.getElementById('chat-send');
  var userContent=[];
  chatAttachments.forEach(function(a){
  if(a.type === 'image'){
    userContent.push({
      type:'image',
      source:{type:'base64',media_type:a.mediaType,data:a.base64}
    });
  } else {
    userContent.push({
      type:'document',
      source:{type:'base64',media_type:a.mediaType,data:a.base64}
    });
  }
});
  if(msg)userContent.push({type:'text',text:msg});
  if(!userContent.length)return;
  var userDisplayParts=[];
  userDisplayParts.push(`
    <div class="chat-upload-grid">
      ${chatAttachments.map(a=>{
        if(a.type==='image'){
          return `<img src="${a.previewUrl}">`;
        } else {
          return `<div class="chat-pdf-pill">📄 ${a.name}</div>`;
        }
      }).join('')}
    </div>
  `);
  if(msg)userDisplayParts.push(msg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
  var userDiv=document.createElement('div');userDiv.className='chat-msg user';userDiv.innerHTML=userDisplayParts.join('');
  document.getElementById('chat-msgs').appendChild(userDiv);
  var historyContent=userContent.length===1&&userContent[0].type==='text'?userContent[0].text:userContent;
  chatHistory.push({role:'user',content:historyContent});
  input.value='';input.style.height='auto';chatAttachments=[];renderAttachmentPreviews();
  sendBtn.disabled=true;
  var typingEl=document.createElement('div');typingEl.className='chat-typing';typingEl.textContent='Thinking…';
  document.getElementById('chat-msgs').appendChild(typingEl);scrollChat();
  fetch('https://tamil-backend.onrender.com/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatHistory})})
  .then(function(r){if(!r.ok)return r.json().then(function(d){throw d;});return r.json();})
  .then(function(data){
    typingEl.remove();
    if(data.error){
      var errStr=JSON.stringify(data.error||'');
      var friendly='⚠️ Something went wrong. Please try again.';
      if(errStr.indexOf('image exceeds')>=0||errStr.indexOf('5 MB')>=0||errStr.indexOf('5242880')>=0)friendly='⚠️ That image is too large to process (even after compression). Please try a smaller image.';
      else if(errStr.indexOf('invalid_request')>=0)friendly='⚠️ The request was invalid — this image format may not be supported. Try a JPEG or PNG.';
      else if(errStr.indexOf('overloaded')>=0||errStr.indexOf('529')>=0)friendly='⚠️ The AI is busy right now. Please wait a moment and try again.';
      appendChat('ai',friendly);chatHistory.pop();
    } else {chatHistory.push({role:'assistant',content:data.reply});appendChat('ai',data.reply);addXP(2);if(typeof saveChatHistory==='function')saveChatHistory();}
  })
  .catch(function(err){
    typingEl.remove();
    var errStr=JSON.stringify(err||'');
    var friendly='⚠️ Could not reach the server. Please check your connection.';
    if(errStr.indexOf('image exceeds')>=0||errStr.indexOf('5242880')>=0)friendly='⚠️ That image is too large to process. Please try a smaller image.';
    appendChat('ai',friendly);chatHistory.pop();
  })
  .finally(function(){sendBtn.disabled=false;scrollChat();});
}

function appendChat(role,text){
  var div=document.createElement('div');div.className='chat-msg '+role;
  var lines=text.split('\n');
  var htmlLines=lines.map(function(line){
    var escaped=line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var tamilRuns=[...line.matchAll(/[\u0B80-\u0BFF]+/g)];
    if(!tamilRuns.length)return escaped;
    var isBreakdown=/[=→]/.test(line);
    if(isBreakdown){return escaped.replace(/([\u0B80-\u0BFF]+)/g,function(match){var safe=match.replace(/'/g,"\\'");return '<span style="color:var(--accent);font-family:\'Noto Sans Tamil\',sans-serif">'+match+'<button class="speak-btn" style="position:static;display:inline-flex;vertical-align:middle;margin-left:3px;width:22px;height:22px;border-radius:6px;" onclick="speakTamil(\''+safe+'\',this)">'+speakerSVG()+'</button></span>';});}
    else{
      var fullTamil=tamilRuns.map(function(m){return m[0];}).join(' ');var safe=fullTamil.replace(/'/g,"\\'");
      var coloured=escaped.replace(/([\u0B80-\u0BFF]+)/g,function(match){return '<span style="color:var(--accent);font-family:\'Noto Sans Tamil\',sans-serif">'+match+'</span>';});
      var lineIdx=lines.indexOf(line);var nextLine=lines[lineIdx+1]||'';
      var isRoman=nextLine.trim().length>0&&!/[\u0B80-\u0BFF]/.test(nextLine)&&!/[=→]/.test(nextLine)&&!/^(if|note|use|for|this|the|a |in |to )/i.test(nextLine.trim());
      var romanSub=isRoman?'<br><span style="font-size:0.78rem;color:var(--text2);font-style:italic;margin-left:2px">'+nextLine.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>':'';
      if(isRoman)lines[lineIdx+1]='';
      return coloured+'<button class="speak-btn" style="position:static;display:inline-flex;vertical-align:middle;margin-left:6px;width:22px;height:22px;border-radius:6px;" onclick="speakTamil(\''+safe+'\',this)">'+speakerSVG()+'</button>'+romanSub;
    }
  });
  div.innerHTML=htmlLines.join('<br>');
  document.getElementById('chat-msgs').appendChild(div);scrollChat();
}
function scrollChat(){var c=document.getElementById('chat-msgs');c.scrollTop=c.scrollHeight;}
function sendQuick(msg){document.getElementById('chat-input').value=msg;sendChat();}

function showSection(id){
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active')});
  document.querySelectorAll('.nav-tab').forEach(function(t){t.classList.remove('active')});
  document.getElementById('section-'+id).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(function(t){if(t.getAttribute('onclick').indexOf("'"+id+"'")>=0)t.classList.add('active');});
}

function speakerSVG(){return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10v4h3l4 3V7l-4 3H5z"/><path class="wave1" d="M16 9.5c0.8 0.8 0.8 3.5 0 5" style="opacity:0;transition:opacity 0.2s ease"/><path class="wave2" d="M18 7.5c1.8 1.8 1.8 7 0 9" style="opacity:0;transition:opacity 0.25s ease 0.07s"/></svg>';}
function autoGrowTextarea(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,140)+'px';}
function autoResizeTamilText(){document.querySelectorAll('.vocab-tamil').forEach(function(el){var maxSize=24,minSize=14;el.style.fontSize=maxSize+'px';while(el.scrollWidth>el.clientWidth&&maxSize>minSize){maxSize--;el.style.fontSize=maxSize+'px';}});}
var pronunciationOverrides={'வெள்ளை':'வெள் ளை','வாழை':'வா ழை','காற்று':'கா ற்று','அ':'u','ஆ':'ah','இ':'i','ஈ':'ee','உ':'உ','ஊ':'ஊ','எ':'eh','ஏ':'ஏ','ஐ':'eye','ஒ':'oh','ஓ':'ooh','ஔ':'ஔ'};
function fixTamilPronunciation(text){if(pronunciationOverrides[text])return pronunciationOverrides[text];return text.replace(/ள்ள/g,'ள் ள').replace(/ற்ற/g,'ற் ற').replace(/ழ/g,'ழ் ').replace(/ற/g,'ற் ').replace(/\s+/g,' ').trim();}
function speakTamil(text,btn){if(!text)return;var processed=pronunciationOverrides[text]?pronunciationOverrides[text]:text.length<=2?text:fixTamilPronunciation(text);var utter=new SpeechSynthesisUtterance(processed);utter.lang='ta-IN';utter.rate=0.9;var voices=speechSynthesis.getVoices();var tamilVoice=voices.find(function(v){return v.lang==='ta-IN';});if(tamilVoice)utter.voice=tamilVoice;if(btn)btn.classList.add('speaking');utter.onend=function(){if(btn)btn.classList.remove('speaking');};utter.onerror=function(){if(btn)btn.classList.remove('speaking');};speechSynthesis.cancel();speechSynthesis.speak(utter);}
window.speechSynthesis&&window.speechSynthesis.getVoices();
renderLetters();
function updateStreakDisplay() {
  var streak = parseInt(localStorage.getItem('tamil_streak') || '0');
  var chip = document.getElementById('nav-streak-chip');
  if (!chip) return;
  if (streak > 0) {
    chip.textContent = '🔥 ' + streak + ' day' + (streak === 1 ? '' : 's');
    chip.style.display = 'inline-flex';
  } else {
    chip.style.display = 'none';
  }
}
updateStreakDisplay();
if(typeof loadChatHistory==='function') loadChatHistory();
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(reg){console.log('SW registered:',reg.scope);}).catch(function(err){console.log('SW registration failed:',err);});});}
/* Mobile keyboard fix */
(function () {
  const inputArea = document.querySelector('.chat-input-area');

  if (!window.visualViewport) return;

  function adjustForKeyboard() {
    const viewport = window.visualViewport;
    const offset = window.innerHeight - viewport.height - viewport.offsetTop;

    if (offset > 0) {
      inputArea.style.transform = `translateY(-${offset}px)`;
    } else {
      inputArea.style.transform = 'translateY(0)';
    }
  }

  window.visualViewport.addEventListener('resize', adjustForKeyboard);
  window.visualViewport.addEventListener('scroll', adjustForKeyboard);
})();

function openAttachmentPreview(index){
  const a = chatAttachments[index];
  const modal = document.getElementById('attachment-modal');
  const content = document.getElementById('attachment-modal-content');

  if(a.type === 'image'){
    content.innerHTML = `<img src="${a.previewUrl}" class="preview-img">`;
  } else {
    content.innerHTML = `
      <div class="pdf-preview-wrap">
        <iframe src="data:application/pdf;base64,${a.base64}"></iframe>
      </div>
    `;
  }

  modal.classList.add('open');
}

function closeAttachmentModal(){
  document.getElementById('attachment-modal').classList.remove('open');
}

function openAllAttachmentsModal(){
  const modal = document.getElementById('attachment-modal');
  const content = document.getElementById('attachment-modal-content');

  content.innerHTML = `
    <div class="attach-modal-grid">
      ${chatAttachments.map(function(a,i){
        if(a.type === 'image'){
          return `
            <div class="attach-modal-item">
              <img src="${a.previewUrl}">
              <button class="attach-remove-btn" onclick="removeAttachment(${i});openAllAttachmentsModal()">Remove</button>
            </div>
          `;
        } else {
          return `
            <div class="attach-modal-item pdf">
              <div class="pdf-icon">📄</div>
              <div class="pdf-name">${a.name}</div>
              <button class="attach-remove-btn" onclick="removeAttachment(${i});openAllAttachmentsModal()">Remove</button>
            </div>
          `;
        }
      }).join('')}
    </div>
  `;

  modal.classList.add('open');
}

let attachMenuOpen = false;

function toggleAttachMenu(e){
  e.stopPropagation();

  const btn = document.getElementById('attach-btn');
  const menu = document.getElementById('attach-menu');

  attachMenuOpen = !attachMenuOpen;

  if(attachMenuOpen){
    btn.classList.add('open');
    menu.classList.add('open');
  } else {
    btn.classList.remove('open');
    menu.classList.remove('open');
  }
}

function closeAttachMenu(){
  const btn = document.getElementById('attach-btn');
  const menu = document.getElementById('attach-menu');

  btn.classList.remove('open');
  menu.classList.remove('open');
  attachMenuOpen = false;
}

document.addEventListener('click', function(e){
  const btn = document.getElementById('attach-btn');
  const menu = document.getElementById('attach-menu');

  if(!btn || !menu) return;

  if(!btn.contains(e.target) && !menu.contains(e.target)){
    closeAttachMenu();
  }
});

async function buildAIQuestions(){
  var topics=['vocabulary','grammar','phrases','script'];
  var topic=topics[Math.floor(Math.random()*topics.length)];
  var typingEl=document.createElement('div');
  typingEl.className='chat-typing';
  typingEl.textContent='Generating quiz…';
  document.getElementById('quiz-main').appendChild(typingEl);

  try {
    var res = await fetch('https://tamil-backend.onrender.com/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:[{
        role:'user',
        content:`Generate 5 multiple choice quiz questions about Tamil ${topic}. 
Return ONLY valid JSON in this exact format, no other text:
[{"prompt":"question text","big":"Tamil word or letter","sub":"romanisation","answer":"correct answer","options":["option1","option2","option3","option4"]}]
Make sure options contains exactly 4 items and answer is one of them.`
      }]})
    });
    var data = await res.json();
    typingEl.remove();
    var text = data.reply.replace(/```json|```/g,'').trim();
    var questions = JSON.parse(text);
    return questions.map(function(q){
      return {type:'mcq',prompt:q.prompt,big:q.big||'',sub:q.sub||'',answer:q.answer,options:q.options};
    });
  } catch(e) {
    typingEl.remove();
    return buildMixedQuestions(); // fallback to regular quiz
  }
}

async function startAIQuiz(){
  document.getElementById('quiz-start').style.display='none';
  document.getElementById('quiz-main').style.display='block';
  document.getElementById('quiz-main').innerHTML='<div class="chat-typing" style="margin:2rem auto;text-align:center">Generating quiz…</div>';
  var qs = await buildAIQuestions();
  quizState={questions:qs,current:0,score:0,answered:false,type:'ai'};
  renderQuizQ();
}