import React, { useState, useEffect } from 'react';
import { 
  getTransactions, 
  addTransaction, 
  editTransaction, 
  removeTransaction,
  getCustomers,
  getVendors
} from '../api';
import { Plus, Filter, User, Briefcase, Search, Edit2, Trash2, X, Check } from 'lucide-react';

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
    exchangeRate: '3.3',
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
      const rate = parseFloat(formData.exchangeRate || 3.3);
      const amount = parseFloat(formData.amount || 0);
      const advance = parseFloat(formData.advanceAmount || 0);
      
      // Convert to PKR if input was INR
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
        currency: 'PKR' // We always store in PKR for uniform ledger tracking
      };

      // Auto-create entity if new
      if (formData.type === 'PAYABLE') {
        const exists = vendors.find(v => v.name.toLowerCase() === formData.entityName.toLowerCase());
        if (!exists) await addVendor({ name: formData.entityName });
      } else {
        const exists = customers.find(c => c.name.toLowerCase() === formData.entityName.toLowerCase());
        if (!exists) await addCustomer({ name: formData.entityName });
      }

      if (editingId) {
        await editTransaction(editingId, payload);
      } else {
        await addTransaction(payload);
      }

      setShowForm(false);
      setFormData({ type: 'PAYABLE', amount: '', advanceAmount: '', description: '', currency: 'PKR', status: 'PENDING', exchangeRate: '', entityName: '' });
      fetchData();
    } catch (err) {
      alert("Error saving transaction");
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setFormData({
      type: t.type,
      amount: t.amount,
      advanceAmount: t.advanceAmount,
      description: t.description,
      currency: t.currency,
      status: t.status,
      exchangeRate: t.exchangeRate || '',
      entityName: t.entityName
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
    <div className="financials glass-panel">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2>Financial Ledgers</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </div>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap'}}>
        <div style={{flex: 1, minWidth: '200px', position: 'relative'}}>
          <Search size={16} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
          <input 
            type="text" 
            placeholder="Search customer or vendor name..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.75rem', background: 'var(--bg)', color: 'white', border: '1px solid var(--glass-border)', fontSize: '0.9rem'}}
          />
        </div>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button className={`btn ${filterType === 'ALL' ? 'btn-primary' : ''}`} style={{background: filterType === 'ALL' ? '' : 'var(--glass-border)'}} onClick={() => setFilterType('ALL')}>All Transactions</button>
          <button className={`btn ${filterType === 'VENDOR' ? 'btn-primary' : ''}`} style={{background: filterType === 'VENDOR' ? '' : 'var(--glass-border)'}} onClick={() => setFilterType('VENDOR')}><Briefcase size={14} /> Vendors</button>
          <button className={`btn ${filterType === 'CUSTOMER' ? 'btn-primary' : ''}`} style={{background: filterType === 'CUSTOMER' ? '' : 'var(--glass-border)'}} onClick={() => setFilterType('CUSTOMER')}><User size={14} /> Customers</button>
        </div>
      </div>

      {searchTerm && (
        <div className="stat-card" style={{marginBottom: '2rem', background: 'rgba(192, 132, 252, 0.05)', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <span className="stat-label">Statement for: <strong style={{color: 'white'}}>{searchTerm}</strong></span>
            <div className="stat-value" style={{fontSize: '1.5rem', marginTop: '0.25rem'}}>
              PKR {filteredTransactions.reduce((acc, t) => acc + (t.amount - t.advanceAmount), 0).toLocaleString()}
            </div>
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Total Balance Due</span>
          </div>
          <div style={{textAlign: 'right'}}>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Transactions: {filteredTransactions.length}</p>
            <p style={{fontSize: '0.8rem', color: 'var(--success)'}}>Total Paid: PKR {filteredTransactions.reduce((acc, t) => acc + t.advanceAmount, 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--glass)', padding: '1.5rem', borderRadius: '1rem', border: editingId ? '1px solid var(--primary)' : 'none'}}>
          <div style={{gridColumn: '1 / -1', marginBottom: '0.5rem', fontWeight: '700'}}>
             {editingId ? 'Edit Transaction' : 'New Transaction Entry'}
          </div>
          <div>
            <label>Transaction Type</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}}>
              <option value="PAYABLE">Vendor Entry (Payable)</option>
              <option value="RECEIVABLE">Customer Entry (Receivable)</option>
            </select>
          </div>
          <div>
            <label>Entry Type</label>
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
               <button type="button" className={`btn ${formData.entryType === 'BILL' ? 'btn-primary' : ''}`} style={{flex: 1, fontSize: '0.8rem', background: formData.entryType === 'BILL' ? '' : 'var(--glass-border)'}} onClick={() => setFormData({...formData, entryType: 'BILL'})}>Bill / Purchase</button>
               <button type="button" className={`btn ${formData.entryType === 'PAYMENT' ? 'btn-primary' : ''}`} style={{flex: 1, fontSize: '0.8rem', background: formData.entryType === 'PAYMENT' ? '' : 'var(--glass-border)'}} onClick={() => setFormData({...formData, entryType: 'PAYMENT'})}>Payment / Collection</button>
            </div>
          </div>
          <div>
            <label>{formData.type === 'PAYABLE' ? 'Vendor Name' : 'Customer Name'}</label>
            <input 
              type="text" 
              list="entities-list"
              placeholder="Select or type new..." 
              value={formData.entityName} 
              onChange={e => setFormData({...formData, entityName: e.target.value})} 
              style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} 
            />
            <datalist id="entities-list">
              {(formData.type === 'PAYABLE' ? vendors : customers).map(e => <option key={e.id} value={e.name} />)}
            </datalist>
          </div>
          <div>
            <label>Currency</label>
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
               <button type="button" className={`btn ${formData.currency === 'PKR' ? 'btn-primary' : ''}`} style={{flex: 1, fontSize: '0.8rem', background: formData.currency === 'PKR' ? '' : 'var(--glass-border)'}} onClick={() => setFormData({...formData, currency: 'PKR'})}>PKR</button>
               <button type="button" className={`btn ${formData.currency === 'INR' ? 'btn-primary' : ''}`} style={{flex: 1, fontSize: '0.8rem', background: formData.currency === 'INR' ? '' : 'var(--glass-border)'}} onClick={() => setFormData({...formData, currency: 'INR'})}>INR (Purchase)</button>
            </div>
          </div>
          <div>
            <label>Description</label>
            <input type="text" placeholder="e.g. Batch #42 Purchase" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
          </div>
          <div>
            <label>{formData.entryType === 'PAYMENT' ? 'Payment' : 'Amount'} ({formData.currency})</label>
            <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} required />
          </div>
          {formData.currency === 'INR' && (
            <div>
              <label>Exchange Rate</label>
              <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
            </div>
          )}
          {formData.entryType === 'BILL' && (
            <div>
              <label>Advance Paid ({formData.currency})</label>
              <input type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
            </div>
          )}
          {formData.currency === 'INR' && (
            <div style={{gridColumn: '1 / -1', color: 'var(--success)', fontSize: '0.85rem'}}>
               <Info size={14} /> Converted to PKR: Rs. {Math.round(parseFloat(formData.amount || 0) * parseFloat(formData.exchangeRate || 3.3)).toLocaleString()}
            </div>
          )}
          {formData.type === 'PAYABLE' && (
            <div>
              <label>Exchange Rate</label>
              <input type="number" placeholder={globalRate} value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
             {editingId ? 'Update Entry' : 'Add Transaction'}
          </button>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Entity</th>
              <th>Description</th>
              <th>Total (PKR)</th>
              <th>Paid/Advance</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{fontWeight: '600'}}>{t.entityName || 'N/A'}</td>
                <td>{t.description}</td>
                <td>Rs. {t.amount.toLocaleString()}</td>
                <td style={{color: 'var(--success)'}}>Rs. {t.advanceAmount.toLocaleString()}</td>
                <td style={{fontWeight: '700', color: (t.amount - t.advanceAmount) > 0 ? 'var(--danger)' : 'var(--success)'}}>
                  Rs. {(t.amount - t.advanceAmount).toLocaleString()}
                </td>
                <td>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn" style={{padding: '0.3rem', background: 'var(--glass-border)'}} onClick={() => startEdit(t)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn" style={{padding: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)'}} onClick={() => handleDelete(t.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financials;
