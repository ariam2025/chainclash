import React from 'react'
import ReactDOM from 'react-dom/client'
import Providers from './providers'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', padding: '40px', fontFamily: 'monospace', background: '#0a0a0f', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ Render Error</h2>
          <pre style={{ color: '#fbbf24', background: '#1f1f2e', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Providers>
  </React.StrictMode>
)
