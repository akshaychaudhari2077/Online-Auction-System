let currentUser = null;
let auctions = [];
let users = [{ id: 'u0', name: 'System', email: 'system@bidvault.com', password: '---', bids: 0, won: 0, listed: 0 }];
let activeBidAuction = null;
let selectedEmoji = '🎨';
let activeFilter = 'all';
let feedInterval, statsInterval, timerInterval;

// ===== SEED DATA =====
const seed = [
  {
    id: 'a1', title: 'Abstract Expressionist No.7', seller: 'ArtHouse Gallery',
    category: 'Art', emoji: '🎨', desc: 'Original acrylic on canvas, 120×90cm. Certificate of authenticity included.',
    startPrice: 800, currentBid: 2400, increment: 100,
    endTime: Date.now() + 1000 * 60 * 23,
    bids: [
      { bidder: 'collector88', amount: 2400, time: Date.now() - 1000*60*2 },
      { bidder: 'artlover', amount: 2200, time: Date.now() - 1000*60*8 },
      { bidder: 'bid_king', amount: 1800, time: Date.now() - 1000*60*15 },
    ],
    status: 'live', reserve: 0
  },
  {
    id: 'a2', title: 'MacBook Pro M4 Max — Sealed', seller: 'TechResellerPro',
    category: 'Tech', emoji: '💻', desc: 'Brand new sealed in box. Space Black, 48GB RAM, 1TB SSD.',
    startPrice: 2500, currentBid: 3200, increment: 50,
    endTime: Date.now() + 1000 * 60 * 60 * 4,
    bids: [
      { bidder: 'gadget_master', amount: 3200, time: Date.now() - 1000*60*5 },
      { bidder: 'tech_fanboy', amount: 3100, time: Date.now() - 1000*60*12 },
    ],
    status: 'live', reserve: 3000
  },
  {
    id: 'a3', title: 'Rolex Submariner Date 1972', seller: 'VintageTimepieces',
    category: 'Jewelry', emoji: '⌚', desc: 'Ref 1680. Original dial, running perfectly. Comes with service records.',
    startPrice: 8000, currentBid: 14500, increment: 250,
    endTime: Date.now() + 1000 * 60 * 60 * 2,
    bids: [
      { bidder: 'luxurywatch', amount: 14500, time: Date.now() - 1000*30 },
      { bidder: 'rolex_hunter', amount: 14000, time: Date.now() - 1000*60*3 },
      { bidder: 'TimeTrader99', amount: 12500, time: Date.now() - 1000*60*10 },
    ],
    status: 'live', reserve: 10000
  },
  {
    id: 'a4', title: '1st Edition Pokémon Booster Box', seller: 'CardCollector',
    category: 'Collectibles', emoji: '🃏', desc: 'Authentic 1st edition Base Set sealed booster box. PSA graded case.',
    startPrice: 5000, currentBid: 5000, increment: 200,
    endTime: Date.now() + 1000 * 60 * 60 * 6,
    bids: [],
    status: 'live', reserve: 0
  },
  {
    id: 'a5', title: 'Original Gibson Les Paul 1959', seller: 'RockLegacy',
    category: 'Collectibles', emoji: '🎸', desc: 'Burst finish. One owner from new. Original case and paperwork.',
    startPrice: 45000, currentBid: 48000, increment: 500,
    endTime: Date.now() + 1000 * 60 * 60 * 14,
    bids: [
      { bidder: 'rock_legend', amount: 48000, time: Date.now() - 1000*60*20 },
    ],
    status: 'live', reserve: 0
  },
  {
    id: 'a6', title: 'Rare 3000-Year-Old Bronze Vessel', seller: 'AncientArts',
    category: 'Art', emoji: '🏺', desc: 'Authenticated Zhou dynasty bronze. Museum provenance letter included.',
    startPrice: 12000, currentBid: 12000, increment: 500,
    endTime: Date.now() + 1000 * 60 * 60 * 24 * 2,
    bids: [],
    status: 'upcoming', reserve: 0
  },
  {
    id: 'a7', title: 'Hermès Birkin 35 Togo — Noir', seller: 'LuxuryConsign',
    category: 'Fashion', emoji: '👜', desc: 'Pristine condition. Full set with dust bag, box, and receipt.',
    startPrice: 9000, currentBid: 11200, increment: 200,
    endTime: Date.now() + 1000 * 60 * 60 * 5,
    bids: [
      { bidder: 'fashionista', amount: 11200, time: Date.now() - 1000*60*7 },
      { bidder: 'lux_buyer', amount: 10600, time: Date.now() - 1000*60*18 },
    ],
    status: 'live', reserve: 10000
  }
];

