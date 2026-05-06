import React, { useState, useEffect } from 'react';
import { getProducts, getTransactions, getInvoices } from '../api';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck,
  Calendar,
  Filter,
  BarChart2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    monthlySales: 0,
    totalReceivables: 0,
    totalPayables: 0,
    stockInHand: 0,
    stockOnRoute: 0
  });

  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [prodRes, transRes, invRes] = await Promise.all([
        getProducts(), 
        getTransactions(),
        getInvoices()
      ]);
      
      const products = prodRes.data;
      const transactions = transRes.data;
      const invoices = invRes.data;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const getSalesForRange = (start, end) => {
        return invoices
          .filter(inv => {
            const d = new Date(inv.date);
            return d >= start && d < (end || new Date(2100, 0, 1));
          })
          .reduce((acc, inv) => acc + inv.totalAmount, 0);
      };

      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const dailyData = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const sales = invoices
          .filter(inv => new Date(inv.date).toDateString() === d.toDateString())
          .reduce((acc, inv) => acc + inv.totalAmount, 0);
        
        dailyData.push({ name: dateStr, sales });
      }
      setChartData(dailyData);

      setStats({
        todaySales: getSalesForRange(today),
        yesterdaySales: getSalesForRange(yesterday, today),
        monthlySales: getSalesForRange(startOfMonth),
        totalReceivables: transactions.filter(t => t.type === 'RECEIVABLE').reduce((acc, t) => acc + (t.amount - t.advanceAmount), 0),
        totalPayables: transactions.filter(t => t.type === 'PAYABLE').reduce((acc, t) => acc + (t.amount - t.advanceAmount), 0),
        stockInHand: products.reduce((acc, p) => acc + p.stockInHand, 0),
        stockOnRoute: products.reduce((acc, p) => acc + p.stockOnRoute, 0)
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  return (
    <div className="dashboard-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '0.5rem'}}>Performance</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500'}}>Overview of your business operations</p>
        </div>
        
        <div style={{display: 'flex', gap: '0.75rem', background: 'var(--panel-bg)', padding: '0.6rem 1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)'}}>
          <Calendar size={18} style={{color: 'var(--primary-accent)', alignSelf: 'center'}} />
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600', padding: 0}}
            />
            <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '800'}}>→</span>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600', padding: 0}}
            />
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{borderLeft: '4px solid var(--primary-accent)'}}>
          <div className="stat-header">
            <span className="stat-label">Daily Revenue</span>
            <div style={{background: 'rgba(168, 85, 247, 0.1)', padding: '0.5rem', borderRadius: '0.5rem'}}>
              <DollarSign size={18} color="var(--primary-accent)" />
            </div>
          </div>
          <div className="stat-value">Rs. {stats.todaySales.toLocaleString()}</div>
          <div style={{marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: stats.todaySales >= stats.yesterdaySales ? 'var(--success-color)' : 'var(--danger-color)'}}>
            {stats.todaySales >= stats.yesterdaySales ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>Vs Yesterday: Rs. {stats.yesterdaySales.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{borderLeft: '4px solid var(--secondary-accent)'}}>
          <div className="stat-header">
            <span className="stat-label">Net Receivables</span>
            <div style={{background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '0.5rem'}}>
              <TrendingUp size={18} color="var(--secondary-accent)" />
            </div>
          </div>
          <div className="stat-value">Rs. {stats.totalReceivables.toLocaleString()}</div>
          <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontWeight: '600'}}>Awaiting Collection</p>
        </div>

        <div className="stat-card glass-panel" style={{borderLeft: '4px solid var(--danger-color)'}}>
          <div className="stat-header">
            <span className="stat-label">Total Payables</span>
            <div style={{background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem'}}>
              <TrendingDown size={18} color="var(--danger-color)" />
            </div>
          </div>
          <div className="stat-value">Rs. {stats.totalPayables.toLocaleString()}</div>
          <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontWeight: '600'}}>Outstanding Bills</p>
        </div>

        <div className="stat-card glass-panel" style={{borderLeft: '4px solid var(--warning-color)'}}>
          <div className="stat-header">
            <span className="stat-label">Stock Status</span>
            <div style={{background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '0.5rem'}}>
              <Package size={18} color="var(--warning-color)" />
            </div>
          </div>
          <div className="stat-value">{stats.stockInHand} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>Units</span></div>
          <div style={{marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600'}}>
             <Truck size={14} /> <span>{stats.stockOnRoute} In Transit</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{padding: '2.5rem', marginBottom: '2.5rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem'}}>
          <h3 style={{fontSize: '1.25rem', fontWeight: '800'}}>Revenue Trend</h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '700'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
               <div style={{width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary-accent)'}}></div> Sales Volume
            </div>
          </div>
        </div>
        <div style={{width: '100%', height: '350px'}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600}} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600}}
                tickFormatter={(value) => `Rs.${value/1000}k`}
              />
              <Tooltip 
                cursor={{fill: 'rgba(139, 92, 246, 0.05)'}}
                contentStyle={{background: 'var(--panel-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1rem', boxShadow: 'var(--card-shadow)'}}
                itemStyle={{color: 'var(--primary-accent)', fontWeight: '800', fontSize: '0.9rem'}}
                labelStyle={{color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '700'}}
              />
              <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.sales > 0 ? 'var(--primary-accent)' : 'var(--border-color)'} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
