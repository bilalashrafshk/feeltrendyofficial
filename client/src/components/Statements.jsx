import React, { useState, useEffect, useRef } from 'react';
import { getTransactions } from '../api';
import { Search, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

const Statements = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewCurrency, setViewCurrency] = useState('PKR');
  const statementRef = useRef(null);

  useEffect(() => {
    getTransactions().then(res => setTransactions(res.data));
  }, []);

  const filteredTransactions = transactions
    .filter(t => (t.entityName || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formatValue = (val, rate) => {
    if (viewCurrency === 'INR') {
      return `₹${Math.round(val / (rate || 3.3)).toLocaleString()}`;
    }
    return `Rs. ${Math.round(val).toLocaleString()}`;
  };

  const exportAsImage = async () => {
    const element = statementRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#0f172a' });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = `Statement-${searchTerm || 'General'}.png`;
    link.click();
  };

  return (
    <div className="statements">
      <div className="glass-panel" style={{marginBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h2>Customer & Vendor Statements</h2>
           <div style={{display: 'flex', gap: '0.25rem'}}>
            <button className={`btn ${viewCurrency === 'PKR' ? 'btn-primary' : ''}`} style={{padding: '0.3rem 0.8rem', fontSize: '0.8rem'}} onClick={() => setViewCurrency('PKR')}>PKR</button>
            <button className={`btn ${viewCurrency === 'INR' ? 'btn-primary' : ''}`} style={{padding: '0.3rem 0.8rem', fontSize: '0.8rem'}} onClick={() => setViewCurrency('INR')}>INR</button>
          </div>
        </div>
        <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
          <div style={{flex: 1, position: 'relative'}}>
            <Search size={16} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
            <input 
              type="text" 
              placeholder="Enter name to generate statement (e.g. Bilal)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem'}}
            />
          </div>
          <button className="btn btn-primary" onClick={exportAsImage} disabled={!searchTerm}>
            <ImageIcon size={16} /> Export Statement
          </button>
        </div>
      </div>

      {!searchTerm ? (
        <div className="glass-panel" style={{textAlign: 'center', padding: '4rem', color: 'var(--text-muted)'}}>
          <Search size={48} style={{marginBottom: '1rem', opacity: 0.5}} />
          <p>Search for a customer or vendor to view their cumulative trailing balance statement.</p>
        </div>
      ) : (
        <div ref={statementRef} className="glass-panel" style={{padding: '3rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem'}}>
            <div>
              <h1 style={{color: 'var(--primary)', margin: 0}}>STATEMENT</h1>
              <p style={{color: 'var(--text-muted)'}}>FeelTrendy Business Operations</p>
            </div>
            <div style={{textAlign: 'right'}}>
              <h2 style={{margin: 0}}>{searchTerm.toUpperCase()}</h2>
              <p>Period: All Time</p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Currency: {viewCurrency}</p>
            </div>
          </div>

          <div className="table-container">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead style={{background: 'var(--glass)'}}>
                <tr>
                  <th style={{padding: '1rem', textAlign: 'left'}}>Date</th>
                  <th style={{padding: '1rem', textAlign: 'left'}}>Description</th>
                  <th style={{padding: '1rem', textAlign: 'right'}}>Amount</th>
                  <th style={{padding: '1rem', textAlign: 'right'}}>Paid</th>
                  <th style={{padding: '1rem', textAlign: 'right'}}>Trailing Balance</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cumulative = 0;
                  return filteredTransactions.map(t => {
                    const net = t.amount - t.advanceAmount;
                    cumulative += net;
                    const rate = t.exchangeRate || 3.3;
                    return (
                      <tr key={t.id} style={{borderBottom: '1px solid var(--glass-border)'}}>
                        <td style={{padding: '1rem'}}>{new Date(t.date).toLocaleDateString()}</td>
                        <td style={{padding: '1rem'}}>{t.description}</td>
                        <td style={{padding: '1rem', textAlign: 'right'}}>{formatValue(t.amount, rate)}</td>
                        <td style={{padding: '1rem', textAlign: 'right', color: 'var(--success)'}}>{formatValue(t.advanceAmount, rate)}</td>
                        <td style={{padding: '1rem', textAlign: 'right', fontWeight: '700', color: cumulative > 0 ? 'var(--danger)' : 'var(--success)'}}>
                          {formatValue(cumulative, rate)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'flex-end'}}>
             <div className="stat-card" style={{width: '300px', background: 'var(--glass)'}}>
                <span className="stat-label">FINAL BALANCE DUE</span>
                <div className="stat-value" style={{color: 'var(--primary)'}}>
                  {formatValue(filteredTransactions.reduce((acc, t) => acc + (t.amount - t.advanceAmount), 0), filteredTransactions[filteredTransactions.length - 1]?.exchangeRate)}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statements;
