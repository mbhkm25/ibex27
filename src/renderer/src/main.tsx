import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initWebEnvironment } from './lib/web-adapter'

// Initialize Web API adapter if running in browser
initWebEnvironment();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)


