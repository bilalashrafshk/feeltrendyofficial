import React, { useState, useEffect, useRef } from 'react';
import { 
  getInvoices, 
  addInvoice, 
  removeInvoice,
  getProducts, 
  addProduct, 
  getCustomers, 
  addCustomer,
  addTransaction,
  getExchangeRate
} from '../api';
import { Plus, ChevronDown, ChevronUp, Download, Image as ImageIcon, Search, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [viewCurrency, setViewCurrency] = useState('PKR');
  const invoiceRef = useRef(null);

  const [formData, setFormData] = useState({
    customerName: '',
    items: [],
    advanceAmount: 0,
    exchangeRate: 3.3 // Default, will be updated from global
  });

  const formatValue = (val, rate) => {
    if (viewCurrency === 'INR') {
      return `₹${Math.round(val / (rate || 3.3)).toLocaleString()}`;
    }
    return `Rs. ${Math.round(val).toLocaleString()}`;
  };

  const fetchData = async () => {
    try {
      const [invRes, prodRes, custRes, rateRes] = await Promise.all([
        getInvoices(), 
        getProducts(),
        getCustomers(),
        getExchangeRate()
      ]);
      setInvoices(invRes.data);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
      setFormData(prev => ({ ...prev, exchangeRate: rateRes.data.rate }));
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
      items: [...formData.items, { productName: '', productId: '', quantity: 1, price: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // If selecting existing product
    if (field === 'productId' && value) {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].productName = prod.name;
        newItems[index].price = prod.pricePKR;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = (items = formData.items) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = calculateTotal();
    
    try {
      // 1. Auto-create Customer if doesn't exist
      const existingCust = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());
      if (!existingCust) {
        await addCustomer({ name: formData.customerName });
      }

      // 2. Auto-create Products if they are new (no productId)
      const processedItems = await Promise.all(formData.items.map(async item => {
        if (!item.productId) {
          const newProd = await addProduct({ 
            name: item.productName, 
            pricePKR: item.price,
            stockInHand: 0 
          });
          return { ...item, productId: newProd.data.id };
        }
        return item;
      }));

      // 3. Save Invoice
      const invData = {
        ...formData,
        items: processedItems,
        totalAmount: total,
      };
      await addInvoice(invData);

      // 4. Create Receivable Transaction
      await addTransaction({
        type: 'RECEIVABLE',
        entityName: formData.customerName,
        amount: total,
        advanceAmount: parseFloat(formData.advanceAmount || 0),
        description: `Invoice for ${formData.customerName}`,
        currency: 'PKR',
        status: total <= formData.advanceAmount ? 'PAID' : 'PENDING'
      });

      setShowForm(false);
      setFormData({ customerName: '', items: [], advanceAmount: 0, exchangeRate: formData.exchangeRate });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error generating invoice");
    }
  };

  const exportAsImage = async (id) => {
    const element = document.getElementById(`invoice-detail-${id}`);
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#0f172a' });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = `Invoice-${id.slice(-4)}.png`;
    link.click();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm("Delete this invoice? This will NOT delete the associated ledger entry automatically.")) {
      await removeInvoice(id);
      fetchData();
    }
  };

  return (
    <div className="invoices glass-panel">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div>
          <h2>Invoice History</h2>
          <div style={{display: 'flex', gap: '0.25rem', marginTop: '0.5rem'}}>
            <button className={`btn ${viewCurrency === 'PKR' ? 'btn-primary' : ''}`} style={{padding: '0.2rem 0.6rem', fontSize: '0.7rem'}} onClick={() => setViewCurrency('PKR')}>PKR</button>
            <button className={`btn ${viewCurrency === 'INR' ? 'btn-primary' : ''}`} style={{padding: '0.2rem 0.6rem', fontSize: '0.7rem'}} onClick={() => setViewCurrency('INR')}>INR</button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{marginBottom: '2rem', background: 'var(--glass)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--primary)'}}>
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem'}}>Customer Name (Auto-creates if new)</label>
            <input 
              type="text" 
              list="customers-list"
              value={formData.customerName} 
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              style={{width: '100%', padding: '0.6rem', marginTop: '0.5rem'}}
              required
            />
            <datalist id="customers-list">
              {customers.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
          
          <div style={{marginBottom: '1rem'}}>
            <label style={{marginBottom: '0.5rem', display: 'block'}}>Line Items</label>
            <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600'}}>
              <div style={{flex: 2}}>Product Details</div>
              <div style={{flex: 0.5}}>Qty</div>
              <div style={{flex: 1}}>Price (PKR)</div>
            </div>
            <div style={{marginTop: '0.5rem'}}>
              {formData.items.map((item, idx) => (
                <div key={idx} style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                  <div style={{flex: 2}}>
                    <input 
                      type="text" 
                      placeholder="Product Name (or select below)"
                      value={item.productName}
                      onChange={e => updateItem(idx, 'productName', e.target.value)}
                      style={{width: '100%', padding: '0.5rem'}}
                    />
                    <select 
                      value={item.productId} 
                      onChange={e => updateItem(idx, 'productId', e.target.value)}
                      style={{width: '100%', padding: '0.3rem', fontSize: '0.75rem', marginTop: '0.2rem'}}
                    >
                      <option value="">-- Existing Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Rs. {p.pricePKR})</option>)}
                    </select>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Qty"
                    value={item.quantity} 
                    onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                    style={{flex: 0.5, padding: '0.5rem'}}
                  />
                  <input 
                    type="number" 
                    placeholder="Price"
                    value={item.price} 
                    onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))}
                    style={{flex: 1, padding: '0.5rem'}}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="btn" style={{background: 'var(--glass-border)', fontSize: '0.8rem', marginTop: '0.5rem'}}>+ Add Line</button>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem'}}>
            <div>
              <label>Advance Payment</label>
              <input 
                type="number" 
                value={formData.advanceAmount} 
                onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
                style={{width: '200px', padding: '0.5rem', display: 'block', marginTop: '0.5rem'}}
              />
            </div>
            <div style={{textAlign: 'right'}}>
              <h3 style={{color: 'var(--primary)'}}>Total: Rs. {calculateTotal().toLocaleString()}</h3>
              <p style={{color: 'var(--text-muted)'}}>Due: Rs. {(calculateTotal() - formData.advanceAmount).toLocaleString()}</p>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1.5rem', padding: '1rem'}}>Confirm & Generate Invoice</button>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <React.Fragment key={inv.id}>
                <tr onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)} style={{cursor: 'pointer'}}>
                  <td style={{color: 'var(--primary)', fontWeight: '600'}}>INV-{inv.id.slice(-4)}</td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td>{inv.customerName}</td>
                  <td>Rs. {inv.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${(inv.totalAmount - inv.advanceAmount) <= 0 ? 'badge-success' : 'badge-warning'}`}>
                      {(inv.totalAmount - inv.advanceAmount) <= 0 ? 'Paid' : 'Balance'}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                      {expandedId === inv.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      <button className="btn" style={{padding: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)'}} onClick={(e) => handleDelete(e, inv.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === inv.id && (
                  <tr>
                    <td colSpan="6" style={{padding: '0'}}>
                      <div id={`invoice-detail-${inv.id}`} className="glass-panel" style={{margin: '1rem', border: '1px solid var(--glass-border)', padding: '2rem'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
                          <div>
                            <h2 style={{color: 'var(--primary)'}}>FEELTRENDY</h2>
                            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Official Business Invoice</p>
                          </div>
                          <div style={{textAlign: 'right'}}>
                            <h3>INVOICE</h3>
                            <p>#INV-{inv.id.slice(-4)}</p>
                            <p>{new Date(inv.date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div style={{marginBottom: '2rem'}}>
                          <p style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>BILLED TO:</p>
                          <h4 style={{fontSize: '1.2rem'}}>{inv.customerName}</h4>
                        </div>

                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                          <thead style={{background: 'var(--glass)'}}>
                            <tr>
                              <th style={{padding: '1rem'}}>Item Description</th>
                              <th style={{padding: '1rem'}}>Qty</th>
                              <th style={{padding: '1rem'}}>Price</th>
                              <th style={{padding: '1rem'}}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.items.map((item, i) => (
                              <tr key={i}>
                                <td style={{padding: '1rem'}}>{item.productName}</td>
                                <td style={{padding: '1rem'}}>{item.quantity}</td>
                                <td style={{padding: '1rem'}}>Rs. {item.price.toLocaleString()}</td>
                                <td style={{padding: '1rem'}}>Rs. {(item.quantity * item.price).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'flex-end'}}>
                           <div style={{width: '300px'}}>
                              <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0'}}>
                                <span>Subtotal</span>
                                <span>Rs. {inv.totalAmount.toLocaleString()}</span>
                              </div>
                              <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--success)'}}>
                                <span>Advance Paid</span>
                                <span>Rs. {inv.advanceAmount.toLocaleString()}</span>
                              </div>
                              <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--glass-border)', fontWeight: '700', fontSize: '1.2rem', marginTop: '0.5rem'}}>
                                <span>Balance Due</span>
                                <span>Rs. {(inv.totalAmount - inv.advanceAmount).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        <div style={{marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                           Thank you for your business!
                        </div>

                        <div className="no-print" style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                           <button className="btn btn-primary" onClick={() => exportAsImage(inv.id)}><ImageIcon size={16} /> Export as Image</button>
                           <button className="btn" style={{background: 'var(--glass-border)'}} onClick={() => window.print()}><Download size={16} /> Print PDF</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
