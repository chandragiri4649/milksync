import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";

const WalletManagement = () => {
  const { token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBalanceFilter, setSelectedBalanceFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  // ✅ useCallback so ESLint dependency warning disappears
  const fetchDistributors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.API_BASE}/distributor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch distributors");
      const data = await res.json();
      setDistributors(data);
    } catch (err) {
      setError(err.message || "Error fetching distributors");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch transaction history for a specific distributor
  const fetchTransactionHistory = useCallback(async (distributorId) => {
    if (!distributorId) return;
    
    setLoadingHistory(true);
    try {
      const res = await fetch(`${config.API_BASE}/wallets/${distributorId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch transaction history");
      const data = await res.json();
      setTransactionHistory(data);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setTransactionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]); // ✅ fetchDistributors is now stable

  const creditWallet = async (distributorId, amount) => {
    if (isNaN(amount) || amount <= 0) {
      setMessage("Enter a valid positive amount");
      return;
    }
    setMessage(null);
    try {
      const res = await fetch(`${config.API_BASE}/wallets/${distributorId}/credit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to credit wallet");
      }
      const data = await res.json();
      setMessage(
        `✅ Wallet credited successfully. New balance: ₹${data.walletBalance.toFixed(2)}`
      );
      fetchDistributors(); // Refresh
      if (distributorId === selectedDistributor) {
        fetchTransactionHistory(distributorId);
      }
    } catch (err) {
      setMessage(`❌ ${err.message || "Error crediting wallet"}`);
    }
  };

  const debitWallet = async (distributorId, amount) => {
    if (isNaN(amount) || amount <= 0) {
      setMessage("Enter a valid positive amount");
      return;
    }
    setMessage(null);
    try {
      const res = await fetch(`${config.API_BASE}/wallets/${distributorId}/debit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to debit wallet");
      }
      const data = await res.json();
      setMessage(
        `✅ Wallet debited successfully. New balance: ₹${data.walletBalance.toFixed(2)}`
      );
      fetchDistributors(); // Refresh
      if (distributorId === selectedDistributor) {
        fetchTransactionHistory(distributorId);
      }
    } catch (err) {
      setMessage(`❌ ${err.message || "Error debiting wallet"}`);
    }
  };

  // Get distributors with low balance (below ₹1000)
  const getLowBalanceDistributors = () => {
    return distributors.filter(dist => (dist.walletBalance || 0) < 1000);
  };

  // Get distributors with high balance (above ₹5000)
  const getHighBalanceDistributors = () => {
    return distributors.filter(dist => (dist.walletBalance || 0) > 5000);
  };

  // Filter distributors based on search criteria
  const getFilteredDistributors = () => {
    let filtered = distributors;

    if (searchTerm) {
      filtered = filtered.filter(dist => {
        const name = dist.distributorName || dist.name || '';
        const username = dist.username || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               username.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedBalanceFilter) {
      switch (selectedBalanceFilter) {
        case 'low':
          filtered = filtered.filter(dist => (dist.walletBalance || 0) < 1000);
          break;
        case 'medium':
          filtered = filtered.filter(dist => {
            const balance = dist.walletBalance || 0;
            return balance >= 1000 && balance <= 5000;
          });
          break;
        case 'high':
          filtered = filtered.filter(dist => (dist.walletBalance || 0) > 5000);
          break;
        default:
          break;
      }
    }

    return filtered;
  };

  // Export wallet data to CSV
  const exportToCSV = () => {
    const filteredDistributors = getFilteredDistributors();
    if (filteredDistributors.length === 0) {
      setMessage("No distributors to export");
      return;
    }

    const csvContent = [
      ["Distributor Name", "Username", "Wallet Balance", "Status"],
      ...filteredDistributors.map(dist => [
        dist.distributorName || dist.name || "Unknown",
        dist.username || "N/A",
        `₹${(dist.walletBalance || 0).toFixed(2)}`,
        (dist.walletBalance || 0) < 1000 ? "Low Balance" : "Good Balance"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Wallet data exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredDistributors = getFilteredDistributors();
    const totalBalance = filteredDistributors.reduce((sum, dist) => sum + (dist.walletBalance || 0), 0);
    const totalDistributors = filteredDistributors.length;
    const lowBalanceCount = getLowBalanceDistributors().length;
    const highBalanceCount = getHighBalanceDistributors().length;
    
    return { totalBalance, totalDistributors, lowBalanceCount, highBalanceCount };
  };

  const summaryStats = getSummaryStats();

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-lg text-primary"></i>
          <p className="mt-3 text-muted">Loading wallet management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                background: "linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)",
                width: '60px',
                height: '60px'
              }}
            >
              <i className="fas fa-wallet fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">Wallet Management</h3>
              <p className="text-muted mb-0 small">Manage distributor wallets and transactions</p>
            </div>
          </div>
        </div>
      </div>

        {/* Summary Dashboard */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-primary">
              <div className="card-body text-center">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-wallet text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-primary mb-1">₹{summaryStats.totalBalance.toFixed(2)}</h4>
                  <p className="mb-0 text-muted">Total Balance</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-info">
              <div className="card-body text-center">
                <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-info mb-1">{summaryStats.totalDistributors}</h4>
                  <p className="mb-0 text-muted">Total Distributors</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-warning">
              <div className="card-body text-center">
                <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-exclamation-triangle text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-warning mb-1">{summaryStats.lowBalanceCount}</h4>
                  <p className="mb-0 text-muted">Low Balance</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-success">
              <div className="card-body text-center">
                <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-chart-line text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-success mb-1">{summaryStats.highBalanceCount}</h4>
                  <p className="mb-0 text-muted">High Balance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border shadow-sm">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-lg-4 col-md-6">
                    <div className="position-relative">
                      <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Search distributors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <select
                      className="form-select"
                      value={selectedBalanceFilter}
                      onChange={(e) => setSelectedBalanceFilter(e.target.value)}
                    >
                      <option value="">All Balances</option>
                      <option value="low">Low Balance (&lt;₹1000)</option>
                      <option value="medium">Medium Balance (₹1000-₹5000)</option>
                      <option value="high">High Balance (&gt;₹5000)</option>
                    </select>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <button className="btn btn-outline-primary w-100" onClick={exportToCSV}>
                      <i className="fas fa-download me-2"></i>
                      Export CSV
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className="alert alert-info alert-dismissible fade show">
            <i className="fas fa-info-circle me-2"></i>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex justify-content-center">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('cards')}
                >
                  <i className="fas fa-th-large me-2"></i>
                  Cards
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('table')}
                >
                  <i className="fas fa-table me-2"></i>
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Distributor Wallets Section */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 className="fw-bold text-dark">
              <i className="fas fa-credit-card me-2"></i>
              Distributor Wallets ({getFilteredDistributors().length})
            </h5>
          </div>
        </div>

        {getFilteredDistributors().length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-wallet fa-3x text-muted mb-3"></i>
            <h6 className="text-muted">No distributors found</h6>
            <p className="text-muted">No distributors match the selected criteria.</p>
          </div>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-primary">
                <tr>
                  <th>Distributor</th>
                  <th>Username</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredDistributors().map((distributor) => (
                  <tr key={distributor._id}>
                    <td className="fw-bold">{distributor.distributorName || distributor.name}</td>
                    <td>{distributor.username}</td>
                    <td className={`fw-bold ${
                      (distributor.walletBalance || 0) < 1000 ? 'text-warning' : 'text-success'
                    }`}>
                      ₹{(distributor.walletBalance || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${
                        (distributor.walletBalance || 0) < 1000 ? 'bg-warning' : 'bg-success'
                      }`}>
                        {(distributor.walletBalance || 0) < 1000 ? 'Low Balance' : 'Good Balance'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            const amount = prompt("Enter amount to credit:");
                            if (amount) creditWallet(distributor._id, amount);
                          }}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            const amount = prompt("Enter amount to debit:");
                            if (amount) debitWallet(distributor._id, amount);
                          }}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            setSelectedDistributor(distributor._id);
                            fetchTransactionHistory(distributor._id);
                          }}
                        >
                          <i className="fas fa-history"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Cards View
          <div className="row">
            {getFilteredDistributors().map((distributor) => (
              <div key={distributor._id} className="col-lg-4 col-md-6 mb-3">
                <div className="card border shadow-sm h-100">
                  <div className="card-header bg-primary text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                        <i className="fas fa-user text-white"></i>
                      </div>
                      <span className={`badge ${
                        (distributor.walletBalance || 0) < 1000 ? 'bg-warning text-dark' : 'bg-success'
                      }`}>
                        {(distributor.walletBalance || 0) < 1000 ? 'Low Balance' : 'Good Balance'}
                      </span>
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-bold">{distributor.distributorName || distributor.name}</h6>
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-wallet text-muted me-2" style={{width: '16px'}}></i>
                        <span className="text-muted me-2">Balance:</span>
                        <span className={`fw-medium ${
                          (distributor.walletBalance || 0) < 1000 ? 'text-warning' : 'text-success'
                        }`}>
                          ₹{(distributor.walletBalance || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-at text-muted me-2" style={{width: '16px'}}></i>
                        <span className="text-muted me-2">Username:</span>
                        <span className="fw-medium">{distributor.username}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <label className="form-label">
                        <i className="fas fa-rupee-sign me-1"></i>Amount (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control mb-3"
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                        id={`amount-${distributor._id}`}
                      />
                      
                      <div className="d-flex gap-2 mb-3">
                        <button
                          className="btn btn-success w-100"
                          onClick={() =>
                            creditWallet(
                              distributor._id,
                              document.getElementById(`amount-${distributor._id}`).value
                            )
                          }
                        >
                          <i className="fas fa-plus me-1"></i>
                          Credit
                        </button>
                        <button
                          className="btn btn-danger w-100"
                          onClick={() =>
                            debitWallet(
                              distributor._id,
                              document.getElementById(`amount-${distributor._id}`).value
                            )
                          }
                        >
                          <i className="fas fa-minus me-1"></i>
                          Debit
                        </button>
                      </div>

                      <button
                        className="btn btn-info w-100"
                        onClick={() => {
                          setSelectedDistributor(distributor._id);
                          fetchTransactionHistory(distributor._id);
                        }}
                      >
                        <i className="fas fa-history me-1"></i>
                        View Transactions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transaction History Modal */}
        {selectedDistributor && (
          <div className="card border shadow-sm mt-4">
            <div className="card-header bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Transaction History
                </h6>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSelectedDistributor("");
                    setTransactionHistory([]);
                  }}
                >
                  <i className="fas fa-times me-1"></i>
                  Close
                </button>
              </div>
            </div>
            <div className="card-body">
              {loadingHistory ? (
                <div className="text-center py-5">
                  <i className="fas fa-spinner fa-spin fa-lg text-primary"></i>
                  <p className="mt-3 text-muted">Loading transactions...</p>
                </div>
              ) : transactionHistory.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-history fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No transaction history found</h6>
                  <p className="text-muted">No transactions found for this distributor.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-primary">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((transaction, idx) => (
                        <tr key={idx}>
                          <td>{new Date(transaction.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              transaction.type === 'credit' ? 'bg-success' : 'bg-danger'
                            }`}>
                              {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                            </span>
                          </td>
                          <td className={`fw-bold ${
                            transaction.type === 'credit' ? 'text-success' : 'text-danger'
                          }`}>
                            ₹{transaction.amount.toFixed(2)}
                          </td>
                          <td className="fw-bold">₹{transaction.balance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default WalletManagement;
