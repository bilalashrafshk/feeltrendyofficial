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
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div className="logo-text" style={{fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
          FEELTRENDY
        </div>
        <button onClick={toggleTheme} className="btn btn-outline" style={{padding: '0.5rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)'}}>
          {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
      
      <div className="nav-links" style={{display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <LayoutDashboard size={20} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/inventory" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Package size={20} /> <span>Inventory</span>
        </NavLink>
        <NavLink to="/financials" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Wallet size={20} /> <span>Financials</span>
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

      <div style={{marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}>
        <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <SettingsIcon size={20} /> <span>Settings</span>
        </NavLink>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(139, 92, 246, 0.05);
        }
        .nav-link.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15));
          color: var(--primary-accent);
          box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.2);
        }
        .sidebar {
          transition: transform 0.3s ease;
        }
      `}} />
    </nav>
  );
};

export default Sidebar;
