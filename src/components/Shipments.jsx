import React, { useState, useEffect } from 'react';
import { getShipments, addShipment } from '../api';
import { Plus, Truck, Clock, CheckCircle } from 'lucide-react';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    trackingNumber: '',
    status: 'IN_TRANSIT',
    expectedArrival: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const res = await getShipments();
      setShipments(res.data);
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
      await addShipment(formData);
      setShowForm(false);
      setFormData({ trackingNumber: '', status: 'IN_TRANSIT', expectedArrival: '', notes: '' });
      fetchData();
    } catch (err) {
      alert("Error registering shipment");
    }
  };

  return (
    <div className="shipments glass-panel">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2>Import Logistics</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Track New Shipment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--glass)', padding: '1.5rem', borderRadius: '1rem'}}>
          <div>
            <label>Tracking Number / ID</label>
            <input type="text" value={formData.trackingNumber} onChange={e => setFormData({...formData, trackingNumber: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} required />
          </div>
          <div>
            <label>ETA (Estimated Arrival)</label>
            <input type="date" value={formData.expectedArrival} onChange={e => setFormData({...formData, expectedArrival: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem'}} />
          </div>
          <div style={{gridColumn: '1 / -1'}}>
            <label>Internal Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem', minHeight: '80px'}} placeholder="Items included, courier details etc." />
          </div>
          <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>Save Logistics Entry</button>
        </form>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
        {shipments.map(s => (
          <div key={s.id} className="stat-card" style={{border: '1px solid var(--glass-border)', position: 'relative'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
               <span style={{fontWeight: '700', color: 'var(--primary)'}}>{s.trackingNumber || 'UNTRACKED'}</span>
               <span className={`badge ${s.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>
                 {s.status === 'DELIVERED' ? <CheckCircle size={12}/> : <Clock size={12}/>} {s.status.replace('_', ' ')}
               </span>
            </div>
            <p style={{fontSize: '0.9rem', marginBottom: '0.5rem'}}>{s.notes}</p>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem'}}>
               <span>ETA: {s.expectedArrival ? new Date(s.expectedArrival).toLocaleDateString() : 'N/A'}</span>
               <span>Log: {new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {shipments.length === 0 && (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
            No shipments currently in transit.
          </div>
        )}
      </div>
    </div>
  );
};

export default Shipments;
