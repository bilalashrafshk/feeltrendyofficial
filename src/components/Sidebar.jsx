import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  Truck, 
  FileText, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  PieChart
} from 'lucide-react';

const Sidebar = ({ isLightTheme, toggleTheme }) => {
  return (
    <nav className="sidebar">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem'}}>
        <div style={{fontWeight: '800', fontSize: '1.2rem', letterSpacing: '1px'}}>FEELTRENDY</div>
        <button onClick={toggleTheme} className="btn" style={{padding: '0.4rem', background: 'var(--glass-border)', borderRadius: '0.5rem'}}>
          {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
      
      <div className="nav-links" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <LayoutDashboard size={20} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/inventory" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Package size={20} /> <span>Inventory</span>
        </NavLink>
        <NavLink to="/financials" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Wallet size={20} /> <span>Financial Ledger</span>
        </NavLink>
        <NavLink to="/shipments" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Truck size={20} /> <span>Shipments</span>
        </NavLink>
        <NavLink to="/invoices" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <FileText size={20} /> <span>Invoices</span>
        </NavLink>
        <NavLink to="/statements" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <PieChart size={20} /> <span>Statements</span>
        </NavLink>
      </div>
      <div style={{marginTop: 'auto'}}>
        <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <SettingsIcon size={20} /> <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Sidebar;