const completedAuctions = [
  { title: 'Banksy Original Print', winner: 'art_collector_99', amount: 7200, ago: '2h ago' },
  { title: 'Apple Watch Ultra 2 Titanium', winner: 'techbuyer_sg', amount: 1050, ago: '5h ago' },
  { title: 'Vintage Leica M3 Camera', winner: 'photoManiac', amount: 3800, ago: '1d ago' },
];

function init() {
  auctions = JSON.parse(JSON.stringify(seed));
  renderAuctions();
  renderWinners();
  startFeed();
  startTimers();
  animateStats();

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigateTo(a.dataset.page); });
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  document.querySelectorAll('.ep-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.ep-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedEmoji = opt.dataset.emoji;
    });
  });

  document.getElementById('heroSellBtn').addEventListener('click', () => {
    if (!currentUser) { openModal('loginModal'); return; }
    navigateTo('list');
  });
}

// ===== NAVIGATION =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('[data-page="'+page+'"]').forEach(el => el.classList.add('active'));

  if (page === 'dashboard') updateDashboard();
  if (page === 'list') updateListPage();
}

// ===== RENDER AUCTIONS =====
function renderAuctions() {
  const grid = document.getElementById('auctionGrid');
  let items = auctions.filter(a => {
    if (activeFilter === 'all') return true;
    return a.category === activeFilter;
  });

  if (items.length === 0) {
    grid.innerHTML = '<div class="no-items"><p>🔍</p><p style="color:var(--muted)">No auctions in this category yet.</p></div>';
    return;
  }

  grid.innerHTML = items.map(a => {
    const timeLeft = a.endTime - Date.now();
    const isLive = a.status === 'live' && timeLeft > 0;
    const isEnding = isLive && timeLeft < 1000 * 60 * 30;
    const isExpired = timeLeft <= 0;
    const bidCount = a.bids.length;
    const pct = Math.min(100, ((a.currentBid - a.startPrice) / (a.startPrice * 2)) * 100);

    return `
    <div class="auction-card" onclick="openBidModal('${a.id}')">
      <div class="card-wrap">
        <div class="card-img-placeholder">${a.emoji}</div>
        <div class="card-badges" style="position:absolute;top:0.75rem;left:0.75rem;">
          ${isExpired ? '<span class="badge badge-upcoming">Ended</span>' : isEnding ? '<span class="badge badge-ending">⚡ Ending Soon</span>' : isLive ? '<span class="badge badge-live">● Live</span>' : '<span class="badge badge-upcoming">Upcoming</span>'}
          <span class="badge badge-cat">${a.category}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${a.title}</div>
        <div class="card-seller">by ${a.seller}</div>
        <div class="card-bid-row">
          <div>
            <div class="bid-label">Current Bid</div>
            <div class="bid-amount">$${a.currentBid.toLocaleString()}</div>
            <div class="bid-count">${bidCount} bid${bidCount!==1?'s':''}</div>
          </div>
          <div class="timer${isEnding ? ' urgent' : ''}" id="timer-${a.id}">${formatTime(timeLeft)}</div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="card-action">
          <button class="btn ${isLive ? 'btn-gold' : 'btn-ghost'}" onclick="event.stopPropagation();openBidModal('${a.id}')">
            ${isExpired ? '📋 View Result' : isLive ? '🔨 Place Bid' : '👁 Preview'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterAuctions(cat) {
  activeFilter = cat;
  document.querySelectorAll('#filterBtns .btn').forEach(b => {
    b.style.borderColor = '';
    b.style.color = '';
  });
  const fb = document.getElementById('f-' + (cat === 'all' ? 'all' : cat));
  if (fb) { fb.style.borderColor = 'var(--gold)'; fb.style.color = 'var(--gold)'; }
  renderAuctions();
}

// ===== RENDER WINNERS =====
function renderWinners() {
  document.getElementById('winnersContainer').innerHTML = completedAuctions.map(w => `
    <div class="winner-banner" style="margin-bottom:1rem;">
      <div class="winner-trophy">🏆</div>
      <div class="winner-info">
        <h3>${w.title}</h3>
        <p>Won by <strong>${w.winner}</strong> for <strong>$${w.amount.toLocaleString()}</strong> — ${w.ago}</p>
      </div>
    </div>
  `).join('');
}

// ===== TIMERS =====
function startTimers() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    auctions.forEach(a => {
      const el = document.getElementById('timer-' + a.id);
      if (!el) return;
      const t = a.endTime - Date.now();
      el.textContent = formatTime(t);
      if (t < 1000 * 60 * 30) el.classList.add('urgent');
      else el.classList.remove('urgent');

      if (t <= 0 && a.status === 'live') {
        a.status = 'ended';
        if (a.bids.length > 0) {
          const winner = a.bids[0];
          completedAuctions.unshift({ title: a.title, winner: winner.bidder, amount: winner.amount, ago: 'Just now' });
          addFeedItem('🏆', `<strong>${winner.bidder}</strong> won <strong>${a.title}</strong> for <strong>$${winner.amount.toLocaleString()}</strong>`);
          renderWinners();
        }
        renderAuctions();
      }
    });

    if (activeBidAuction) {
      const a = auctions.find(x => x.id === activeBidAuction);
      if (a) {
        const t = a.endTime - Date.now();
        const el = document.getElementById('bidTimerDisplay');
        if (el) { el.textContent = formatTime(t); if (t < 1000*60*30) el.classList.add('urgent'); }
      }
    }
  }, 1000);
}

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h,m,s].map(v => String(v).padStart(2,'0')).join(':');
}

// ===== LIVE FEED =====
const feedMessages = [
  (a, u) => `<strong>${u}</strong> placed a bid of <strong>$${(a.currentBid + a.increment * Math.ceil(Math.random()*3)).toLocaleString()}</strong> on ${a.title}`,
  (a, u) => `<strong>${u}</strong> is watching <strong>${a.title}</strong>`,
  (a, u) => `<strong>${u}</strong> outbid the previous bidder on <strong>${a.title}</strong>`,
];

const randUsers = ['bidder_x7','artfan2024','luxcollector','TopBid_99','silent_winner','sneaky_bid','valuehunter','goldfinch'];

function addFeedItem(icon, text) {
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const div = document.createElement('div');
  div.className = 'feed-item';
  div.innerHTML = `<span class="feed-icon">${icon}</span><span class="feed-text">${text}</span><span class="feed-time">${now}</span>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  if (feed.children.length > 30) feed.removeChild(feed.children[0]);
}

function startFeed() {
  const icons = ['🔨','👁','⚡','🔔','💬'];
  addFeedItem('🚀', '<strong>BidVault</strong> is live — place your bids now!');
  feedInterval = setInterval(() => {
    const liveAuctions = auctions.filter(a => a.status === 'live' && a.endTime > Date.now());
    if (liveAuctions.length === 0) return;
    const a = liveAuctions[Math.floor(Math.random() * liveAuctions.length)];
    const u = randUsers[Math.floor(Math.random() * randUsers.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const msg = feedMessages[Math.floor(Math.random() * feedMessages.length)](a, u);
    addFeedItem(icon, msg);
  }, 3500);
}

// ===== STATS ANIMATION =====
function animateStats() {
  statsInterval = setInterval(() => {
    const bEl = document.getElementById('statBids');
    if (bEl) { const v = parseInt(bEl.textContent.replace(/,/g,'')); bEl.textContent = (v + Math.floor(Math.random()*3)).toLocaleString(); }
    const bidEl = document.getElementById('statBidders');
    if (bidEl && Math.random() > 0.7) { const v = parseInt(bidEl.textContent); bidEl.textContent = v + 1; }
  }, 4000);
}

// ===== BID MODAL =====
function openBidModal(auctionId) {
  const a = auctions.find(x => x.id === auctionId);
  if (!a) return;
  activeBidAuction = auctionId;

  document.getElementById('bidModalTitle').textContent = a.title;
  document.getElementById('bidModalSub').textContent = a.category + ' · ' + a.seller;
  document.getElementById('bidCurrentAmt').textContent = '$' + a.currentBid.toLocaleString();
  document.getElementById('bidAmount').value = '';
  document.getElementById('bidAmount').min = a.currentBid + a.increment;
  document.getElementById('bidMinNote').textContent = `Minimum bid: $${(a.currentBid + a.increment).toLocaleString()} (increment $${a.increment})`;

  const hist = document.getElementById('bidHistory');
  if (a.bids.length === 0) {
    hist.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--muted);font-size:0.85rem;">No bids yet — be the first!</div>';
  } else {
    hist.innerHTML = a.bids.map((b, i) => `
      <div class="bid-row ${i===0 ? 'winning' : ''}">
        <span class="bidder">${i===0 ? '👑 ' : ''}${b.bidder}</span>
        <span class="bamount">$${b.amount.toLocaleString()}</span>
        <span class="btime">${timeAgo(b.time)}</span>
      </div>`).join('');
  }

  openModal('bidModal');
}

function submitBid() {
  if (!currentUser) {
    closeModal('bidModal');
    openModal('loginModal');
    showToast('Please sign in to place a bid.', 'error');
    return;
  }

  const a = auctions.find(x => x.id === activeBidAuction);
  if (!a) return;

  const amount = parseInt(document.getElementById('bidAmount').value);
  const min = a.currentBid + a.increment;

  if (!amount || isNaN(amount)) { showToast('Please enter a bid amount.', 'error'); return; }
  if (amount < min) { showToast(`Bid must be at least $${min.toLocaleString()}.`, 'error'); return; }
  if (a.endTime <= Date.now()) { showToast('This auction has ended.', 'error'); return; }

  a.bids.unshift({ bidder: currentUser.name.toLowerCase().replace(' ','_'), amount, time: Date.now() });
  a.currentBid = amount;
  currentUser.bids++;
  document.getElementById('dBidsPlaced').textContent = currentUser.bids;

  document.getElementById('bidCurrentAmt').textContent = '$' + amount.toLocaleString();
  const hist = document.getElementById('bidHistory');
  hist.innerHTML = a.bids.map((b, i) => `
    <div class="bid-row ${i===0 ? 'winning' : ''}">
      <span class="bidder">${i===0 ? '👑 ' : ''}${b.bidder}</span>
      <span class="bamount">$${b.amount.toLocaleString()}</span>
      <span class="btime">${timeAgo(b.time)}</span>
    </div>`).join('');

  document.getElementById('bidAmount').value = '';
  document.getElementById('bidMinNote').textContent = `Minimum bid: $${(amount + a.increment).toLocaleString()}`;

  addFeedItem('🔨', `<strong>${currentUser.name}</strong> placed a bid of <strong>$${amount.toLocaleString()}</strong> on <strong>${a.title}</strong>`);
  renderAuctions();
  showToast(`Bid of $${amount.toLocaleString()} placed! You are the highest bidder.`, 'success');
}

// ===== AUTH =====
function handleRegister() {
  const first = document.getElementById('regFirst').value.trim();
  const last = document.getElementById('regLast').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if (!first || !last) { showToast('Please enter your name.', 'error'); return; }
  if (!email || !email.includes('@')) { showToast('Please enter a valid email.', 'error'); return; }
  if (pass.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
  if (pass !== confirm) { showToast('Passwords do not match.', 'error'); return; }
  if (users.find(u => u.email === email)) { showToast('Email already registered. Please log in.', 'error'); return; }

  const user = { id: 'u' + Date.now(), name: first + ' ' + last, email, password: pass, bids: 0, won: 0, listed: 0 };
  users.push(user);
  loginAs(user);
  closeModal('registerModal');
  showToast(`Welcome to BidVault, ${first}! 🎉`, 'success');
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;

  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) { showToast('Invalid email or password.', 'error'); return; }

  loginAs(user);
  closeModal('loginModal');
  showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
}

function loginAs(user) {
  currentUser = user;
  const actions = document.getElementById('navActions');
  actions.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <div style="width:32px;height:32px;border-radius:50%;background:rgba(201,168,76,0.2);border:1px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:600;color:var(--gold);">
        ${user.name.split(' ').map(n=>n[0]).join('').toUpperCase()}
      </div>
      <span style="font-size:0.875rem;color:var(--paper);">${user.name.split(' ')[0]}</span>
      <button class="btn btn-ghost" onclick="logout()" style="padding:0.35rem 0.875rem;font-size:0.8rem;">Log Out</button>
    </div>`;
  updateDashboard();
  updateListPage();
}

function logout() {
  currentUser = null;
  const actions = document.getElementById('navActions');
  actions.innerHTML = `
    <button class="btn btn-ghost" id="loginBtn" onclick="openModal('loginModal')">Log In</button>
    <button class="btn btn-gold" id="registerBtn" onclick="openModal('registerModal')">Register</button>`;
  updateDashboard();
  updateListPage();
}

// ===== DASHBOARD =====
function updateDashboard() {
  document.getElementById('dashNotLoggedIn').style.display = currentUser ? 'none' : 'block';
  document.getElementById('dashLoggedIn').style.display = currentUser ? 'block' : 'none';
  if (!currentUser) return;

  document.getElementById('dashUsername').textContent = currentUser.name.split(' ')[0];
  document.getElementById('dBidsPlaced').textContent = currentUser.bids;
  document.getElementById('dAuctionsWon').textContent = currentUser.won;
  document.getElementById('dItemsListed').textContent = currentUser.listed;

  const myBidder = currentUser.name.toLowerCase().replace(' ','_');
  const myBids = auctions.filter(a => a.bids.some(b => b.bidder === myBidder) && a.status === 'live');
  const bidList = document.getElementById('activeBidsList');
  if (myBids.length === 0) {
    bidList.innerHTML = '<div style="color:var(--muted);font-size:0.875rem;padding:1rem 0;">You have no active bids. <a style="color:var(--gold);cursor:pointer;" onclick="navigateTo(\'home\')">Browse auctions →</a></div>';
  } else {
    bidList.innerHTML = myBids.map(a => {
      const myBid = a.bids.find(b => b.bidder === myBidder);
      const isWinning = a.bids[0].bidder === myBidder;
      return `<div style="padding:0.75rem 0;border-bottom:1px solid rgba(201,168,76,0.1);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:0.9rem;font-weight:500;">${a.emoji} ${a.title}</div>
          <div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem;">Your bid: $${myBid.amount.toLocaleString()}</div>
        </div>
        <span style="font-size:0.75rem;font-weight:700;padding:0.25rem 0.6rem;border-radius:3px;${isWinning ? 'background:rgba(46,204,113,0.15);color:#2ECC71;' : 'background:rgba(231,76,60,0.12);color:#E74C3C;'}">
          ${isWinning ? '👑 Winning' : '⚠ Outbid'}
        </span>
      </div>`;
    }).join('');
  }

  const myListings = auctions.filter(a => a.seller === currentUser.name || a.seller === currentUser.name.split(' ')[0]);
  const listList = document.getElementById('myListingsList');
  if (myListings.length === 0) {
    listList.innerHTML = '<div style="color:var(--muted);font-size:0.875rem;padding:1rem 0;">No listings yet. <a style="color:var(--gold);cursor:pointer;" onclick="navigateTo(\'list\')">List an item →</a></div>';
  } else {
    listList.innerHTML = myListings.map(a => `
      <div style="padding:0.75rem 0;border-bottom:1px solid rgba(201,168,76,0.1);">
        <div style="font-size:0.9rem;font-weight:500;">${a.emoji} ${a.title}</div>
        <div style="font-size:0.8rem;color:var(--gold);font-family:'JetBrains Mono',monospace;margin-top:0.25rem;">$${a.currentBid.toLocaleString()} · ${a.bids.length} bids</div>
      </div>`).join('');
  }
}

// ===== LIST ITEM =====
function updateListPage() {
  document.getElementById('listNotLoggedIn').style.display = currentUser ? 'none' : 'block';
  document.getElementById('listForm').style.display = currentUser ? 'block' : 'none';
}

function listItem() {
  if (!currentUser) { openModal('loginModal'); return; }
  const title = document.getElementById('listTitle').value.trim();
  const cat = document.getElementById('listCat').value;
  const desc = document.getElementById('listDesc').value.trim();
  const start = parseInt(document.getElementById('listStart').value);
  const increment = parseInt(document.getElementById('listIncrement').value) || 10;
  const duration = parseInt(document.getElementById('listDuration').value);
  const reserve = parseInt(document.getElementById('listReserve').value) || 0;

  if (!title) { showToast('Please enter an item name.', 'error'); return; }
  if (!desc) { showToast('Please add a description.', 'error'); return; }
  if (!start || start < 1) { showToast('Please enter a valid starting price.', 'error'); return; }

  const newAuction = {
    id: 'a' + Date.now(), title, seller: currentUser.name, category: cat,
    emoji: selectedEmoji, desc, startPrice: start, currentBid: start,
    increment, endTime: Date.now() + duration * 3600000,
    bids: [], status: 'live', reserve
  };

  auctions.unshift(newAuction);
  currentUser.listed++;
  document.getElementById('dItemsListed').textContent = currentUser.listed;

  document.getElementById('listTitle').value = '';
  document.getElementById('listDesc').value = '';
  document.getElementById('listStart').value = '';
  document.getElementById('listIncrement').value = '';
  document.getElementById('listReserve').value = '';

  addFeedItem('🆕', `<strong>${currentUser.name}</strong> just listed <strong>${title}</strong> starting at <strong>$${start.toLocaleString()}</strong>`);
  renderAuctions();
  showToast(`"${title}" is now live on BidVault! 🚀`, 'success');
  navigateTo('home');
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'bidModal') activeBidAuction = null;
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

document.querySelectorAll('.overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
});

document.getElementById('loginBtn') && document.getElementById('loginBtn').addEventListener('click', () => openModal('loginModal'));
document.getElementById('registerBtn') && document.getElementById('registerBtn').addEventListener('click', () => openModal('registerModal'));

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ===== HELPERS =====
function scrollToAuctions() {
  document.getElementById('auctionSection').scrollIntoView({ behavior: 'smooth' });
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return Math.floor(d/1000) + 's ago';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  return Math.floor(d/3600000) + 'h ago';
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    activeBidAuction = null;
  }
});

// ===== BOOT =====
filterAuctions('all');
init();