import React from 'react';

/**
 * Class-based Error Boundary required for catching errors thrown INSIDE
 * THREE.js Canvas renders. Function components + hooks cannot catch these.
 */
export default class Canvas3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'WebGL error' };
  }

  componentDidCatch(error, info) {
    console.warn('[VasoViewer3D] Canvas error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full flex flex-col items-center justify-center gap-4 text-slate-400 rounded-3xl"
          style={{ height: 460, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <svg className="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p className="text-sm font-bold text-slate-400">Vista 3D no disponible</p>
          <p className="text-xs text-slate-600 max-w-xs text-center">WebGL requiere Chrome, Edge o Firefox actualizado.</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-indigo-400 text-xs font-bold hover:underline mt-1"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
