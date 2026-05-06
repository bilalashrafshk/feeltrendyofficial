import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, editProduct, removeProduct, getExchangeRate } from '../api';
import { Plus, Info, Edit2, Trash2, X } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(3.3);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    stockInHand: '',
    stockOnRoute: '',
    costINR: '',
  });

  const fetchData = async () => {
    try {
      const [prodRes, rateRes] = await Promise.all([getProducts(), getExchangeRate()]);
      setProducts(prodRes.data);
      setExchangeRate(rateRes.data.rate || 3.3);
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
      const payload = {
        ...formData,
        stockInHand: parseInt(formData.stockInHand || 0),
        stockOnRoute: parseInt(formData.stockOnRoute || 0),
        costINR: parseFloat(formData.costINR || 0),
        pricePKR: parseFloat(formData.costINR || 0) * exchangeRate
      };

      if (editingId) {
        await editProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', stockInHand: '', stockOnRoute: '', costINR: '' });
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
      costINR: p.costINR
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this product from inventory?")) {
      await removeProduct(id);
      fetchData();
    }
  };

  return (
    <div className="inventory glass-panel">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2>Inventory Control</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--glass)', padding: '1.5rem', borderRadius: '1rem', border: editingId ? '1px solid var(--primary)' : 'none'}}>
          <div style={{gridColumn: '1 / -1', fontWeight: '700'}}>{editingId ? 'Edit Product' : 'Register New Product'}</div>
          <div>
            <label>Product Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} required />
          </div>
          <div>
            <label>SKU (Internal)</label>
            <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
          </div>
          <div>
            <label>Stock in Hand</label>
            <input type="number" value={formData.stockInHand} onChange={e => setFormData({...formData, stockInHand: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
          </div>
          <div>
            <label>Stock on Route</label>
            <input type="number" value={formData.stockOnRoute} onChange={e => setFormData({...formData, stockOnRoute: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
          </div>
          <div>
            <label>Base Cost (INR)</label>
            <input type="number" value={formData.costINR} onChange={e => setFormData({...formData, costINR: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem'}}>
            <Info size={14} /> Price in PKR: {Math.round(parseFloat(formData.costINR || 0) * exchangeRate).toLocaleString()}
          </div>
          <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
            {editingId ? 'Update Product' : 'Save to Master List'}
          </button>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Available</th>
              <th>Transit</th>
              <th>Price (PKR)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{fontWeight: '600'}}>{p.name}</td>
                <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{p.sku || '-'}</td>
                <td>{p.stockInHand}</td>
                <td>{p.stockOnRoute || '-'}</td>
                <td style={{color: 'var(--primary)', fontWeight: '600'}}>Rs. {Math.round(p.pricePKR).toLocaleString()}</td>
                <td>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn" style={{padding: '0.3rem', background: 'var(--glass-border)'}} onClick={() => startEdit(p)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn" style={{padding: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)'}} onClick={() => handleDelete(p.id)}>
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

export default Inventory;
