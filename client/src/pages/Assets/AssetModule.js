import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useQueryClient, useMutation } from 'react-query';
import { toast } from 'react-toastify';
import AssetList from './AssetList';
import AssetDetail from './AssetDetail';
import AssetCreate from './AssetCreate';

// Categories form component
const CategoriesForm = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation(
    (data) => axios.post('/admin/asset-categories', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('asset-categories');
        toast.success('Category created');
        onClose();
      },
      onError: (err) => {
        console.error(err);
        toast.error('Failed to create category');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warn('Please enter a category name');
      return;
    }
    mutation.mutate({ name, description });
  };

  return (
    <div className="categories-dropdown" style={{ padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: 6, marginTop: 8 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <input
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>{mutation.isLoading ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

// Projects form component
const ProjectsForm = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [code, setCode] = useState('');
  const [donor, setDonor] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const queryClient = useQueryClient();

  const mutation = useMutation(
    (data) => axios.post('/admin/projects', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        toast.success('Project created');
        onClose();
      },
      onError: (err) => {
        console.error(err);
        const serverMessage = err.response?.data?.message;
        const validation = err.response?.data?.errors;
        if (validation && validation.length) {
          toast.error(validation[0].msg || 'Validation error');
        } else if (serverMessage) {
          toast.error(serverMessage);
        } else {
          toast.error('Failed to create project');
        }
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warn('Please enter a project name');
      return;
    }
    if (!startDate || !endDate) {
      toast.warn('Please enter project start and end dates');
      return;
    }
    mutation.mutate({ name, description, start_date: startDate, end_date: endDate, code, donor, budget, currency });
  };

  return (
    <div className="categories-dropdown" style={{ padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: 6, marginTop: 8 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '8px', marginBottom: '8px', gridTemplateColumns: '1fr 1fr' }}>
          <input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '8px' }}
          />
          <input
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: '8px' }}
          />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px' }} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px' }} />
          <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} style={{ padding: '8px' }} />
          <input placeholder="Donor" value={donor} onChange={(e) => setDonor(e.target.value)} style={{ padding: '8px' }} />
          <input placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} style={{ padding: '8px' }} />
          <input placeholder="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ padding: '8px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>{mutation.isLoading ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

// Locations form component
const LocationsForm = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Office');
  const queryClient = useQueryClient();

  const mutation = useMutation(
    (data) => axios.post('/admin/locations', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        toast.success('Location created');
        onClose();
      },
      onError: (err) => {
        console.error(err);
        const serverMessage = err.response?.data?.message;
        const validation = err.response?.data?.errors;
        if (validation && validation.length) {
          toast.error(validation[0].msg || 'Validation error');
        } else if (serverMessage) {
          toast.error(serverMessage);
        } else {
          toast.error('Failed to create location');
        }
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warn('Please enter a location name');
      return;
    }
    mutation.mutate({ name, description, type });
  };

  return (
    <div className="categories-dropdown" style={{ padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: 6, marginTop: 8 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            placeholder="Location name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <input
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ flex: 1, padding: '8px' }}>
            <option value="Office">Office</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Field">Field</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>{mutation.isLoading ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

// (CategoriesForm will be rendered as a dropdown overlay from AssetModule)

const AssetModule = () => {
  const location = useLocation();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Asset Management</h1>
        <p className="page-subtitle">Manage assets, transfers, and maintenance</p>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="module-tabs">
        <Link
          to="/assets"
          className={location.pathname === '/assets' ? 'active' : ''}
        >
          All Assets
        </Link>
        <Link
          to="/assets/create"
          className={location.pathname === '/assets/create' ? 'active' : ''}
        >
          Create Asset
        </Link>
          {/* Categories dropdown toggle (non-navigating) */}
          <span className="categories-toggle">
            <button
              type="button"
              className={categoriesOpen ? 'active' : ''}
              onClick={() => { setCategoriesOpen(prev => !prev); setProjectsOpen(false); setLocationsOpen(false); }}
            >
              Categories
            </button>
          </span>

          <span className="projects-toggle">
            <button
              type="button"
              className={projectsOpen ? 'active' : ''}
              onClick={() => { setProjectsOpen(prev => !prev); setCategoriesOpen(false); setLocationsOpen(false); }}
            >
              Projects
            </button>
          </span>

          <span className="locations-toggle">
            <button
              type="button"
              className={locationsOpen ? 'active' : ''}
              onClick={() => { setLocationsOpen(prev => !prev); setCategoriesOpen(false); setProjectsOpen(false); }}
            >
              Locations
            </button>
          </span>
        </div>

        {/* Dropdown overlay positioned over the tabs */}
        {categoriesOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1000 }}>
            <CategoriesForm onClose={() => setCategoriesOpen(false)} />
          </div>
        )}

        {projectsOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1000 }}>
            <ProjectsForm onClose={() => setProjectsOpen(false)} />
          </div>
        )}

        {locationsOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1000 }}>
            <LocationsForm onClose={() => setLocationsOpen(false)} />
          </div>
        )}
      </div>

      <Routes>
        <Route index element={<AssetList />} />
        <Route path="create" element={<AssetCreate />} />
        <Route path=":id" element={<AssetDetail />} />
      </Routes>
    </div>
  );
};

export default AssetModule;
