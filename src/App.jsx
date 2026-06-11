// import React from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import Layout from './components/Layout';
// import Dashboard from './pages/Dashboard';
// import CreateInvoice from './pages/CreateInvoice';
// import InvoicePreview from './components/InvoicePreview';
// import InvoiceHistory from './pages/HistoryView';
// import Settings from './pages/Settings';
// import ClientsList from './pages/ClientsList';

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Layout />}>
//           <Route index element={<Dashboard />} />
//           <Route path="/create" element={<CreateInvoice />} />
//           <Route path="/preview" element={<InvoicePreview />} />
//           <Route path="/history-view" element={<InvoiceHistory />} />
//           <Route path="/clients" element={<ClientsList />} />
//           <Route path="/settings" element={<Settings />} />
//         </Route>
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import InvoicePreview from "./components/InvoicePreview";
import InvoiceHistory from "./pages/HistoryView";
import Settings from "./pages/Settings";
import ClientsList from "./pages/ClientsList";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth Routes */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="create"
            element={
              <CreateInvoice />
            }
          />

          <Route
            path="preview"
            element={
              <InvoicePreview />
            }
          />

          <Route
            path="history-view"
            element={
              <InvoiceHistory />
            }
          />

          <Route
            path="clients"
            element={
              <ClientsList />
            }
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>

        <Route
  path="/reset-password/:token"
  element={<ResetPassword />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;