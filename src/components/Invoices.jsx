import React, { useState, useEffect } from 'react';
import { getInvoices, addInvoice, removeInvoice, getProducts, getTransactions, addTransaction, addCustomer, getCustomers } from '../api';
import { Plus, Trash2, Download, Image as ImageIcon, X, FileText, User, Calendar, CreditCard, ShoppingBag, ChevronRight, Calculator } from 'lucide-react';
import html2canvas from 'html2canvas';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    items: [],
    advanceAmount: 0,
    exchangeRate: 1.0
  });

  const fetchData = async () => {
    try {
      const [invRes, prodRes, custRes] = await Promise.all([getInvoices(), getProducts(), getCustomers()]);
      setInvoices(invRes.data);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = product.pricePKR;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
      
      // 1. Create Invoice
      const invRes = await addInvoice({
        customerName: formData.customerName,
        items: formData.items,
        totalAmount: total,
        advanceAmount: parseFloat(formData.advanceAmount || 0),
        exchangeRate: parseFloat(formData.exchangeRate || 1)
      });

      // 2. Upsert Customer (Handled by backend V4)
      await addCustomer({ name: formData.customerName });

      // 3. Create Receivable Transaction for Ledger
      await addTransaction({
        type: 'RECEIVABLE',
        entityName: formData.customerName,
        amount: total,
        advanceAmount: parseFloat(formData.advanceAmount || 0),
        description: `Invoice #${invRes.data.id.substring(0,6)}`,
        exchangeRate: parseFloat(formData.exchangeRate || 1),
        currency: 'PKR',
        status: total <= formData.advanceAmount ? 'PAID' : 'PENDING'
      });

      // 4. Update Inventory Stock Levels
      for (const item of formData.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, product.stockInHand - item.quantity);
          await editProduct(product.id, { 
            ...product, 
            stockInHand: newStock 
          });
        }
      }

      setShowForm(false);
      setFormData({ customerName: '', items: [], advanceAmount: 0, exchangeRate: 1.0 });
      fetchData();
    } catch (err) {
      console.error("Invoice Error:", err);
      alert(`Error generating invoice: ${err.message}`);
    }
  };

  const deleteInvoice = async (id) => {
    if (confirm("Delete this invoice record? (Note: This won't delete the ledger transaction)")) {
      await removeInvoice(id);
      fetchData();
    }
  };

  const exportAsImage = async (id) => {
    const element = document.getElementById(`invoice-card-${id}`);
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#0b0f19', scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = `Invoice-${id.substring(0,8)}.png`;
    link.click();
  };

  const totalBilling = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div className="invoices-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Sales Invoices</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Multi-item billing & ledger synchronization</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{padding: '0.8rem 1.5rem', borderRadius: '1rem'}}>
          {showForm ? <X size={18} /> : <FileText size={18} />} {showForm ? 'Cancel' : 'Create Invoice'}
        </button>
      </header>

      {showForm && (
        <div className="glass-panel" style={{marginBottom: '3rem', padding: '2.5rem', border: '1px solid var(--primary-accent)'}}>
          <h3 style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800'}}>New Billing Invoice</h3>
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem'}}>
              <div className="form-group">
                <label>Customer Identity</label>
                <div style={{position: 'relative'}}>
                  <User size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                  <input 
                    type="text" 
                    list="customer-list"
                    placeholder="Search or enter customer..." 
                    value={formData.customerName} 
                    onChange={e => setFormData({...formData, customerName: e.target.value})} 
                    style={{paddingLeft: '2.5rem'}}
                    required 
                  />
                  <datalist id="customer-list">
                    {customers.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>
              <div className="form-group">
                <label>Advance Received (PKR)</label>
                <div style={{position: 'relative'}}>
                   <CreditCard size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                   <input 
                     type="number" 
                     value={formData.advanceAmount} 
                     onChange={e => setFormData({...formData, advanceAmount: e.target.value})} 
                     style={{paddingLeft: '2.5rem'}}
                   />
                </div>
              </div>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <label style={{margin: 0}}>Itemized Breakdown</label>
                <button type="button" className="btn btn-outline" onClick={addItem} style={{fontSize: '0.8rem', padding: '0.4rem 1rem'}}>
                  <Plus size={14} /> Add Product
                </button>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {formData.items.map((item, index) => (
                  <div key={index} className="glass-card" style={{padding: '1.25rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '1.5rem', alignItems: 'end', background: 'rgba(255,255,255,0.02)'}}>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Select Product</label>
                      <select value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)} required>
                        <option value="">Choose item...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Rs. {p.pricePKR.toLocaleString()})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Qty</label>
                      <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Unit Price</label>
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value))} required />
                    </div>
                    <button type="button" className="btn" style={{padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none'}} onClick={() => removeItem(index)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', padding: '1.5rem', background: 'var(--panel-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
               <div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700'}}>TOTAL BILLING</p>
                  <h2 style={{fontSize: '1.5rem', fontWeight: '900'}}>Rs. {totalBilling.toLocaleString()}</h2>
               </div>
               <button type="submit" className="btn btn-primary" style={{padding: '1rem 3rem', fontSize: '1rem'}}>
                 Generate & Sync Ledger
               </button>
            </div>
          </form>
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem'}}>
        {invoices.map(inv => (
          <div key={inv.id} id={`invoice-card-${inv.id}`} className="glass-panel" style={{padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{background: 'rgba(139, 92, 246, 0.1)', padding: '0.75rem', borderRadius: '1rem'}}>
                <ShoppingBag size={24} color="var(--primary-accent)" />
              </div>
              <div style={{textAlign: 'right'}}>
                <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800'}}>INV #{inv.id.substring(0,8).toUpperCase()}</span>
                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem'}}>{new Date(inv.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div>
              <h4 style={{fontSize: '1.25rem', fontWeight: '900', marginBottom: '0.5rem'}}>{inv.customerName}</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Total Amount:</span>
                  <span style={{fontWeight: '700'}}>Rs. {inv.totalAmount.toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Advance Paid:</span>
                  <span style={{fontWeight: '700', color: 'var(--success-color)'}}>Rs. {inv.advanceAmount.toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)'}}>
                  <span style={{fontWeight: '800'}}>Receivable:</span>
                  <span style={{fontWeight: '900', color: 'var(--primary-accent)'}}>Rs. {(inv.totalAmount - inv.advanceAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: '0.5rem', marginTop: 'auto'}}>
              <button className="btn btn-outline" style={{flex: 1, padding: '0.6rem'}} onClick={() => exportAsImage(inv.id)}>
                <Download size={14} /> Download PNG
              </button>
              <button className="btn btn-outline" style={{padding: '0.6rem', color: 'var(--danger-color)'}} onClick={() => deleteInvoice(inv.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Invoices;
