import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiTool, FiAlertTriangle, FiPlus, FiUpload } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import FormInput from '../../components/FormInput';
import Modal from '../../components/Modal';

const initialFormData = {
  vehicle_id: '', driver: '', problem_identified: '', cost: '', service_provider: '',
  maintenance_type: 'Repair', scheduled_date: new Date().toISOString().split('T')[0]
};

const MaintenanceSchedule = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [documentFile, setDocumentFile] = useState(null);

  const { data: maintenance, isLoading } = useQuery('maintenance-records', async () => {
    const response = await axios.get('/vehicles/maintenance');
    return response.data.maintenance || [];
  });
  const { data: vehicles } = useQuery('vehicles', async () => (await axios.get('/vehicles')).data.vehicles || []);
  const { data: suppliers } = useQuery('suppliers', async () => (await axios.get('/admin/suppliers')).data.suppliers || []);

  const maintenanceMutation = useMutation(async data => {
    const response = await axios.post(`/vehicles/${data.vehicle_id}/maintenance`, data);
    if (documentFile) {
      const documentData = new FormData();
      documentData.append('file', documentFile);
      documentData.append('file_name', documentFile.name);
      documentData.append('category', 'Maintenance Document');
      documentData.append('entity_type', 'VehicleMaintenance');
      documentData.append('entity_id', response.data.maintenanceId);
      await axios.post('/documents', documentData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return response;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('maintenance-records');
      toast.success('Maintenance record added successfully');
      setFormData(initialFormData);
      setDocumentFile(null);
      setIsModalOpen(false);
    },
    onError: error => toast.error(error.response?.data?.message || 'Failed to add maintenance record')
  });

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    maintenanceMutation.mutate({ ...formData, vehicle_id: Number(formData.vehicle_id), cost: Number(formData.cost) || 0 });
  };

  const columns = [
    { header: 'Vehicle', accessor: 'registration_number' },
    { header: 'Driver', accessor: 'driver', render: value => value || '-' },
    { header: 'Problem Identified', accessor: 'problem_identified', render: value => value || '-' },
    { header: 'Repair Cost', accessor: 'cost', render: (value, row) => `${row.currency || 'USD'} ${Number(value || 0).toFixed(2)}` },
    { header: 'Supplier', accessor: 'service_provider', render: value => value || '-' },
    { header: 'Scheduled Date', accessor: 'scheduled_date', render: value => value ? new Date(value).toLocaleDateString() : '-' },
    { header: 'Status', accessor: 'status', render: value => (
      <span className={`badge ${value === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
        {value}
      </span>
    )}
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
       <div>
         <h1 className="page-title">
          <FiTool style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Maintenance Schedule
        </h1>
        <p className="page-subtitle">Upcoming maintenance and service records</p>
       </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus style={{ marginRight: '5px' }} /> Add Maintenance
        </button>
      </div>

      <div className="card">
        <div className="card-header"><h3><FiAlertTriangle style={{ marginRight: '8px', color: '#ffc107' }} />Maintenance Records</h3></div>
        <DataTable columns={columns} data={maintenance || []} loading={isLoading} emptyMessage="No maintenance records found" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Maintenance" size="medium">
        <form onSubmit={handleSubmit}>
          <FormInput label="Vehicle" name="vehicle_id" type="select" value={formData.vehicle_id} onChange={handleChange} required options={[{ value: '', label: 'Select Vehicle' }, ...(vehicles || []).map(vehicle => ({ value: vehicle.id, label: `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model}` }))]} />
          <FormInput label="Driver" name="driver" value={formData.driver} onChange={handleChange} required />
          <FormInput label="Problem Identified" name="problem_identified" type="textarea" value={formData.problem_identified} onChange={handleChange} required />
          <FormInput label="Repair Cost" name="cost" type="number" min="0" step="0.01" value={formData.cost} onChange={handleChange} required />
          <FormInput label="Supplier" name="service_provider" type="select" value={formData.service_provider} onChange={handleChange} options={[{ value: '', label: 'Select Supplier' }, ...(suppliers || []).map(supplier => ({ value: supplier.supplier_name || supplier.name, label: supplier.supplier_name || supplier.name }))]} />
          <FormInput label="Scheduled Date" name="scheduled_date" type="date" value={formData.scheduled_date} onChange={handleChange} required />
          <div className="form-group">
            <label htmlFor="maintenance-document">Upload Document</label>
            <input id="maintenance-document" type="file" onChange={event => setDocumentFile(event.target.files?.[0] || null)} />
            {documentFile && <small><FiUpload style={{ marginRight: '4px' }} />{documentFile.name}</small>}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={maintenanceMutation.isLoading}>{maintenanceMutation.isLoading ? 'Saving...' : 'Add Maintenance'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceSchedule;

