import './polyfills.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import './App.css'
import { AppRoutes } from './AppRoutes.tsx'
import { SolanaWalletProvider } from './providers/SolanaWalletProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaWalletProvider>
      <AppRoutes />
    </SolanaWalletProvider>
  </StrictMode>,
)
