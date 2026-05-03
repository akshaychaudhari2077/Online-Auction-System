/**
 * BidVault — Online Auction System
 * No database needed — runs fully in memory
 * npm install express socket.io cors
 * node server.js
 */

const express    = require('express');
const { Server } = require('socket.io');
const http       = require('http');
const cors       = require('cors');
const path       = require('path');
const crypto     = require('crypto');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const PORT   = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));  // serves CSS & JS
app.use(express.static(path.join(__dirname, '..', 'view')));    // serves HTML
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'view', 'index.html'));
});// serves index.html

// ─── IN-MEMORY STORE ─────────────────────────────────────────────
const users    = [];
const auctions = [
  {
    id: 'a1', title: 'Abstract Expressionist No.7', seller: 'ArtHouse Gallery',
    category: 'Art', emoji: '🎨', desc: 'Original acrylic on canvas, 120x90cm.',
    startPrice: 800, currentBid: 2400, increment: 100,
    endTime: Date.now() + 1000 * 60 * 40,
    bids: [
      { bidder: 'collector88', amount: 2400, time: Date.now() - 120000 },
      { bidder: 'artlover',    amount: 2200, time: Date.now() - 480000 },
    ],
    status: 'live', sellerId: 'system'
  },
  {
    id: 'a2', title: 'MacBook Pro M4 Max - Sealed', seller: 'TechResellerPro',
    category: 'Tech', emoji: '💻', desc: 'Brand new sealed. 48GB RAM, 1TB SSD.',
    startPrice: 2500, currentBid: 3200, increment: 50,
    endTime: Date.now() + 1000 * 60 * 60 * 4,
    bids: [
      { bidder: 'gadget_master', amount: 3200, time: Date.now() - 300000 },
    ],
    status: 'live', sellerId: 'system'
  },
  {
    id: 'a3', title: 'Rolex Submariner Date 1972', seller: 'VintageTimepieces',
    category: 'Jewelry', emoji: '⌚', desc: 'Ref 1680. Original dial, full service records.',
    startPrice: 8000, currentBid: 14500, increment: 250,
    endTime: Date.now() + 1000 * 60 * 60 * 2,
    bids: [
      { bidder: 'luxurywatch',  amount: 14500, time: Date.now() - 30000 },
      { bidder: 'rolex_hunter', amount: 14000, time: Date.now() - 180000 },
    ],
    status: 'live', sellerId: 'system'
  },
  {
    id: 'a4', title: '1st Edition Pokemon Booster Box', seller: 'CardCollector',
    category: 'Collectibles', emoji: '🃏', desc: 'Authentic 1st edition Base Set sealed.',
    startPrice: 5000, currentBid: 5000, increment: 200,
    endTime: Date.now() + 1000 * 60 * 60 * 6,
    bids: [], status: 'live', sellerId: 'system'
  },
  {
    id: 'a5', title: 'Gibson Les Paul 1959 Original', seller: 'RockLegacy',
    category: 'Collectibles', emoji: '🎸', desc: 'Burst finish. One owner. Original case.',
    startPrice: 45000, currentBid: 48000, increment: 500,
    endTime: Date.now() + 1000 * 60 * 60 * 14,
    bids: [{ bidder: 'rock_legend', amount: 48000, time: Date.now() - 1200000 }],
    status: 'live', sellerId: 'system'
  },
];

const winners = [
  { title: 'Banksy Original Print',        winner: 'art_collector_99', amount: 7200, ago: '2h ago' },
  { title: 'Apple Watch Ultra 2 Titanium', winner: 'techbuyer_sg',     amount: 1050, ago: '5h ago' },
  { title: 'Vintage Leica M3 Camera',      winner: 'photoManiac',      amount: 3800, ago: '1d ago' },
];

// ─── HELPERS ─────────────────────────────────────────────────────
function uid() {
  return crypto.randomBytes(6).toString('hex');
}

// Lightweight token (no external lib needed)
function makeToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `bv.${data}.sig`;
}

