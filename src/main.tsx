import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { Toaster } from 'react-hot-toast'
import { NotificationProvider } from './hooks/useNotifications'
import App from './App.tsx'
import './index.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
      }}
    >
      <BrowserRouter>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{
              top: 80,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                maxWidth: '400px',
              },
              success: {
                style: {
                  border: '1px solid #10b981',
                  background: '#f0fdf4',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                style: {
                  border: '1px solid #ef4444',
                  background: '#fef2f2',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
              loading: {
                style: {
                  border: '1px solid #3b82f6',
                  background: '#eff6ff',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#eff6ff',
                },
              },
            }}
          />
        </NotificationProvider>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>,
)