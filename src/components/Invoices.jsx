import React, { useState, useEffect } from 'react';
import { getInvoices, addInvoice, removeInvoice, getProducts, getTransactions, addTransaction, addCustomer, getCustomers, editProduct } from '../api';
import { Plus, Trash2, Download, Image as ImageIcon, X, FileText, User, Calendar, CreditCard, ShoppingBag, ChevronRight, Calculator, Printer } from 'lucide-react';
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
        newItems[index].productName = product.name;
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

      // 2. Upsert Customer
      await addCustomer({ name: formData.customerName });

      // 3. Create Transaction
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

      // 4. Update Inventory
      for (const item of formData.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, product.stockInHand - item.quantity);
          await editProduct(product.id, { ...product, stockInHand: newStock });
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
    if (confirm("Delete this invoice record?")) {
      await removeInvoice(id);
      fetchData();
    }
  };

  const exportAsImage = async (id) => {
    const element = document.getElementById(`invoice-render-${id}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: '#0b0f19',
        scale: 3,
        useCORS: true,
        logging: false
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `FeelTrendy-Invoice-${id.substring(0,8)}.png`;
      link.click();
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export invoice. Please try again.");
    }
  };

  const totalBilling = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div className="invoices-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Sales Invoices</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Professional billing & stock management</p>
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
                <label>Customer Name</label>
                <input type="text" list="customer-list" placeholder="Customer name..." value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
                <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div className="form-group">
                <label>Advance Received (PKR)</label>
                <input type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} />
              </div>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <label style={{margin: 0}}>Line Items</label>
                <button type="button" className="btn btn-outline" onClick={addItem} style={{fontSize: '0.8rem', padding: '0.4rem 1rem'}}><Plus size={14} /> Add Product</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {formData.items.map((item, index) => (
                  <div key={index} className="glass-card" style={{padding: '1.25rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '1.5rem', alignItems: 'end', background: 'rgba(255,255,255,0.02)'}}>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Product</label>
                      <select value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)} required>
                        <option value="">Choose item...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Rs. {p.pricePKR})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Qty</label>
                      <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Price</label>
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value))} required />
                    </div>
                    <button type="button" className="btn" style={{padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none'}} onClick={() => removeItem(index)}><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', padding: '1.5rem', background: 'var(--panel-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
               <div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700'}}>TOTAL BILLING</p>
                  <h2 style={{fontSize: '1.5rem', fontWeight: '900'}}>Rs. {totalBilling.toLocaleString()}</h2>
               </div>
               <button type="submit" className="btn btn-primary" style={{padding: '1rem 3rem', fontSize: '1rem'}}>Generate Invoice</button>
            </div>
          </form>
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '3rem'}}>
        {invoices.map(inv => (
          <div key={inv.id} style={{position: 'relative'}}>
            {/* The Hidden High-Res Render Target for Export */}
            <div id={`invoice-render-${inv.id}`} style={{
              width: '800px', 
              padding: '60px', 
              background: '#0b0f19', 
              color: 'white', 
              fontFamily: 'Inter, sans-serif',
              position: 'fixed',
              top: '-9999px',
              left: '-9999px'
            }}>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '60px', borderBottom: '2px solid var(--primary-accent)', paddingBottom: '30px'}}>
                  <div>
                    <h1 style={{fontSize: '3rem', fontWeight: '900', color: 'var(--primary-accent)', marginBottom: '5px'}}>FEEL TRENDY</h1>
                    <p style={{fontSize: '1rem', color: '#8b8b8b'}}>Business Invoice & Statement</p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <h2 style={{fontSize: '1.5rem', fontWeight: '800'}}>INVOICE</h2>
                    <p style={{color: '#8b8b8b'}}>ID: #{inv.id.substring(0,8).toUpperCase()}</p>
                    <p style={{color: '#8b8b8b'}}>{new Date(inv.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>

               <div style={{marginBottom: '50px'}}>
                  <p style={{fontSize: '0.9rem', color: '#8b8b8b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px'}}>Bill To:</p>
                  <h3 style={{fontSize: '1.75rem', fontWeight: '800'}}>{inv.customerName}</h3>
               </div>

               <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '50px'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #333', textAlign: 'left'}}>
                      <th style={{padding: '15px 0', color: '#8b8b8b'}}>Item Description</th>
                      <th style={{padding: '15px 0', color: '#8b8b8b'}}>Qty</th>
                      <th style={{padding: '15px 0', color: '#8b8b8b'}}>Price</th>
                      <th style={{padding: '15px 0', color: '#8b8b8b', textAlign: 'right'}}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inv.items || []).map((item, i) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <tr key={i} style={{borderBottom: '1px solid #222'}}>
                          <td style={{padding: '20px 0', fontWeight: '600'}}>{prod ? prod.name : 'Unknown Product'}</td>
                          <td style={{padding: '20px 0'}}>{item.quantity}</td>
                          <td style={{padding: '20px 0'}}>Rs. {item.unitPrice.toLocaleString()}</td>
                          <td style={{padding: '20px 0', textAlign: 'right', fontWeight: '700'}}>Rs. {(item.quantity * item.unitPrice).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>

               <div style={{marginLeft: 'auto', width: '350px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
                    <span style={{color: '#8b8b8b'}}>Subtotal:</span>
                    <span>Rs. {inv.totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
                    <span style={{color: '#8b8b8b'}}>Advance Paid:</span>
                    <span style={{color: '#10b981', fontWeight: '700'}}>Rs. {inv.advanceAmount.toLocaleString()}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderTop: '2px solid var(--primary-accent)', marginTop: '10px', fontSize: '1.25rem', fontWeight: '900'}}>
                    <span>Amount Due:</span>
                    <span style={{color: 'var(--primary-accent)'}}>Rs. {(inv.totalAmount - inv.advanceAmount).toLocaleString()}</span>
                  </div>
               </div>
            </div>

            {/* The Visual Card UI */}
            <div className="glass-panel" style={{padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column'}}>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                  <div style={{background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem', borderRadius: '0.8rem'}}>
                    <FileText size={20} color="var(--primary-accent)" />
                  </div>
                  <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800'}}>#{inv.id.substring(0,8).toUpperCase()}</span>
               </div>
               
               <h4 style={{fontSize: '1.1rem', fontWeight: '900', marginBottom: '1rem'}}>{inv.customerName}</h4>
               
               <div style={{flex: 1, marginBottom: '1.5rem'}}>
                  <div style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase'}}>Line Items</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {(inv.items || []).map((item, i) => {
                       const prod = products.find(p => p.id === item.productId);
                       return (
                         <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                            <span style={{color: 'var(--text-secondary)'}}>{item.quantity}x {prod ? prod.name : 'Item'}</span>
                            <span style={{fontWeight: '600'}}>Rs. {(item.quantity * item.unitPrice).toLocaleString()}</span>
                         </div>
                       );
                    })}
                  </div>
               </div>

               <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <p style={{fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700'}}>DUE BALANCE</p>
                    <p style={{fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary-accent)'}}>Rs. {(inv.totalAmount - inv.advanceAmount).toLocaleString()}</p>
                  </div>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => exportAsImage(inv.id)}><Download size={16} /></button>
                    <button className="btn btn-outline" style={{padding: '0.5rem', color: 'var(--danger-color)'}} onClick={() => deleteInvoice(inv.id)}><Trash2 size={16} /></button>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Invoices;
