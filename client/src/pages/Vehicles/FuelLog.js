import React from 'react';
import { FiDroplet } from 'react-icons/fi';

const FuelLog = () => {
  // This would show all fuel logs across all vehicles
  // For now, we'll show a message to select a vehicle
  return (
    <div className="card">
      <div className="page-header">
        <h2>
          <FiDroplet style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Fuel Logs
        </h2>
        <p className="page-subtitle">View fuel logs for all vehicles</p>
      </div>
      <p>To log fuel, please select a vehicle from the Vehicles list and use the "Log Fuel" button on the vehicle detail page.</p>
    </div>
  );
};

export default FuelLog;

