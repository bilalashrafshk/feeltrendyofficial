import React, { useState, useEffect } from 'react';
import { getExchangeRate, updateExchangeRate } from '../api';
import { Settings as SettingsIcon, Database, RefreshCw, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [rate, setRate] = useState(3.3);
  
  useEffect(() => {
    getExchangeRate().then(res => setRate(res.data.rate || 3.3));
  }, []);

  const handleUpdate = async () => {
    try {
      await updateExchangeRate(rate);
      alert("Base exchange rate updated successfully!");
    } catch (err) {
      alert("Failed to update rate");
    }
  };

  const handleReset = () => {
    if (confirm("CRITICAL ACTION: This will delete ALL data (Invoices, Products, Transactions) from your browser. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="settings glass-panel">
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem'}}>
        <SettingsIcon size={24} color="var(--primary)" />
        <h2>Global Settings</h2>
      </div>

      <div style={{maxWidth: '600px'}}>
        <div style={{marginBottom: '3rem'}}>
          <h4>Currency Defaults</h4>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
            Set the default exchange rate for new inventory items. Transaction-specific rates can still be set manually.
          </p>
          <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
            <div style={{flex: 1}}>
              <label style={{fontSize: '0.8rem'}}>1 Indian Rupee (INR) = ? Pakistani Rupee (PKR)</label>
              <input 
                type="number" 
                value={rate} 
                onChange={e => setRate(parseFloat(e.target.value))}
                step="0.01"
                style={{width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '0.5rem', background: 'var(--bg)', color: 'white', border: '1px solid var(--glass-border)'}}
              />
            </div>
            <button className="btn btn-primary" onClick={handleUpdate} style={{padding: '0.75rem 1.5rem'}}>
              <RefreshCw size={16} /> Update Base Rate
            </button>
          </div>
        </div>

        <div style={{borderTop: '1px solid var(--glass-border)', paddingTop: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1rem'}}>
            <AlertTriangle size={20} />
            <h4>System Maintenance</h4>
          </div>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
            Use this to clear all testing data and start fresh. This action cannot be undone.
          </p>
          <button className="btn" style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.75rem 1.5rem'}} onClick={handleReset}>
            Delete All Local Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
