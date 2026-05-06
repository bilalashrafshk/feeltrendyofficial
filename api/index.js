import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- Products ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json({ data: product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ data: product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Transactions ---
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
    res.json({ data: transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = await prisma.transaction.create({ data: req.body });
    res.json({ data: transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ data: transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices ---
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ orderBy: { date: 'desc' } });
    res.json({ data: invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({ data: req.body });
    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Customers ---
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.json({ data: customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vendors ---
app.get('/api/vendors', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: vendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const vendor = await prisma.vendor.create({ data: req.body });
    res.json({ data: vendor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Shipments ---
app.get('/api/shipments', async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: shipments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const shipment = await prisma.shipment.create({ data: req.body });
    res.json({ data: shipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings ---
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 'global', exchangeRate: 3.3 } });
    }
    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: { exchangeRate: parseFloat(req.body.rate) },
      create: { id: 'global', exchangeRate: parseFloat(req.body.rate) }
    });
    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
