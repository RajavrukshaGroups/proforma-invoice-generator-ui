import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FilePlus2, MapPin, Loader2, Building2, Search } from 'lucide-react';

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleNavigateHistory = (client) => {
    navigate('/history-view', { state: { client } });
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('http://localhost:5000/getAllPI');
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch invoices');
        }

        // Extract unique clients from invoices
        const uniqueClientsMap = new Map();
        
        data.data.forEach(invoice => {
          if (invoice.customer && invoice.customer.customerName) {
            const key = invoice.customer.customerName.toLowerCase().trim();
            // Keep the most recent data for each client (assuming data is sorted by newest first, or we just overwrite)
            if (!uniqueClientsMap.has(key)) {
              uniqueClientsMap.set(key, invoice.customer);
            }
          }
        });

        // Convert Map to Array and sort alphabetically
        const clientsArray = Array.from(uniqueClientsMap.values()).sort((a, b) => 
          a.customerName.localeCompare(b.customerName)
        );

        setClients(clientsArray);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleCreateInvoice = (client) => {
    navigate('/create', { state: { clientData: client } });
  };

  const filteredClients = clients.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 mb-4">
          <p className="font-semibold">Error loading clients</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Clients List
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View all your clients and quickly generate new proforma invoices with pre-filled details.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            placeholder="Search clients by name or GSTIN..."
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            {searchQuery ? <Search className="w-8 h-8 text-gray-400" /> : <Users className="w-8 h-8 text-gray-400" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {searchQuery ? 'No matching clients found' : 'No clients found'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery 
              ? `We couldn't find any clients matching "${searchQuery}".` 
              : "You don't have any clients yet. Clients are automatically saved when you create your first proforma invoice."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              Create First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => (
            <div 
              key={index}
              onClick={() => handleNavigateHistory(client)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                      {client.customerName}
                    </h3>
                    {client.gstin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-md font-mono">
                        GST: {client.gstin}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {(client.address || client.city || client.state) && (
                    <div className="flex gap-2 items-start">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                      <p className="leading-snug">
                        {client.address && <>{client.address}<br/></>}
                        {[client.city, client.state, client.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCreateInvoice(client); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-sm transition-colors"
                >
                  <FilePlus2 className="w-4 h-4" />
                  Create Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
