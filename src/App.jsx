import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import InvoicePreview from './components/InvoicePreview';
import InvoiceHistory from './pages/HistoryView';
import Settings from './pages/Settings';
import ClientsList from './pages/ClientsList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/create" element={<CreateInvoice />} />
          <Route path="/preview" element={<InvoicePreview />} />
          <Route path="/history-view" element={<InvoiceHistory />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
