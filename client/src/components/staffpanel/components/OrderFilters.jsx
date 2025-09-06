import React from 'react';

const OrderFilters = ({ 
  distributors, 
  viewMode, 
  setViewMode, 
  searchTerm,
  setSearchTerm,
  selectedDistributor,
  setSelectedDistributor,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear
}) => {

  // Generate month options (no "All Months" option)
  const getMonthOptions = () => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      const monthName = new Date(2024, i - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      options.push({ value: i.toString(), label: monthName });
    }
    return options;
  };

  // Generate year options (no "All Years" option)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let year = currentYear; year >= currentYear - 5; year--) {
      options.push({ value: year.toString(), label: year.toString() });
    }
    
    return options;
  };


  return (
    <div className="card border border-light shadow-sm">
      <div className="card-header bg-primary text-white">
        <h3>🔍 Search & Filters</h3>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-3 mb-3">
            <div className="mb-3">
              <label className="form-label fw-bold">Search</label>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="mb-3">
              <label className="form-label fw-bold">Distributor</label>
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="form-select"
              >
                <option value="">All Distributors</option>
                {distributors.map(d => (
                  <option key={d._id} value={d.name || d.distributorName || d.company}>
                    {d.name || d.distributorName || d.company}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="mb-3">
              <label className="form-label fw-bold">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-select"
              >
                {getMonthOptions().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="mb-3">
              <label className="form-label fw-bold">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-select"
              >
                {getYearOptions().map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="mb-3">
              <label className="form-label fw-bold">View Mode</label>
              <div className="d-flex gap-2">
                <button
                  className={`btn btn-secondary ${viewMode === 'cards' ? 'success' : ''}`}
                  onClick={() => setViewMode('cards')}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  📱 Cards
                </button>
                <button
                  className={`btn btn-secondary ${viewMode === 'table' ? 'success' : ''}`}
                  onClick={() => setViewMode('table')}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  <i className="bi bi-table me-1"></i>
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;

