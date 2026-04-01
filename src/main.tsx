import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './auth/AuthProvider'
import { ConfirmDialogProvider } from './components/ConfirmDialog'
import { SnackbarProvider } from './components/Snackbar'
import { Router } from './app/router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SnackbarProvider>
        <ConfirmDialogProvider>
          <Router />
        </ConfirmDialogProvider>
      </SnackbarProvider>
    </AuthProvider>
  </React.StrictMode>,
)
