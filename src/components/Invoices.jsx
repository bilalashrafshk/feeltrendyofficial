import React, { useState, useEffect } from 'react';
import { getInvoices, addInvoice, removeInvoice, getProducts, getTransactions, addTransaction, addCustomer, getCustomers, editProduct, addProduct, editInvoice } from '../api';
import { Plus, Trash2, Download, Image as ImageIcon, X, FileText, User, Calendar, CreditCard, ShoppingBag, ChevronRight, Calculator, Printer, ChevronDown, ChevronUp, Package, Tag } from 'lucide-react';
import html2canvas from 'html2canvas';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
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
      items: [...formData.items, { productName: '', productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'productName') {
      const product = products.find(p => p.name === value);
      if (product) {
        newItems[index].productId = product.id;
        newItems[index].unitPrice = product.pricePKR;
      } else {
        newItems[index].productId = ''; // New product indicator
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
      const processedItems = [];
      
      // 1. Handle New Products (On-the-fly registration)
      for (const item of formData.items) {
        let pId = item.productId;
        if (!pId && item.productName) {
          const newProd = await addProduct({
            name: item.productName,
            costAmount: 0,
            costRate: 1.0,
            saleRate: 1.0,
            pricePKR: item.unitPrice,
            stockInHand: 0
          });
          pId = newProd.data.id;
        }
        processedItems.push({ ...item, productId: pId });
      }

      const total = processedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
      
      // 2. Create Invoice
      const invRes = await addInvoice({
        customerName: formData.customerName,
        items: processedItems,
        totalAmount: total,
        advanceAmount: parseFloat(formData.advanceAmount || 0),
        exchangeRate: parseFloat(formData.exchangeRate || 1)
      });

      // 3. Upsert Customer
      await addCustomer({ name: formData.customerName });

      // 4. Create Transaction
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

      // 5. Update Inventory (Decrement Stock)
      for (const item of processedItems) {
        const product = products.find(p => p.id === item.productId) || (await getProducts()).data.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(-100, product.stockInHand - item.quantity); // Allow some negative if just sold
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
        useCORS: true
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `Invoice-${id.substring(0,8)}.png`;
      link.click();
    } catch (err) {
      alert("Export failed");
    }
  };

  const totalBilling = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div className="invoices-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Sales Management</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Billing, Inventory Sync & Automated Ledgers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{padding: '0.8rem 1.5rem', borderRadius: '1rem'}}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Create Invoice'}
        </button>
      </header>

      {showForm && (
        <div className="glass-panel" style={{marginBottom: '3rem', padding: '2.5rem', border: '1px solid var(--primary-accent)'}}>
          <h3 style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800'}}>New Billing Invoice</h3>
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem'}}>
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" list="customer-list" placeholder="Search or new customer..." value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
                <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div className="form-group">
                <label>Advance Payment (PKR)</label>
                <input type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} />
              </div>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <label style={{margin: 0}}>Products Sold</label>
                <button type="button" className="btn btn-outline" onClick={addItem} style={{fontSize: '0.8rem', padding: '0.4rem 1rem'}}><Plus size={14} /> Add Item</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {formData.items.map((item, index) => (
                  <div key={index} className="glass-card" style={{padding: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '1.5rem', alignItems: 'end', background: 'rgba(255,255,255,0.02)'}}>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Product (Search or Type New)</label>
                      <input 
                        type="text" 
                        list="product-list" 
                        placeholder="Item name..." 
                        value={item.productName} 
                        onChange={e => updateItem(index, 'productName', e.target.value)} 
                        required 
                      />
                      <datalist id="product-list">
                        {products.map(p => <option key={p.id} value={p.name} />)}
                      </datalist>
                    </div>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Qty</label>
                      <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{margin: 0}}>
                      <label style={{fontSize: '0.7rem'}}>Unit Price</label>
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value))} required />
                    </div>
                    <button type="button" className="btn" style={{padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none'}} onClick={() => removeItem(index)}><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', padding: '1.5rem', background: 'var(--panel-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
               <div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700'}}>BILL TOTAL</p>
                  <h2 style={{fontSize: '1.5rem', fontWeight: '900'}}>Rs. {totalBilling.toLocaleString()}</h2>
               </div>
               <button type="submit" className="btn btn-primary" style={{padding: '1rem 3rem', fontSize: '1rem'}}>Save & Sync Ledger</button>
            </div>
          </form>
        </div>
      )}

      {/* Expandable Invoice List View */}
      <div className="glass-panel" style={{padding: '0', overflow: 'hidden'}}>
        <div className="table-container">
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{textAlign: 'left', borderBottom: '1px solid var(--border-color)'}}>
                <th style={{padding: '1.5rem'}}>Customer</th>
                <th style={{padding: '1.5rem'}}>Date</th>
                <th style={{padding: '1.5rem'}}>Items</th>
                <th style={{padding: '1.5rem', textAlign: 'right'}}>Total Bill</th>
                <th style={{padding: '1.5rem', textAlign: 'right'}}>Receivable</th>
                <th style={{padding: '1.5rem', textAlign: 'center'}}>Expand</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const isExpanded = expandedId === inv.id;
                const due = inv.totalAmount - inv.advanceAmount;
                return (
                  <React.Fragment key={inv.id}>
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)} 
                      style={{
                        cursor: 'pointer', 
                        background: isExpanded ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                      className="invoice-row"
                    >
                      <td style={{padding: '1.5rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          <div style={{background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem', borderRadius: '0.75rem'}}>
                            <User size={16} color="var(--primary-accent)" />
                          </div>
                          <span style={{fontWeight: '700'}}>{inv.customerName}</span>
                        </div>
                      </td>
                      <td style={{padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{new Date(inv.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</td>
                      <td style={{padding: '1.5rem', color: 'var(--text-secondary)'}}>{inv.items?.length || 0} Products</td>
                      <td style={{padding: '1.5rem', textAlign: 'right', fontWeight: '600'}}>Rs. {inv.totalAmount.toLocaleString()}</td>
                      <td style={{padding: '1.5rem', textAlign: 'right', fontWeight: '800', color: due > 0 ? 'var(--primary-accent)' : 'var(--success-color)'}}>
                        Rs. {due.toLocaleString()}
                      </td>
                      <td style={{padding: '1.5rem', textAlign: 'center'}}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" style={{padding: '2.5rem', background: 'rgba(11, 15, 25, 0.5)', borderBottom: '2px solid var(--primary-accent)'}}>
                           <div style={{display: 'flex', gap: '3rem', flexWrap: 'wrap'}}>
                              {/* Professional Bill View */}
                              <div id={`invoice-render-${inv.id}`} className="glass-panel" style={{width: '500px', padding: '2.5rem', background: '#0b0f19', border: '1px solid #333'}}>
                                 <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem'}}>
                                    <h4 style={{fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary-accent)'}}>FEEL TRENDY</h4>
                                    <div style={{textAlign: 'right', fontSize: '0.7rem', color: '#888'}}>
                                      <p>INV #{inv.id.substring(0,8).toUpperCase()}</p>
                                      <p>{new Date(inv.date).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                                 <div style={{marginBottom: '1.5rem'}}>
                                    <p style={{fontSize: '0.65rem', color: '#888', fontWeight: '800', marginBottom: '0.25rem'}}>BILL TO</p>
                                    <p style={{fontWeight: '700'}}>{inv.customerName}</p>
                                 </div>
                                 <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem'}}>
                                    {(inv.items || []).map((item, i) => {
                                      const p = products.find(prod => prod.id === item.productId);
                                      return (
                                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem'}}>
                                          <span>{item.quantity}x {p ? p.name : 'Unknown Product'}</span>
                                          <span style={{fontWeight: '600'}}>Rs. {(item.quantity * item.unitPrice).toLocaleString()}</span>
                                        </div>
                                      );
                                    })}
                                 </div>
                                 <div style={{borderTop: '1px solid var(--primary-accent)', paddingTop: '1rem'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                      <span style={{color: '#888'}}>Total Bill:</span>
                                      <span>Rs. {inv.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                      <span style={{color: '#888'}}>Advance:</span>
                                      <span style={{color: 'var(--success-color)'}}>Rs. {inv.advanceAmount.toLocaleString()}</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: '900', fontSize: '1.1rem'}}>
                                      <span>Due:</span>
                                      <span style={{color: 'var(--primary-accent)'}}>Rs. {due.toLocaleString()}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Controls */}
                              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center'}}>
                                 <button className="btn btn-primary" style={{width: '100%', padding: '1rem 2rem'}} onClick={() => exportAsImage(inv.id)}>
                                   <Download size={18} /> Download Bill PNG
                                 </button>
                                 <button className="btn btn-outline" style={{width: '100%', padding: '1rem 2rem', color: 'var(--danger-color)'}} onClick={() => deleteInvoice(inv.id)}>
                                   <Trash2 size={18} /> Delete Record
                                 </button>
                                 <div style={{background: 'var(--panel-bg)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginTop: '1rem'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                                       <Calculator size={20} color="var(--primary-accent)" />
                                       <span style={{fontWeight: '700'}}>Internal Stats</span>
                                    </div>
                                    <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>This invoice has been synced to the ledger as a **RECEIVABLE** transaction.</p>
                                 </div>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
