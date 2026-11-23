import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WalletProvider } from './context/WalletContext'
import { ToastProvider } from "./context/ToastContext";
import "./styles/theme.css";
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletProvider>
      <ToastProvider>
      <App />
      </ToastProvider>
    </WalletProvider>
  </StrictMode>
)