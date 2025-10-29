import React from 'react';
import { Shield } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Panel</h1>
        <p className="text-gray-600 mb-8">Manage users, rides, and platform settings</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-yellow-800">This page is under construction. Coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
