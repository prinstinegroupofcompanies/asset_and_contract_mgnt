import React, { useState } from 'react';
import { FiFileText, FiBarChart2 } from 'react-icons/fi';
import AssetReport from './AssetReport';
import ContractReport from './ContractReport';
import StockReport from './StockReport';

const ReportsModule = () => {
  const [activeTab, setActiveTab] = useState('assets');

  return (
    <div>
      <div className="page-header">
        <h1>
          <FiBarChart2 style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          Reports
        </h1>
        <p className="page-subtitle">Generate and export comprehensive reports</p>
      </div>

      <div className="module-tabs">
        <button
          type="button"
          className={activeTab === 'assets' ? 'active' : ''}
          onClick={() => setActiveTab('assets')}
        >
          <FiFileText style={{ marginRight: '5px' }} />
          Asset Report
        </button>
        <button
          type="button"
          className={activeTab === 'contracts' ? 'active' : ''}
          onClick={() => setActiveTab('contracts')}
        >
          <FiFileText style={{ marginRight: '5px' }} />
          Contract Report
        </button>
        <button
          type="button"
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          <FiFileText style={{ marginRight: '5px' }} />
          Stock Report
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {activeTab === 'assets' && <AssetReport />}
        {activeTab === 'contracts' && <ContractReport />}
        {activeTab === 'stock' && <StockReport />}
      </div>
    </div>
  );
};

export default ReportsModule;

