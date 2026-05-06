// Mock API using LocalStorage for testing - V3
const getStorage = (key, defaultVal = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Generic CRUD helpers
const updateItem = (key, id, newData) => {
  const items = getStorage(key);
  const index = items.findIndex(i => i.id === id);
  if (index > -1) {
    items[index] = { ...items[index], ...newData, updatedAt: new Date().toISOString() };
    setStorage(key, items);
    return items[index];
  }
  return null;
};

const deleteItem = (key, id) => {
  const items = getStorage(key);
  const filtered = items.filter(i => i.id !== id);
  setStorage(key, filtered);
  return true;
};

// Products
export const getProducts = () => Promise.resolve({ data: getStorage('products') });
export const addProduct = (data) => {
  const products = getStorage('products');
  const newProduct = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
  setStorage('products', [...products, newProduct]);
  return Promise.resolve({ data: newProduct });
};
export const editProduct = (id, data) => Promise.resolve({ data: updateItem('products', id, data) });
export const removeProduct = (id) => Promise.resolve({ data: deleteItem('products', id) });

// Transactions
export const getTransactions = () => Promise.resolve({ data: getStorage('transactions') });
export const addTransaction = (data) => {
  const transactions = getStorage('transactions');
  const newTransaction = { ...data, id: Date.now().toString(), date: data.date || new Date().toISOString() };
  setStorage('transactions', [...transactions, newTransaction]);
  return Promise.resolve({ data: newTransaction });
};
export const editTransaction = (id, data) => Promise.resolve({ data: updateItem('transactions', id, data) });
export const removeTransaction = (id) => Promise.resolve({ data: deleteItem('transactions', id) });

// Invoices
export const getInvoices = () => Promise.resolve({ data: getStorage('invoices') });
export const addInvoice = (data) => {
  const invoices = getStorage('invoices');
  const newInvoice = { ...data, id: Date.now().toString(), date: new Date().toISOString() };
  setStorage('invoices', [...invoices, newInvoice]);
  return Promise.resolve({ data: newInvoice });
};
export const removeInvoice = (id) => Promise.resolve({ data: deleteItem('invoices', id) });

// Shipments
export const getShipments = () => Promise.resolve({ data: getStorage('shipments') });
export const addShipment = (data) => {
  const shipments = getStorage('shipments');
  const newShipment = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
  setStorage('shipments', [...shipments, newShipment]);
  return Promise.resolve({ data: newShipment });
};
export const removeShipment = (id) => Promise.resolve({ data: deleteItem('shipments', id) });

// Customers
export const getCustomers = () => Promise.resolve({ data: getStorage('customers') });
export const addCustomer = (data) => {
  const customers = getStorage('customers');
  const newCustomer = { ...data, id: Date.now().toString() };
  setStorage('customers', [...customers, newCustomer]);
  return Promise.resolve({ data: newCustomer });
};
export const removeCustomer = (id) => Promise.resolve({ data: deleteItem('customers', id) });

// Vendors
export const getVendors = () => Promise.resolve({ data: getStorage('vendors') });
export const addVendor = (data) => {
  const vendors = getStorage('vendors');
  const newVendor = { ...data, id: Date.now().toString() };
  setStorage('vendors', [...vendors, newVendor]);
  return Promise.resolve({ data: newVendor });
};

export const getExchangeRate = () => Promise.resolve({ data: getStorage('exchange-rate', { rate: 3.3 }) });
export const updateExchangeRate = (rate) => {
  setStorage('exchange-rate', { rate });
  return Promise.resolve({ data: { rate } });
};

export default {
  getProducts, addProduct, editProduct, removeProduct,
  getTransactions, addTransaction, editTransaction, removeTransaction,
  getInvoices, addInvoice, removeInvoice,
  getShipments, addShipment, removeShipment,
  getCustomers, addCustomer, removeCustomer,
  getVendors, addVendor,
  getExchangeRate, updateExchangeRate
};
