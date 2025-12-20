// App.jsx - Composant principal avec design Gustalya

import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppWithProfileProvider from './@App.jsx';

export default function AppWithProviders() {
  return (
    <AuthProvider>
      <AppWithProfileProvider />
    </AuthProvider>
  );
}