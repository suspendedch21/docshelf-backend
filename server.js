const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── MongoDB connection ──
const MONGO_URI = process.env.MONGO_URI; // set this in Render environment variables
const DB_NAME   = 'docshelf';
const COL_NAME  = 'books';

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME).collection(COL_NAME);
  console.log('✅ Connected to MongoDB Atlas');
}

// ── Routes ──

// GET all books
app.get('/books', async (req, res) => {
  try {
    const books = await db.find({}).sort({ createdAt: -1 }).toArray();
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST insert a book
app.post('/books', async (req, res) => {
  try {
    const doc = { ...req.body, createdAt: new Date().toISOString() };
    const result = await db.insertOne(doc);
    res.json({ insertedId: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update a book
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    delete update._id;
    await db.updateOne({ _id: new ObjectId(id) }, { $set: update });
    res.json({ updated: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE a book
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteOne({ _id: new ObjectId(id) });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'DocShelf API running ✅' }));

// ── Start ──
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
