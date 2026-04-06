import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span style={{ marginRight: 8 }}>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
