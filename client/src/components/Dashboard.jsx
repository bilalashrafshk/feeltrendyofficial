import React, { useState, useEffect } from 'react';
import { getProducts, getTransactions, getInvoices } from '../api';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck,
  Calendar,
  Filter,
  BarChart2
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

      // Chart Data Logic (Daily sales for last 7-14 days or selected range)
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
    <div className="dashboard">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1>Business Dashboard</h1>
          <p style={{color: 'var(--text-muted)'}}>Real-time e-commerce tracking</p>
        </div>
        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--glass)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--glass-border)'}}>
          <Calendar size={16} color="var(--primary)" />
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
            style={{background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem'}}
          />
          <span style={{color: 'var(--text-muted)'}}>to</span>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
            style={{background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem'}}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-label">Today's Sales</span>
            <TrendingUp size={16} color="var(--success)" />
          </div>
          <span className="stat-value">Rs. {stats.todaySales.toLocaleString()}</span>
          <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
            Yesterday: Rs. {stats.yesterdaySales.toLocaleString()}
          </span>
        </div>

        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-label">This Month</span>
            <BarChart2 size={16} color="var(--primary)" />
          </div>
          <span className="stat-value">Rs. {stats.monthlySales.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-label">Receivables</span>
            <TrendingUp size={16} color="var(--warning)" />
          </div>
          <span className="stat-value" style={{color: 'var(--warning)'}}>Rs. {stats.totalReceivables.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className="stat-label">Payables</span>
            <TrendingDown size={16} color="var(--danger)" />
          </div>
          <span className="stat-value" style={{color: 'var(--danger)'}}>Rs. {stats.totalPayables.toLocaleString()}</span>
        </div>
      </div>

      <div className="glass-panel" style={{marginTop: '1.5rem', padding: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <h3>Sales Performance</h3>
          <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Daily Sales Volume (PKR)</span>
        </div>
        <div style={{width: '100%', height: '300px'}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-muted)', fontSize: 12}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-muted)', fontSize: 12}}
                tickFormatter={(value) => `Rs. ${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{background: 'var(--bg)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem'}}
                itemStyle={{color: 'var(--primary)'}}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.sales > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.1)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
         <div className="stat-card" style={{flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
           <div style={{background: 'rgba(192, 132, 252, 0.1)', padding: '1rem', borderRadius: '1rem'}}>
             <Package color="var(--primary)" />
           </div>
           <div>
             <span className="stat-label">Stock in Hand</span>
             <div className="stat-value" style={{fontSize: '1.25rem'}}>{stats.stockInHand} Units</div>
           </div>
         </div>
         <div className="stat-card" style={{flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
           <div style={{background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '1rem'}}>
             <Truck color="var(--warning)" />
           </div>
           <div>
             <span className="stat-label">Stock on Route</span>
             <div className="stat-value" style={{fontSize: '1.25rem'}}>{stats.stockOnRoute} Units</div>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
