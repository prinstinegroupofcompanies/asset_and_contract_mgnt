import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiDroplet, FiPlus } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import FormInput from '../../components/FormInput';
import Modal from '../../components/Modal';

const initialFormData = {
  vehicle_id: '', supplier: '', driver: '', fuel_type: 'Diesel', quantity: '',
  unit_cost: '', currency: 'USD', purchase_date: new Date().toISOString().split('T')[0]
};

const FuelLog = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const { data: fuelLogs, isLoading } = useQuery('fuel-logs', async () => {
    const response = await axios.get('/vehicles/fuel-logs');
    return response.data.fuelLogs || [];
  });
  const { data: vehicles } = useQuery('vehicles', async () => (await axios.get('/vehicles')).data.vehicles || []);
  const { data: suppliers } = useQuery('suppliers', async () => (await axios.get('/admin/suppliers')).data.suppliers || []);

  const fuelMutation = useMutation(
    data => axios.post(`/vehicles/${data.vehicle_id}/fuel`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fuel-logs');
        toast.success('Fuel log added successfully');
        setFormData(initialFormData);
        setIsModalOpen(false);
      },
      onError: error => toast.error(error.response?.data?.message || 'Failed to add fuel log')
    }
  );

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    fuelMutation.mutate({
      ...formData,
      vehicle_id: Number(formData.vehicle_id),
      quantity: Number(formData.quantity),
      unit_cost: Number(formData.unit_cost)
    });
  };

  const totalCost = (Number(formData.quantity) || 0) * (Number(formData.unit_cost) || 0);
  const columns = [
    { header: 'Date', accessor: 'purchase_date', render: value => value ? new Date(value).toLocaleDateString() : '-' },
    { header: 'Vehicle', accessor: 'registration_number', render: (value, row) => `${value || '-'}${row.make ? ` (${row.make} ${row.model || ''})` : ''}` },
    { header: 'Supplier', accessor: 'supplier', render: value => value || '-' },
    { header: 'Driver', accessor: 'driver', render: value => value || '-' },
    { header: 'Fuel Type', accessor: 'fuel_type' },
    { header: 'Unit', accessor: 'quantity', render: value => `${Number(value || 0).toFixed(2)} L` },
    { header: 'Cost', accessor: 'unit_cost', render: (value, row) => `${row.currency || 'USD'} ${Number(value || 0).toFixed(2)}` },
    { header: 'Total Cost', accessor: 'total_cost', render: (value, row) => `${row.currency || 'USD'} ${Number(value || 0).toFixed(2)}` }
  ];

  return (
      <div className="card">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2><FiDroplet style={{ marginRight: '8px', verticalAlign: 'middle' }} />Fuel Logs</h2>
            <p className="page-subtitle">Record and review fuel purchases</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <FiPlus style={{ marginRight: '5px' }} /> Add Fuel Log
          </button>
        </div>

        <DataTable columns={columns} data={fuelLogs || []} loading={isLoading} emptyMessage="No fuel logs found" />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Fuel Log" size="medium">
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Vehicle"
              name="vehicle_id"
              type="select"
              value={formData.vehicle_id}
              onChange={handleChange}
              required
              options={[
                { value: '', label: 'Select Vehicle' },
                ...(vehicles || []).map(vehicle => ({
                  value: vehicle.id,
                  label: `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model}`
                }))
              ]}
            />
            <FormInput
              label="Supplier"
              name="supplier"
              type="select"
              value={formData.supplier}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Supplier' },
                ...(suppliers || []).map(supplier => ({ value: supplier.supplier_name || supplier.name, label: supplier.supplier_name || supplier.name }))
              ]}
            />
            <FormInput label="Driver" name="driver" value={formData.driver} onChange={handleChange} required />
            <FormInput
              label="Fuel Type"
              name="fuel_type"
              type="select"
              value={formData.fuel_type}
              onChange={handleChange}
              required
              options={[{ value: 'Diesel', label: 'Diesel' }, { value: 'Gasoline', label: 'Gasoline' }]}
            />
            <div className="form-row">
              <FormInput label="Unit (Litres)" name="quantity" type="number" min="0.01" step="0.01" value={formData.quantity} onChange={handleChange} required />
              <FormInput label="Cost per Unit" name="unit_cost" type="number" min="0" step="0.01" value={formData.unit_cost} onChange={handleChange} required />
            </div>
            <FormInput label="Purchase Date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} required />
            <div className="form-input-group">
              <label className="form-label">Total Cost</label>
              <input className="form-control" value={`${formData.currency} ${totalCost.toFixed(2)}`} readOnly />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={fuelMutation.isLoading}>
                {fuelMutation.isLoading ? 'Saving...' : 'Add Fuel Log'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
  );
};

export default FuelLog;

