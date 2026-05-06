import React, { useState, useEffect, useRef } from 'react';
import { getTransactions, getCustomers, getVendors } from '../api';
import { Search, Image as ImageIcon, User, Briefcase, ChevronRight } from 'lucide-react';
import html2canvas from 'html2canvas';

const Statements = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewCurrency, setViewCurrency] = useState('PKR');
  const statementRef = useRef(null);

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

  const getPartyBalance = (name) => {
    return transactions
      .filter(t => t.entityName === name)
      .reduce((acc, t) => acc + (t.amount - t.advanceAmount), 0);
  };

  const filteredParties = [...customers, ...vendors]
    .map(p => ({ ...p, balance: getPartyBalance(p.name) }))
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.balance - a.balance);

  const partyTransactions = transactions
    .filter(t => t.entityName === selectedParty?.name)
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
    link.download = `Statement-${selectedParty?.name || 'General'}.png`;
    link.click();
  };

  return (
    <div className="statements" style={{display: 'flex', gap: '1.5rem', height: 'calc(100vh - 120px)'}}>
      {/* Sidebar List */}
      <div className="glass-panel" style={{width: '350px', display: 'flex', flexDirection: 'column', padding: '1.5rem'}}>
        <div style={{marginBottom: '1.5rem'}}>
          <h3>Parties Directory</h3>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Select a customer or vendor</p>
        </div>
        
        <div style={{position: 'relative', marginBottom: '1rem'}}>
          <Search size={16} style={{position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
          <input 
            type="text" 
            placeholder="Search parties..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', fontSize: '0.85rem'}}
          />
        </div>

        <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem'}}>
          {filteredParties.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedParty(p)}
              className="glass-card"
              style={{
                padding: '1rem', 
                cursor: 'pointer', 
                border: selectedParty?.id === p.id ? '1px solid var(--primary)' : '1px solid transparent',
                background: selectedParty?.id === p.id ? 'rgba(192, 132, 252, 0.1)' : 'var(--glass)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  {customers.find(c => c.id === p.id) ? <User size={16} color="var(--primary)" /> : <Briefcase size={16} color="var(--warning)" />}
                  <span style={{fontWeight: '600', fontSize: '0.9rem'}}>{p.name}</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
              <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: p.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '700'}}>
                {p.balance > 0 ? `Receivable: Rs. ${p.balance.toLocaleString()}` : `Payable: Rs. ${Math.abs(p.balance).toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View */}
      <div style={{flex: 1, overflowY: 'auto'}}>
        {!selectedParty ? (
          <div className="glass-panel" style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)'}}>
            <User size={64} style={{opacity: 0.2, marginBottom: '1.5rem'}} />
            <h3>Select a Party</h3>
            <p>Choose a customer or vendor from the directory to view their detailed statement.</p>
          </div>
        ) : (
          <div className="statement-content">
            <div className="glass-panel" style={{marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <div>
                 <h2 style={{margin: 0}}>{selectedParty.name}</h2>
                 <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Account Statement & Trailing Balance</p>
               </div>
               <div style={{display: 'flex', gap: '1rem'}}>
                  <div style={{display: 'flex', gap: '0.25rem', background: 'var(--glass-border)', padding: '0.25rem', borderRadius: '0.5rem'}}>
                    <button className={`btn ${viewCurrency === 'PKR' ? 'btn-primary' : ''}`} style={{padding: '0.3rem 0.8rem', fontSize: '0.7rem'}} onClick={() => setViewCurrency('PKR')}>PKR</button>
                    <button className={`btn ${viewCurrency === 'INR' ? 'btn-primary' : ''}`} style={{padding: '0.3rem 0.8rem', fontSize: '0.7rem'}} onClick={() => setViewCurrency('INR')}>INR</button>
                  </div>
                  <button className="btn btn-primary" onClick={exportAsImage}>
                    <ImageIcon size={16} /> Export as Image
                  </button>
               </div>
            </div>

            <div ref={statementRef} className="glass-panel" style={{padding: '3rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem'}}>
                <div>
                  <h1 style={{color: 'var(--primary)', margin: 0}}>STATEMENT</h1>
                  <p style={{color: 'var(--text-muted)'}}>FeelTrendy Business Operations</p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <h2 style={{margin: 0}}>{selectedParty.name.toUpperCase()}</h2>
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
                      return partyTransactions.map(t => {
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
                      {formatValue(partyTransactions.reduce((acc, t) => acc + (t.amount - t.advanceAmount), 0), partyTransactions[partyTransactions.length - 1]?.exchangeRate)}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statements;
