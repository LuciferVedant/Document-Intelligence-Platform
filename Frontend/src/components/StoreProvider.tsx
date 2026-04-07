'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
        {children}
      </GoogleOAuthProvider>
    </Provider>
  );
}
