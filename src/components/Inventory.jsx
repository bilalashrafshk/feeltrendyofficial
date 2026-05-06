import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, editProduct, removeProduct } from '../api';
import { Plus, Info, Edit2, Trash2, X, Package, Tag, Archive, Truck, DollarSign, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    stockInHand: '',
    stockOnRoute: '',
    costAmount: '',
    costCurrency: 'INR',
    exchangeRate: '',
    expectedSalePrice: '',
    shippingChargesPKR: ''
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
      const rate = parseFloat(formData.exchangeRate || 1);
      const amount = parseFloat(formData.costAmount || 0);
      const ship = parseFloat(formData.shippingChargesPKR || 0);
      const sale = parseFloat(formData.expectedSalePrice || 0);
      
      if (!formData.exchangeRate) {
        alert("Please apply an Exchange Rate to proceed.");
        return;
      }

      const payload = {
        name: formData.name,
        sku: formData.sku,
        stockInHand: parseInt(formData.stockInHand || 0),
        stockOnRoute: parseInt(formData.stockOnRoute || 0),
        costAmount: amount,
        costCurrency: formData.costCurrency,
        costRate: rate, // mapping to existing schema field
        saleRate: 0, // unused now but keeping for schema compatibility
        shippingChargesPKR: ship,
        pricePKR: sale // Mapping "Expected Sale Price" to pricePKR in database
      };

      if (editingId) {
        await editProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', stockInHand: '', stockOnRoute: '', costAmount: '', costCurrency: 'INR', exchangeRate: '', expectedSalePrice: '', shippingChargesPKR: '' });
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
      costAmount: p.costAmount,
      costCurrency: p.costCurrency || 'INR',
      exchangeRate: p.costRate,
      expectedSalePrice: p.pricePKR,
      shippingChargesPKR: p.shippingChargesPKR || ''
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

  const calculatedCost = Math.round((parseFloat(formData.costAmount || 0) * parseFloat(formData.exchangeRate || 0)) + parseFloat(formData.shippingChargesPKR || 0));
  const estProfit = Math.round(parseFloat(formData.expectedSalePrice || 0) - calculatedCost);

  return (
    <div className="inventory-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Inventory Control</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Manage costs and profit margins</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{padding: '0.8rem 1.5rem', borderRadius: '1rem'}}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </header>

      {showForm && (
        <div className="glass-panel" style={{marginBottom: '3rem', padding: '2.5rem', border: '1px solid var(--primary-accent)'}}>
          <h3 style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800'}}>{editingId ? 'Edit Stock Profile' : 'New Product Entry'}</h3>
          <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem'}}>
            <div className="form-group" style={{gridColumn: '1 / -1'}}>
              <label>Product Name</label>
              <input type="text" placeholder="e.g. Silk Hijab Blue" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            
            <div className="form-group">
               <label>Base Currency</label>
               <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                 {['INR', 'PKR'].map(curr => (
                   <button key={curr} type="button" className={`btn ${formData.costCurrency === curr ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1, padding: '0.5rem', fontSize: '0.75rem'}} onClick={() => setFormData({...formData, costCurrency: curr, exchangeRate: curr === 'PKR' ? '1.0' : formData.exchangeRate})}>
                     {curr}
                   </button>
                 ))}
               </div>
            </div>

            <div className="form-group">
              <label>Cost Amount ({formData.costCurrency})</label>
              <input type="number" value={formData.costAmount} onChange={e => setFormData({...formData, costAmount: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Exchange Rate</label>
              <input type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Shipping Charges (PKR)</label>
              <input type="number" value={formData.shippingChargesPKR} onChange={e => setFormData({...formData, shippingChargesPKR: e.target.value})} />
            </div>

            <div className="form-group" style={{gridColumn: 'span 2'}}>
              <label>Expected Sale Price (PKR)</label>
              <input type="number" placeholder="Enter flat amount in PKR" value={formData.expectedSalePrice} onChange={e => setFormData({...formData, expectedSalePrice: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Stock Qty</label>
              <input type="number" value={formData.stockInHand} onChange={e => setFormData({...formData, stockInHand: e.target.value})} />
            </div>

            <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
                <div style={{background: 'rgba(239, 68, 68, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{background: 'var(--danger-color)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                    <TrendingDown size={20} color="white" />
                  </div>
                  <div>
                      <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700'}}>TOTAL COST PRICE (PKR)</p>
                      <p style={{fontSize: '1.1rem', fontWeight: '800'}}>Rs. {calculatedCost.toLocaleString()}</p>
                  </div>
                </div>

                <div style={{background: 'rgba(168, 85, 247, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{background: 'var(--primary-accent)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                    <DollarSign size={20} color="white" />
                  </div>
                  <div>
                      <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700'}}>EXPECTED SALE PRICE</p>
                      <p style={{fontSize: '1.1rem', fontWeight: '800'}}>Rs. {parseFloat(formData.expectedSalePrice || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div style={{background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--success-color)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{background: 'var(--success-color)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                    <TrendingUp size={20} color="white" />
                  </div>
                  <div>
                      <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700'}}>EST. PROFIT</p>
                      <p style={{fontSize: '1.1rem', fontWeight: '800'}}>Rs. {estProfit.toLocaleString()}</p>
                  </div>
                </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', padding: '1rem', fontSize: '1rem'}}>
              {editingId ? 'Update Item' : 'Save Item'}
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
                <th>Qty</th>
                <th>Exchange Rate</th>
                <th>Cost Price</th>
                <th style={{color: 'var(--primary-accent)'}}>Expected Sale Price</th>
                <th style={{color: 'var(--success-color)', textAlign: 'right'}}>Est. Profit</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const costPrice = (p.costAmount * p.costRate) + p.shippingChargesPKR;
                const estProfit = p.pricePKR - costPrice;
                
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                         <div style={{background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                           <Package size={16} color="var(--primary-accent)" />
                         </div>
                         <div>
                           <div style={{fontWeight: '700'}}>{p.name}</div>
                           <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>{p.costAmount} {p.costCurrency} Base</div>
                         </div>
                      </div>
                    </td>
                    <td>{p.stockInHand}</td>
                    <td style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{p.costRate}</td>
                    <td style={{fontWeight: '600', color: 'var(--danger-color)'}}>Rs. {Math.round(costPrice).toLocaleString()}</td>
                    <td style={{color: 'var(--primary-accent)', fontWeight: '800'}}>Rs. {Math.round(p.pricePKR).toLocaleString()}</td>
                    <td style={{textAlign: 'right'}}>
                      <span style={{fontWeight: '900', color: estProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}}>
                        Rs. {Math.round(estProfit).toLocaleString()}
                      </span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                        <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={() => startEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn btn-outline" style={{padding: '0.4rem', color: 'var(--danger-color)'}} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
