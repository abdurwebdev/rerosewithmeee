import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <Toaster richColors position="top-right" expand={false} closeButton />
      <App />
    </StrictMode>
  </BrowserRouter>,
)
