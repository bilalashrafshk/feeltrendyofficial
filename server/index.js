const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions API (Payables/Receivables)
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = await prisma.transaction.create({ data: req.body });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shipments API
app.get('/api/shipments', async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const shipment = await prisma.shipment.create({ data: req.body });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoices API
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({ data: req.body });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exchange Rate API
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const rate = await prisma.exchangeRate.findFirst({
      where: { from: 'INR', to: 'PKR' },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(rate || { rate: 3.3 }); // Default fallback
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exchange-rate', async (req, res) => {
  try {
    const { rate } = req.body;
    const updatedRate = await prisma.exchangeRate.upsert({
      where: { id: 'inr-pkr' }, // Simplified for one rate
      update: { rate, updatedAt: new Date() },
      create: { id: 'inr-pkr', from: 'INR', to: 'PKR', rate }
    });
    res.json(updatedRate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
