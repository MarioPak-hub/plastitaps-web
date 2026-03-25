import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 rounded-full border-4 border-t-blue-600 animate-spin" /></div>;
  }

  // If there is no authenticated user, redirect back to the SSO portal
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated via Google but hasn't completed mandatory corporate fields
  if (!user.profileComplete) {
    return <Navigate to="/completar-perfil" replace />;
  }

  // User is verified, authorized, and compliant
  return <Outlet />;
}
