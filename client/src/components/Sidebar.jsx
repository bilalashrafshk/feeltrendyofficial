import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  Truck, 
  FileText, 
  Settings as SettingsIcon 
} from 'lucide-react';

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <div className="logo">FEELTRENDY</div>
      <div className="nav-links">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/inventory" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Package size={20} /> Inventory
        </NavLink>
        <NavLink to="/financials" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Wallet size={20} /> Financial Ledger
        </NavLink>
        <NavLink to="/shipments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Truck size={20} /> Shipments
        </NavLink>
        <NavLink to="/invoices" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <FileText size={20} /> Invoices
        </NavLink>
        <NavLink to="/statements" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} /> Statements
        </NavLink>
      </div>
      <div style={{marginTop: 'auto'}}>
        <NavLink to="/settings" className="nav-item">
          <SettingsIcon size={20} /> Settings
        </NavLink>
      </div>
    </nav>
  );
};

export default Sidebar;
