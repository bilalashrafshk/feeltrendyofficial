import React from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';

const Settings = () => {
  const handleResetData = () => {
    if (confirm("WARNING: This will permanently delete ALL data. This cannot be undone. Proceed?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="settings glass-panel">
      <div style={{marginBottom: '2.5rem'}}>
        <h2>System Settings</h2>
        <p style={{color: 'var(--text-muted)'}}>Manage your business configuration and data.</p>
      </div>

      <div style={{marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem'}}>
        <h3 style={{color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
          <ShieldAlert size={20} /> Danger Zone
        </h3>
        <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
          Deleting local data will reset the application to its factory state. All inventory, invoices, and ledgers stored in this browser will be lost.
        </p>
        <button className="btn" style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1.5rem'}} onClick={handleResetData}>
          <Trash2 size={16} /> Delete All Local Data
        </button>
      </div>
    </div>
  );
};

export default Settings;
