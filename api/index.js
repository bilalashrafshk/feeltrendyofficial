const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- Products ---
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: products });
});

app.post('/api/products', async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.json({ data: product });
});

app.put('/api/products/:id', async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ data: product });
});

app.delete('/api/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- Transactions ---
app.get('/api/transactions', async (req, res) => {
  const transactions = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
  res.json({ data: transactions });
});

app.post('/api/transactions', async (req, res) => {
  const transaction = await prisma.transaction.create({ data: req.body });
  res.json({ data: transaction });
});

app.put('/api/transactions/:id', async (req, res) => {
  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ data: transaction });
});

app.delete('/api/transactions/:id', async (req, res) => {
  await prisma.transaction.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- Invoices ---
app.get('/api/invoices', async (req, res) => {
  const invoices = await prisma.invoice.findMany({ orderBy: { date: 'desc' } });
  res.json({ data: invoices });
});

app.post('/api/invoices', async (req, res) => {
  const invoice = await prisma.invoice.create({ data: req.body });
  res.json({ data: invoice });
});

app.delete('/api/invoices/:id', async (req, res) => {
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- Customers ---
app.get('/api/customers', async (req, res) => {
  const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
  res.json({ data: customers });
});

app.post('/api/customers', async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.json({ data: customer });
});

// --- Vendors ---
app.get('/api/vendors', async (req, res) => {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  res.json({ data: vendors });
});

app.post('/api/vendors', async (req, res) => {
  const vendor = await prisma.vendor.create({ data: req.body });
  res.json({ data: vendor });
});

// --- Shipments ---
app.get('/api/shipments', async (req, res) => {
  const shipments = await prisma.shipment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: shipments });
});

app.post('/api/shipments', async (req, res) => {
  const shipment = await prisma.shipment.create({ data: req.body });
  res.json({ data: shipment });
});

// --- Settings ---
app.get('/api/settings', async (req, res) => {
  let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'global', exchangeRate: 3.3 } });
  }
  res.json({ data: settings });
});

app.put('/api/settings', async (req, res) => {
  const settings = await prisma.settings.upsert({
    where: { id: 'global' },
    update: { exchangeRate: parseFloat(req.body.rate) },
    create: { id: 'global', exchangeRate: parseFloat(req.body.rate) }
  });
  res.json({ data: settings });
});

module.exports = app;
