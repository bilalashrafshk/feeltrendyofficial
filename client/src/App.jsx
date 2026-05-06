import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Component Imports
        import Sidebar from './components/Sidebar';
        import Dashboard from './components/Dashboard';
        import Inventory from './components/Inventory';
        import Financials from './components/Financials';
        import Shipments from './components/Shipments';
        import Invoices from './components/Invoices';
        import Statements from './components/Statements';
        import Settings from './components/Settings';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
