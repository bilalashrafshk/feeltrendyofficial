// Vercel / Neon API Utility - V4
const BASE_URL = ''; // Relative URLs for Vercel

const request = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error('API request failed');
  return response.json();
};

// Products
export const getProducts = () => request('/api/products');
export const addProduct = (data) => request('/api/products', { method: 'POST', body: JSON.stringify(data) });
export const editProduct = (id, data) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const removeProduct = (id) => request(`/api/products/${id}`, { method: 'DELETE' });

// Transactions
export const getTransactions = () => request('/api/transactions');
export const addTransaction = (data) => request('/api/transactions', { method: 'POST', body: JSON.stringify(data) });
export const editTransaction = (id, data) => request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const removeTransaction = (id) => request(`/api/transactions/${id}`, { method: 'DELETE' });

// Invoices
export const getInvoices = () => request('/api/invoices');
export const addInvoice = (data) => request('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
export const removeInvoice = (id) => request(`/api/invoices/${id}`, { method: 'DELETE' });

// Shipments
export const getShipments = () => request('/api/shipments');
export const addShipment = (data) => request('/api/shipments', { method: 'POST', body: JSON.stringify(data) });
export const removeShipment = (id) => request(`/api/shipments/${id}`, { method: 'DELETE' });

// Customers
export const getCustomers = () => request('/api/customers');
export const addCustomer = (data) => request('/api/customers', { method: 'POST', body: JSON.stringify(data) });

// Vendors
export const getVendors = () => request('/api/vendors');
export const addVendor = (data) => request('/api/vendors', { method: 'POST', body: JSON.stringify(data) });

// Settings
export const getExchangeRate = () => request('/api/settings').then(res => ({ data: { rate: res.data.exchangeRate } }));
export const updateExchangeRate = (rate) => request('/api/settings', { method: 'PUT', body: JSON.stringify({ rate }) });

export default {
  getProducts, addProduct, editProduct, removeProduct,
  getTransactions, addTransaction, editTransaction, removeTransaction,
  getInvoices, addInvoice, removeInvoice,
  getShipments, addShipment, removeShipment,
  getCustomers, addCustomer,
  getVendors, addVendor,
  getExchangeRate, updateExchangeRate
};
