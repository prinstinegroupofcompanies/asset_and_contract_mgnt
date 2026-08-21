import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiEye, FiTrash2, FiDownload } from 'react-icons/fi';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import FormInput from '../../components/FormInput';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();
  const location = useLocation();

  const tabs = [
    { id: 'suppliers', label: 'Suppliers', endpoint: '/admin/suppliers' },
    { id: 'categories', label: 'Asset Categories', endpoint: '/admin/asset-categories' },
    { id: 'projects', label: 'Projects', endpoint: '/admin/projects' },
    { id: 'locations', label: 'Locations', endpoint: '/admin/locations' }
  ];

  const { data, isLoading } = useQuery(
    [activeTab, 'master-data'],
    async () => {
      const tab = tabs.find(t => t.id === activeTab);
      const response = await axios.get(tab.endpoint);
      return response.data[activeTab] || response.data.suppliers || response.data.categories || response.data.projects || response.data.locations;
    }
  );

  const createMutation = useMutation(
    (itemData) => {
      const tab = tabs.find(t => t.id === activeTab);
      return axios.post(tab.endpoint, itemData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([activeTab, 'master-data']);
        toast.success('Item created successfully');
        handleCloseModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create item');
      }
    }
  );

  const handleOpenModal = (item = null) => {
    setIsViewOnly(false);
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData(getDefaultFormData());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setIsViewOnly(false);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] || null : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === 'suppliers') {
      const supplierData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          supplierData.append(key, value);
        }
      });

      const supplierEndpoint = tabs.find(tab => tab.id === 'suppliers').endpoint;
      const request = editingItem
        ? axios.put(`${supplierEndpoint}/${editingItem.id}`, supplierData)
        : axios.post(supplierEndpoint, supplierData);

      request
        .then(() => {
          queryClient.invalidateQueries([activeTab, 'master-data']);
          toast.success(editingItem ? 'Supplier updated successfully' : 'Supplier created successfully');
          handleCloseModal();
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || `Failed to ${editingItem ? 'update' : 'create'} supplier`);
        });
      return;
    }

    createMutation.mutate(formData);
  };

  // Handle viewing a supplier's full details
  const handleViewItem = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsViewOnly(true);
    setIsModalOpen(true);
  };

  const getDocumentUrl = (documentPath) => {
    if (!documentPath) return '';
    const apiUrl = new URL(axios.defaults.baseURL || '/api', window.location.origin);
    return `${apiUrl.origin}${documentPath}`;
  };

  const handleDownloadDocument = async () => {
    try {
      const documentUrl = getDocumentUrl(formData.document_path);
      const response = await axios.get(documentUrl, { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const fileName = decodeURIComponent(formData.document_path.split('/').pop());

      link.href = downloadUrl;
      link.download = fileName || 'supplier-document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download document');
    }
  };

  // Handle deleting a supplier
  const handleDeleteItem = (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.supplier_name || item.name}?`)) {
      const tab = tabs.find(t => t.id === activeTab);
      axios.delete(`${tab.endpoint}/${item.id}`)
        .then(() => {
          queryClient.invalidateQueries([activeTab, 'master-data']);
          toast.success('Item deleted successfully');
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to delete item');
        });
    }
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      // Initialize empty supplier form with all required and optional fields
      case 'suppliers':
        return { 
          supplier_name: '', 
          address: '', 
          cell_number: '', 
          contact_person_name: '', 
          contact_person_number: '', 
          agreement_type: '', 
          contract_period_start: '', 
          contract_period_end: '', 
          document: null 
        };
      case 'categories':
        return { name: '', code: '', description: '', depreciation_rate: 0 };
      case 'projects':
        return { name: '', code: '', donor: '', start_date: '', end_date: '', budget: '', currency: 'USD' };
      case 'locations':
        return { name: '', type: 'Office', address: '' };
      default:
        return {};
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const getColumns = () => {
    switch (activeTab) {
      // Define table columns for supplier list display
      case 'suppliers':
        return [
          { header: 'Supplier Name', accessor: 'supplier_name' },
          { header: 'Contact Person', accessor: 'contact_person_name' },
          { header: 'Cell Number', accessor: 'cell_number' },
          { header: 'Agreement Type', accessor: 'agreement_type' },
          { header: 'Contract Period', accessor: 'contract_period_start' },
          ...(data?.length ? [{
            header: 'Actions',
            accessor: 'actions',
            render: (_, item) => (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {/* View button - display supplier details in read-only mode */}
                <button
                  className="btn btn-sm btn-info"
                  title="View Details"
                  onClick={() => handleViewItem(item)}
                  style={{ padding: '6px 10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FiEye /> View
                </button>
                
                {/* Edit button - open modal to edit supplier information */}
                <button
                  className="btn btn-sm btn-warning"
                  title="Edit Supplier"
                  onClick={() => handleOpenModal(item)}
                  style={{ padding: '6px 10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FiEdit2 /> Edit
                </button>
                
                {/* Delete button - remove supplier from system with confirmation */}
                <button
                  className="btn btn-sm btn-danger"
                  title="Delete Supplier"
                  onClick={() => handleDeleteItem(item)}
                  style={{ padding: '6px 10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            )
          }] : [])
        ];
      case 'categories':
        return [
          { header: 'Name', accessor: 'name' },
          { header: 'Code', accessor: 'code' },
          { header: 'Depreciation Rate', accessor: 'depreciation_rate', render: (value) => `${value || 0}%` }
        ];
      case 'projects':
        return [
          { header: 'Name', accessor: 'name' },
          { header: 'Code', accessor: 'code' },
          { header: 'Donor', accessor: 'donor' },
          { header: 'Start Date', accessor: 'start_date' },
          { header: 'End Date', accessor: 'end_date' }
        ];
      case 'locations':
        return [
          { header: 'Name', accessor: 'name' },
          { header: 'Type', accessor: 'type' },
          { header: 'Address', accessor: 'address' }
        ];
      default:
        return [];
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'suppliers':
        return (
          <>
            {/* Supplier company name - Required field for identification */}
            <FormInput label="Supplier Name" name="supplier_name" value={formData.supplier_name || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Physical address of the supplier's location/office */}
            <FormInput label="Address" name="address" type="textarea" value={formData.address || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Primary supplier contact mobile number */}
            <FormInput label="Cell Number" name="cell_number" value={formData.cell_number || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Name of the primary contact person at the supplier organization */}
            <FormInput label="Contact Person Name" name="contact_person_name" value={formData.contact_person_name || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Phone number of the contact person for direct communication */}
            <FormInput label="Contact Person Number" name="contact_person_number" value={formData.contact_person_number || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Type of agreement with the supplier - Contract or Point of Sale */}
            <FormInput label="Type of Agreement" name="agreement_type" type="select" value={formData.agreement_type || ''} onChange={handleChange} required
              disabled={isViewOnly} options={[
                { value: 'Contract', label: 'Contract' },
                { value: 'Point of Sale', label: 'Point of Sale' }
              ]} />
            
            {/* Contract start date for agreement duration tracking */}
            <FormInput label="Contract Period Start" name="contract_period_start" type="date" value={formData.contract_period_start || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Contract end date for agreement duration tracking */}
            <FormInput label="Contract Period End" name="contract_period_end" type="date" value={formData.contract_period_end || ''} onChange={handleChange} required disabled={isViewOnly} />
            
            {/* Upload supporting contract or agreement document */}
            <FormInput label="Upload Document" name="document" type="file" onChange={handleChange} disabled={isViewOnly} />
          </>
        );
      case 'categories':
        return (
          <>
            <FormInput label="Name" name="name" value={formData.name || ''} onChange={handleChange} required />
            <FormInput label="Code" name="code" value={formData.code || ''} onChange={handleChange} />
            <FormInput label="Description" name="description" type="textarea" value={formData.description || ''} onChange={handleChange} />
            <FormInput label="Depreciation Rate (%)" name="depreciation_rate" type="number" value={formData.depreciation_rate || 0} onChange={handleChange} />
          </>
        );
      case 'projects':
        return (
          <>
            <FormInput label="Name" name="name" value={formData.name || ''} onChange={handleChange} required />
            <FormInput label="Code" name="code" value={formData.code || ''} onChange={handleChange} />
            <FormInput label="Donor" name="donor" value={formData.donor || ''} onChange={handleChange} />
            <FormInput label="Start Date" name="start_date" type="date" value={formData.start_date || ''} onChange={handleChange} required />
            <FormInput label="End Date" name="end_date" type="date" value={formData.end_date || ''} onChange={handleChange} required />
            <FormInput label="Budget" name="budget" type="number" value={formData.budget || ''} onChange={handleChange} />
            <FormInput label="Currency" name="currency" type="select" value={formData.currency || 'USD'} onChange={handleChange} 
              options={[{ value: 'USD', label: 'USD' }, { value: 'LRD', label: 'LRD' }, { value: 'EUR', label: 'EUR' }]} />
          </>
        );
      case 'locations':
        return (
          <>
            <FormInput label="Name" name="name" value={formData.name || ''} onChange={handleChange} required />
            <FormInput label="Type" name="type" type="select" value={formData.type || 'Office'} onChange={handleChange} required
              options={[
                { value: 'Office', label: 'Office' },
                { value: 'Warehouse', label: 'Warehouse' },
                { value: 'Field', label: 'Field' },
                { value: 'Other', label: 'Other' }
              ]} />
            <FormInput label="Address" name="address" type="textarea" value={formData.address || ''} onChange={handleChange} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Supplier Data</h1>
        <p className="page-subtitle">Manage system configuration and reference data</p>
      </div>


      <div className="card">
        <div className="card-header">
          <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus style={{ marginRight: '5px' }} />
            Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
          </button>
        </div>

        <DataTable
          columns={getColumns()}
          data={data || []}
          loading={isLoading}
          emptyMessage={`No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} found`}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`${isViewOnly ? 'View' : editingItem ? 'Edit' : 'Create'} ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}`}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          {renderForm()}
          {isViewOnly && formData.document_path && (
            <div className="form-input-group">
              <label className="form-label">Uploaded Document</label>
              <button
                type="button"
                onClick={handleDownloadDocument}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FiDownload /> Download Document
              </button>
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MasterData;