function readToken(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch {
    return null;
  }
}

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const user  = readToken(token);
  if (!user) return res.status(401).json({ error: 'Please log in first' });
  req.user = user;
  next();
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email already registered' });

  const user = { id: uid(), name, email, password, bids: 0, won: 0, listed: 0 };
  users.push(user);
  const token = makeToken({ id: user.id, name, email });
  res.status(201).json({ token, user: { id: user.id, name, email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = makeToken({ id: user.id, name: user.name, email });
  res.json({ token, user: { id: user.id, name: user.name, email, bids: user.bids, won: user.won, listed: user.listed } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, bids: user.bids, won: user.won, listed: user.listed });
});

// ─── AUCTION ROUTES ───────────────────────────────────────────────
app.get('/api/auctions', (req, res) => {
  let list = [...auctions];
  if (req.query.category) list = list.filter(a => a.category === req.query.category);
  if (req.query.status)   list = list.filter(a => a.status   === req.query.status);
  res.json({ auctions: list, total: list.length });
});

app.get('/api/auctions/:id', (req, res) => {
  const a = auctions.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Auction not found' });
  res.json(a);
});

app.post('/api/auctions', auth, (req, res) => {
  const { title, description, category, emoji, startPrice, increment, reservePrice, durationHours } = req.body;
  if (!title || !startPrice || !durationHours)
    return res.status(400).json({ error: 'title, startPrice and durationHours are required' });

  const user = users.find(u => u.id === req.user.id);
  const auction = {
    id:           uid(),
    title,
    desc:         description || '',
    category:     category || 'Other',
    emoji:        emoji || '📦',
    seller:       user ? user.name : req.user.name,
    sellerId:     req.user.id,
    startPrice:   +startPrice,
    currentBid:   +startPrice,
    increment:    +(increment  || 10),
    reservePrice: +(reservePrice || 0),
    endTime:      Date.now() + (+durationHours) * 3600000,
    bids:         [],
    status:       'live',
  };

  auctions.unshift(auction);
  if (user) user.listed++;

  io.emit('auctionCreated', { auction });
  io.emit('liveFeed', { type: 'new', message: `${auction.seller} listed "${title}" starting at $${(+startPrice).toLocaleString()}` });
  res.status(201).json(auction);
});

// ─── BIDDING ──────────────────────────────────────────────────────
app.post('/api/auctions/:id/bid', auth, (req, res) => {
  const auction = auctions.find(a => a.id === req.params.id);
  if (!auction)                         return res.status(404).json({ error: 'Auction not found' });
  if (auction.status !== 'live')        return res.status(400).json({ error: 'Auction is not live' });
  if (auction.endTime <= Date.now())    return res.status(400).json({ error: 'Auction has ended' });
  if (auction.sellerId === req.user.id) return res.status(400).json({ error: 'Cannot bid on your own item' });

  const amount = +req.body.amount;
  const minBid = auction.currentBid + auction.increment;
  if (!amount || amount < minBid)
    return res.status(400).json({ error: `Minimum bid is $${minBid.toLocaleString()}` });

  const user       = users.find(u => u.id === req.user.id);
  const bidderName = user ? user.name : req.user.name;

  auction.bids.unshift({ bidder: bidderName, amount, time: Date.now() });
  auction.currentBid = amount;
  if (user) user.bids++;

  io.to(req.params.id).emit('newBid', {
    auctionId:  auction.id,
    bid:        { bidder: bidderName, amount, time: Date.now() },
    currentBid: amount,
  });
  io.emit('liveFeed', {
    type:    'bid',
    message: `${bidderName} bid $${amount.toLocaleString()} on "${auction.title}"`,
  });

  res.json({ message: 'Bid placed successfully!', currentBid: amount });
});

// ─── MISC ROUTES ──────────────────────────────────────────────────
app.get('/api/stats', (_, res) => {
  const totalBids = auctions.reduce((s, a) => s + a.bids.length, 0);
  res.json({
    activeAuctions: auctions.filter(a => a.status === 'live').length,
    totalBidders:   users.length + 142,
    totalBids:      totalBids + 1283,
    totalSold:      '$48.2K',
  });
});

app.get('/api/winners', (_, res) => res.json(winners));

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', mode: 'in-memory', users: users.length, auctions: auctions.length })
);

// ─── SOCKET.IO ────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log('  [WS] Client connected:', socket.id);
  socket.on('joinAuction',  id => socket.join(id));
  socket.on('leaveAuction', id => socket.leave(id));
  socket.on('disconnect',   ()  => console.log('  [WS] Disconnected:', socket.id));
});

// ─── AUCTION ENGINE — runs every 30s ─────────────────────────────
setInterval(() => {
  auctions.forEach(a => {
    if (a.status === 'live' && a.endTime <= Date.now()) {
      a.status = 'ended';
      if (a.bids.length > 0) {
        const top = a.bids[0];
        winners.unshift({ title: a.title, winner: top.bidder, amount: top.amount, ago: 'Just now' });
        io.to(a.id).emit('auctionEnded', { auctionId: a.id, winner: top.bidder, winningBid: top.amount });
        io.emit('liveFeed', { type: 'winner', message: `${top.bidder} won "${a.title}" for $${top.amount.toLocaleString()}!` });
        console.log(`  [ENGINE] "${a.title}" ended — Winner: ${top.bidder} ($${top.amount})`);
      } else {
        console.log(`  [ENGINE] "${a.title}" ended — No bids`);
      }
    }
  });
}, 30000);

// ─── START ────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║        BidVault Auction System       ║');
  console.log('  ║   Open: http://localhost:' + PORT + '          ║');
  console.log('  ║   Mode: In-Memory  (no database)     ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Note: Data resets when you restart the server.');
  console.log('');
});