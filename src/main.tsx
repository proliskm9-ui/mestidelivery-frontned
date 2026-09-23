import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './index.css'

// Lazy images fade in once decoded instead of popping in (styles/base.css: img.is-loaded)
document.addEventListener('load', (e) => {
    const el = e.target as HTMLElement
    if (el && el.tagName === 'IMG') el.classList.add('is-loaded')
}, true)

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
