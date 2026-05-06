import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, editProduct, removeProduct } from '../api';
import { Plus, Info, Edit2, Trash2, X, Package, Tag, Archive, Truck, DollarSign } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    stockInHand: '',
    stockOnRoute: '',
    costINR: '',
    exchangeRate: '3.3'
  });

  const fetchData = async () => {
    try {
      const prodRes = await getProducts();
      setProducts(prodRes.data);
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
      const cost = parseFloat(formData.costINR || 0);
      
      const payload = {
        name: formData.name,
        sku: formData.sku,
        stockInHand: parseInt(formData.stockInHand || 0),
        stockOnRoute: parseInt(formData.stockOnRoute || 0),
        costINR: cost,
        exchangeRate: rate,
        pricePKR: cost * rate
      };

      if (editingId) {
        await editProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', stockInHand: '', stockOnRoute: '', costINR: '', exchangeRate: '3.3' });
      fetchData();
    } catch (err) {
      alert("Error saving product");
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      sku: p.sku || '',
      stockInHand: p.stockInHand,
      stockOnRoute: p.stockOnRoute,
      costINR: p.costINR,
      exchangeRate: p.exchangeRate || '3.3'
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this product from inventory?")) {
      await removeProduct(id);
      fetchData();
    }
  };

  return (
    <div className="inventory-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Inventory Control</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Manage stock and cross-border costs</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{padding: '0.8rem 1.5rem', borderRadius: '1rem'}}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </header>

      {showForm && (
        <div className="glass-panel" style={{marginBottom: '3rem', padding: '2.5rem', border: editingId ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)'}}>
          <h3 style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800'}}>{editingId ? 'Update Stock Item' : 'Register New Product'}</h3>
          <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem'}}>
            <div className="form-group">
              <label>Product Identity</label>
              <div style={{position: 'relative'}}>
                <Tag size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                <input 
                  type="text" 
                  list="existing-products"
                  placeholder="e.g. Silk Hijab Blue"
                  value={formData.name} 
                  onChange={e => {
                    const existing = products.find(p => p.name === e.target.value);
                    if (existing) {
                      setFormData({
                        ...formData,
                        name: existing.name,
                        sku: existing.sku || '',
                        stockInHand: existing.stockInHand,
                        stockOnRoute: existing.stockOnRoute || '',
                        costINR: existing.costINR,
                        exchangeRate: existing.exchangeRate || '3.3'
                      });
                    } else {
                      setFormData({...formData, name: e.target.value});
                    }
                  }} 
                  style={{paddingLeft: '2.5rem'}}
                  required 
                />
                <datalist id="existing-products">
                  {products.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>
            </div>
            <div className="form-group">
              <label>SKU Number</label>
              <div style={{position: 'relative'}}>
                 <Archive size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                 <input type="text" placeholder="Internal ID" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} style={{paddingLeft: '2.5rem'}} />
              </div>
            </div>
            <div className="form-group">
              <label>Current Stock (In Hand)</label>
              <input type="number" value={formData.stockInHand} onChange={e => setFormData({...formData, stockInHand: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Stock in Transit (On Route)</label>
              <input type="number" value={formData.stockOnRoute} onChange={e => setFormData({...formData, stockOnRoute: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Base Cost (INR)</label>
              <div style={{position: 'relative'}}>
                <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.8rem'}}>₹</span>
                <input type="number" value={formData.costINR} onChange={e => setFormData({...formData, costINR: e.target.value})} style={{paddingLeft: '2.5rem'}} />
              </div>
            </div>
            <div className="form-group">
              <label>Batch Rate (PKR)</label>
              <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} />
            </div>
            
            <div style={{gridColumn: '1 / -1', background: 'rgba(168, 85, 247, 0.05)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
               <div style={{background: 'var(--primary-accent)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                 <DollarSign size={20} color="white" />
               </div>
               <div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700'}}>CALCULATED LANDED PRICE</p>
                  <p style={{fontSize: '1.25rem', fontWeight: '800'}}>Rs. {Math.round(parseFloat(formData.costINR || 0) * parseFloat(formData.exchangeRate || 3.3)).toLocaleString()}</p>
               </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', padding: '1rem', fontSize: '1rem'}}>
              {editingId ? 'Update Stock Profile' : 'Add to Inventory'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{padding: '0', overflow: 'hidden'}}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Stock Item</th>
                <th>SKU</th>
                <th>Available</th>
                <th>In Transit</th>
                <th>Batch Rate</th>
                <th style={{textAlign: 'right'}}>Local Price</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                       <div style={{background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                         <Package size={16} color="var(--primary-accent)" />
                       </div>
                       <span style={{fontWeight: '700'}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600'}}>{p.sku || 'N/A'}</td>
                  <td>
                    <span style={{padding: '0.3rem 0.6rem', borderRadius: '0.4rem', background: p.stockInHand > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: p.stockInHand > 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '700', fontSize: '0.8rem'}}>
                      {p.stockInHand} Units
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                       <Truck size={14} /> {p.stockOnRoute || 0}
                    </div>
                  </td>
                  <td style={{color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600'}}>{p.exchangeRate || '3.3'}</td>
                  <td style={{textAlign: 'right', fontWeight: '800', color: 'var(--primary-accent)'}}>Rs. {Math.round(p.pricePKR).toLocaleString()}</td>
                  <td style={{textAlign: 'center'}}>
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                      <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={() => startEdit(p)}><Edit2 size={14} /></button>
                      <button className="btn btn-outline" style={{padding: '0.4rem', color: 'var(--danger-color)'}} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
