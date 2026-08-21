import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import MasterData from './MasterData';

const AdminModule = () => {
  return (
    <Routes>
      <Route path="users" element={<UserManagement />} />
      <Route path="master-data" element={<MasterData />} />
      <Route index element={<Navigate to="/admin/users" replace />} />
    </Routes>
  );
};

export default AdminModule;

