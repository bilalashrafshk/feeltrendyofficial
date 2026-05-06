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
    costRate: '',
    saleRate: '',
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
      const cRate = parseFloat(formData.costRate || 1);
      const sRate = parseFloat(formData.saleRate || 1);
      const amount = parseFloat(formData.costAmount || 0);
      const ship = parseFloat(formData.shippingChargesPKR || 0);
      
      if (!formData.costRate || !formData.saleRate) {
        alert("Please apply both Cost Rate and Sale Rate to proceed.");
        return;
      }

      const payload = {
        name: formData.name,
        sku: formData.sku,
        stockInHand: parseInt(formData.stockInHand || 0),
        stockOnRoute: parseInt(formData.stockOnRoute || 0),
        costAmount: amount,
        costCurrency: formData.costCurrency,
        costRate: cRate,
        saleRate: sRate,
        shippingChargesPKR: ship,
        pricePKR: amount * sRate
      };

      if (editingId) {
        await editProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', stockInHand: '', stockOnRoute: '', costAmount: '', costCurrency: 'INR', costRate: '', saleRate: '', shippingChargesPKR: '' });
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
      costRate: p.costRate,
      saleRate: p.saleRate,
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

  return (
    <div className="inventory-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.75px', marginBottom: '0.25rem'}}>Inventory Control</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500'}}>Track estimated sales & net profit margins</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{padding: '0.8rem 1.5rem', borderRadius: '1rem'}}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </header>

      {showForm && (
        <div className="glass-panel" style={{marginBottom: '3rem', padding: '2.5rem', border: '1px solid var(--primary-accent)'}}>
          <h3 style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800'}}>{editingId ? 'Update Stock Item' : 'Register New Product'}</h3>
          <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem'}}>
            <div className="form-group" style={{gridColumn: '1 / -1'}}>
              <label>Product Identity</label>
              <div style={{position: 'relative'}}>
                <Tag size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                <input type="text" list="existing-products" placeholder="e.g. Silk Hijab Blue" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{paddingLeft: '2.5rem'}} required />
              </div>
            </div>
            
            <div className="form-group">
               <label>Base Cost Currency</label>
               <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                 {['INR', 'PKR', 'USD'].map(curr => (
                   <button key={curr} type="button" className={`btn ${formData.costCurrency === curr ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1, padding: '0.5rem', fontSize: '0.75rem'}} onClick={() => setFormData({...formData, costCurrency: curr, costRate: curr === 'PKR' ? '1.0' : formData.costRate})}>
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
              <label>Cost Rate (Actual Purchase)</label>
              <input type="number" step="0.01" value={formData.costRate} onChange={e => setFormData({...formData, costRate: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Sale Rate (Market Pricing)</label>
              <input type="number" step="0.01" value={formData.saleRate} onChange={e => setFormData({...formData, saleRate: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Estimated Shipping (PKR)</label>
              <div style={{position: 'relative'}}>
                <Truck size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                <input type="number" placeholder="Total shipping for batch" value={formData.shippingChargesPKR} onChange={e => setFormData({...formData, shippingChargesPKR: e.target.value})} style={{paddingLeft: '2.5rem'}} />
              </div>
            </div>

            <div className="form-group">
              <label>Available Stock</label>
              <input type="number" value={formData.stockInHand} onChange={e => setFormData({...formData, stockInHand: e.target.value})} />
            </div>

            <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
                <div style={{background: 'rgba(239, 68, 68, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{background: 'var(--danger-color)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                    <TrendingDown size={20} color="white" />
                  </div>
                  <div>
                      <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700'}}>LANDED + SHIP</p>
                      <p style={{fontSize: '1.1rem', fontWeight: '800'}}>Rs. {Math.round((parseFloat(formData.costAmount || 0) * parseFloat(formData.costRate || 0)) + parseFloat(formData.shippingChargesPKR || 0)).toLocaleString()}</p>
                  </div>
                </div>

                <div style={{background: 'rgba(168, 85, 247, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{background: 'var(--primary-accent)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                    <DollarSign size={20} color="white" />
                  </div>
                  <div>
                      <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700'}}>EST. SALE PRICE</p>
                      <p style={{fontSize: '1.1rem', fontWeight: '800'}}>Rs. {Math.round(parseFloat(formData.costAmount || 0) * parseFloat(formData.saleRate || 0)).toLocaleString()}</p>
                  </div>
                </div>

                <div style={{background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--success-color)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{background: 'var(--success-color)', padding: '0.6rem', borderRadius: '0.75rem'}}>
                    <TrendingUp size={20} color="white" />
                  </div>
                  <div>
                      <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700'}}>EST. NET PROFIT</p>
                      <p style={{fontSize: '1.1rem', fontWeight: '800'}}>Rs. {Math.round((parseFloat(formData.costAmount || 0) * parseFloat(formData.saleRate || 0)) - ((parseFloat(formData.costAmount || 0) * parseFloat(formData.costRate || 0)) + parseFloat(formData.shippingChargesPKR || 0))).toLocaleString()}</p>
                  </div>
                </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', padding: '1rem', fontSize: '1rem'}}>
              {editingId ? 'Update Profit Profile' : 'Add to Inventory'}
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
                <th>Landed</th>
                <th>Shipping</th>
                <th style={{color: 'var(--primary-accent)'}}>Est. Sale</th>
                <th style={{color: 'var(--success-color)', textAlign: 'right'}}>Est. Profit</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const landed = p.costAmount * p.costRate;
                const shipping = p.shippingChargesPKR || 0;
                const totalExp = landed + shipping;
                const estSale = p.costAmount * p.saleRate;
                const estProfit = estSale - totalExp;
                
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
                    <td>
                      <span style={{padding: '0.3rem 0.6rem', borderRadius: '0.4rem', background: p.stockInHand > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: p.stockInHand > 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '700', fontSize: '0.8rem'}}>
                        {p.stockInHand}
                      </span>
                    </td>
                    <td style={{color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600'}}>Rs. {Math.round(landed).toLocaleString()}</td>
                    <td style={{color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600'}}>Rs. {Math.round(shipping).toLocaleString()}</td>
                    <td style={{color: 'var(--primary-accent)', fontWeight: '800'}}>Rs. {Math.round(estSale).toLocaleString()}</td>
                    <td style={{textAlign: 'right'}}>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <span style={{fontWeight: '900', color: estProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}}>
                          Rs. {Math.round(estProfit).toLocaleString()}
                        </span>
                        <span style={{fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700'}}>
                          {Math.round((estProfit / totalExp) * 100)}% ROI
                        </span>
                      </div>
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
