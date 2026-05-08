import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { TreeProvider } from './store/TreeContext'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <TreeProvider>
      <App />
    </TreeProvider>
  </React.StrictMode>,
)
