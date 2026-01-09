import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GlobalStyle from './styles/GlobalStyle'
import { theme } from './theme'
import App from './App'
import AuthProvider from './auth/AuthProvider'
import { CartProvider } from './cart/CartContext'


const qc = new QueryClient()


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <GlobalStyle />
            {/* <LanguageProvider> */}
              <CartProvider>
                <App />
              </CartProvider>
            {/* </LanguageProvider> */}
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
)