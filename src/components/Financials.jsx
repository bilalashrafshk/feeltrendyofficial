import React, { useState, useEffect } from 'react';
import { 
  getTransactions, 
  addTransaction, 
  editTransaction, 
  removeTransaction,
  getCustomers,
  addCustomer,
  getVendors,
  addVendor
} from '../api';
import { Plus, Filter, User, Briefcase, Search, Edit2, Trash2, X, Check, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Financials = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'PAYABLE',
    entryType: 'BILL',
    amount: '',
    advanceAmount: '',
    description: '',
    currency: 'PKR',
    status: 'PENDING',
    exchangeRate: '',
    entityName: ''
  });

  const fetchData = async () => {
    try {
      const [transRes, custRes, vendRes] = await Promise.all([
        getTransactions(),
        getCustomers(),
        getVendors()
      ]);
      setTransactions(transRes.data);
      setCustomers(custRes.data);
      setVendors(vendRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.currency === 'INR' && !formData.exchangeRate) {
        alert("Please apply an exchange rate for this INR transaction to proceed.");
        return;
      }
      const rate = formData.currency === 'PKR' ? 1.0 : parseFloat(formData.exchangeRate || 3.3);
      if (isNaN(rate)) {
        alert("Invalid exchange rate. Please enter a number.");
        return;
      }
      const amount = parseFloat(formData.amount || 0);
      const advance = parseFloat(formData.advanceAmount || 0);
      
      const finalAmount = formData.currency === 'INR' ? (amount * rate) : amount;
      const finalAdvance = formData.currency === 'INR' ? (advance * rate) : advance;

      const payload = {
        type: formData.type,
        entityName: formData.entityName,
        description: formData.description,
        amount: formData.entryType === 'PAYMENT' ? 0 : finalAmount,
        advanceAmount: formData.entryType === 'PAYMENT' ? finalAmount : finalAdvance,
        exchangeRate: rate,
        status: formData.status,
        currency: 'PKR'
      };

      const nameKey = (formData.entityName || '').trim();
      if (nameKey) {
        if (formData.type === 'PAYABLE') {
          const exists = (vendors || []).find(v => (v.name || '').toLowerCase() === nameKey.toLowerCase());
          if (!exists) await addVendor({ name: nameKey });
        } else {
          const exists = (customers || []).find(c => (c.name || '').toLowerCase() === nameKey.toLowerCase());
          if (!exists) await addCustomer({ name: nameKey });
        }
      }

      if (editingId) {
        await editTransaction(editingId, payload);
      } else {
        await addTransaction(payload);
      }

      setShowForm(false);
      setFormData({ type: 'PAYABLE', entryType: 'BILL', amount: '', advanceAmount: '', description: '', currency: 'PKR', status: 'PENDING', exchangeRate: '3.3', entityName: '' });
      fetchData();
    } catch (err) {
      console.error("Save Transaction Error:", err);
      alert(`Error saving transaction: ${err.message || "Please check connection"}`);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setFormData({
      type: t.type,
      amount: t.amount,
      advanceAmount: t.advanceAmount,
      description: t.description,
      currency: 'PKR',
      status: t.status,
      exchangeRate: t.exchangeRate || '3.3',
      entityName: t.entityName,
      entryType: t.amount === 0 ? 'PAYMENT' : 'BILL'
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this transaction permanently?")) {
      await removeTransaction(id);
      fetchData();
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.entityName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || 
                        (filterType === 'CUSTOMER' && t.type === 'RECEIVABLE') ||
                        (filterType === 'VENDOR' && t.type === 'PAYABLE');
    return matchesSearch && matchesType;
  });

  return (
    <div className="financials-container">
      {/* Header Section */}
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Financial Ledgers</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Track payments and receivables</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{padding: '0.8rem 1.5rem', borderRadius: '1rem'}}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </header>

      {/* Control Bar */}
      {!showForm && (
        <div style={{display: 'flex', gap: '1rem', marginBottom: '2.5rem', alignItems: 'center'}}>
          <div style={{flex: 1, position: 'relative'}}>
            <Search size={18} style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
            <input 
              type="text" 
              placeholder="Search by name or description..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', fontSize: '1rem', fontWeight: '500', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'}}
            />
          </div>
          <div style={{display: 'flex', background: 'var(--panel-bg)', padding: '0.4rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)', gap: '0.25rem'}}>
            <button className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterType('ALL')} style={{border: 'none', padding: '0.6rem 1.2rem'}}>All</button>
            <button className={`btn ${filterType === 'VENDOR' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterType('VENDOR')} style={{border: 'none', padding: '0.6rem 1.2rem'}}><Briefcase size={16} /> Vendors</button>
            <button className={`btn ${filterType === 'CUSTOMER' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterType('CUSTOMER')} style={{border: 'none', padding: '0.6rem 1.2rem'}}><User size={16} /> Customers</button>
          </div>
        </div>
      )}

      {/* Entry Form */}
      {showForm && (
        <div className="glass-panel" style={{marginBottom: '3rem', padding: '2.5rem', border: '1px solid var(--primary-accent)'}}>
          <h3 style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800'}}>{editingId ? 'Edit Entry' : 'Create New Transaction'}</h3>
          <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem'}}>
            <div className="form-group">
              <label>Transaction Category</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="PAYABLE">Vendor Entry (Payable)</option>
                <option value="RECEIVABLE">Customer Entry (Receivable)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Action Type</label>
              <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                <button type="button" className={`btn ${formData.entryType === 'BILL' ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1}} onClick={() => setFormData({...formData, entryType: 'BILL'})}>Invoice / Bill</button>
                <button type="button" className={`btn ${formData.entryType === 'PAYMENT' ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1}} onClick={() => setFormData({...formData, entryType: 'PAYMENT'})}>Cash Transfer</button>
              </div>
            </div>
            <div className="form-group">
              <label>{formData.type === 'PAYABLE' ? 'Vendor' : 'Customer'} Name</label>
              <input type="text" list="entities-list" placeholder="Select or type..." value={formData.entityName} onChange={e => setFormData({...formData, entityName: e.target.value})} required />
              <datalist id="entities-list">
                {(formData.type === 'PAYABLE' ? vendors : customers).map(e => <option key={e.id} value={e.name} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Currency Mode</label>
              <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                <button type="button" className={`btn ${formData.currency === 'PKR' ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1}} onClick={() => setFormData({...formData, currency: 'PKR'})}>PKR</button>
                <button type="button" className={`btn ${formData.currency === 'INR' ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1}} onClick={() => setFormData({...formData, currency: 'INR'})}>INR</button>
              </div>
            </div>
            <div className="form-group">
              <label>Description / Note</label>
              <input type="text" placeholder="e.g. Batch #42 purchase" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{formData.entryType === 'PAYMENT' ? 'Amount Received/Paid' : 'Total Amount'} ({formData.currency})</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            </div>
            {formData.currency === 'INR' && (
              <div className="form-group">
                <label>Manual Exchange Rate</label>
                <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} />
              </div>
            )}
            {formData.entryType === 'BILL' && (
              <div className="form-group">
                <label>Upfront Advance ({formData.currency})</label>
                <input type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} />
              </div>
            )}
            {formData.currency === 'INR' && (
              <div style={{gridColumn: '1 / -1', background: 'rgba(168, 85, 247, 0.05)', padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-accent)', fontWeight: '700'}}>
                <Info size={18} /> PKR Equivalent: {formData.exchangeRate ? `Rs. ${Math.round(parseFloat(formData.amount || 0) * parseFloat(formData.exchangeRate)).toLocaleString()}` : 'Enter Rate to Calculate'}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', padding: '1rem', fontSize: '1rem'}}>
              {editingId ? 'Save Changes' : 'Confirm & Save Transaction'}
            </button>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="glass-panel" style={{padding: '0', overflow: 'hidden'}}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Party</th>
                <th>Description</th>
                <th style={{textAlign: 'right'}}>Total</th>
                <th style={{textAlign: 'right'}}>Settled</th>
                <th style={{textAlign: 'right'}}>Balance</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => {
                const balance = t.amount - t.advanceAmount;
                return (
                  <tr key={t.id}>
                    <td style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem'}}>
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: t.type === 'PAYABLE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {t.type === 'PAYABLE' ? <Briefcase size={14} color="var(--warning-color)" /> : <User size={14} color="var(--primary-accent)" />}
                        </div>
                        <span style={{fontWeight: '700'}}>{t.entityName}</span>
                      </div>
                    </td>
                    <td style={{color: 'var(--text-secondary)', fontStyle: t.description ? 'normal' : 'italic'}}>{t.description || 'No notes'}</td>
                    <td style={{textAlign: 'right', fontWeight: '600'}}>Rs. {t.amount.toLocaleString()}</td>
                    <td style={{textAlign: 'right', color: 'var(--success-color)', fontWeight: '600'}}>Rs. {t.advanceAmount.toLocaleString()}</td>
                    <td style={{textAlign: 'right'}}>
                      <span style={{
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '0.5rem', 
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        background: t.type === 'PAYABLE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: t.type === 'PAYABLE' ? 'var(--danger-color)' : 'var(--success-color)'
                      }}>
                        Rs. {Math.abs(balance).toLocaleString()}
                      </span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                        <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={() => startEdit(t)}><Edit2 size={14} /></button>
                        <button className="btn btn-outline" style={{padding: '0.4rem', color: 'var(--danger-color)'}} onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div style={{padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
              <Search size={48} style={{opacity: 0.1, marginBottom: '1rem'}} />
              <p>No transactions found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financials;
