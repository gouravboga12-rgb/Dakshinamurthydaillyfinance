import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: '#FFF5F5',
          border: '2px solid #E53E3E',
          borderRadius: '12px',
          margin: '20px',
          fontFamily: 'monospace',
          color: '#C53030'
        }}>
          <h2 style={{ margin: '0 0 10px 0' }}>🚨 React Rendering Crash</h2>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <pre style={{
            background: '#FEEBC8',
            padding: '12px',
            borderRadius: '6px',
            overflowX: 'auto',
            fontSize: '12px',
            color: '#7B341E',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              background: '#C53030',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Clear LocalStorage & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

