import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getQueue, clearQueue, syncQueue } from '../../lib/offlineQueue';

export default function DriverSync() {
  const { supabase, user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const loadQueue = () => {
    setQueue(getQueue());
  };

  useEffect(() => {
    loadQueue();
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleSyncAll = async () => {
    if (!online) {
      setMessage('❌ Cannot sync while offline.');
      return;
    }
    setSyncing(true);
    setMessage('☁️ Synchronizing pending items...');
    try {
      const processedCount = await syncQueue(supabase, user?.organization_id);
      loadQueue();
      setMessage(`✅ Successfully synced ${processedCount} operational records!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Are you sure you want to discard all pending offline scans?')) {
      clearQueue();
      loadQueue();
      setMessage('🗑️ Offline queue cleared.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="slide-up" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="card-header">
        <h2>☁️ Sync Queue</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`pulse-dot`} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: online ? 'var(--accent-success)' : 'var(--accent-danger)',
            display: 'inline-block',
            boxShadow: online ? '0 0 8px var(--accent-success)' : '0 0 8px var(--accent-danger)'
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{online ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {!online && (
        <div className="offline-banner" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 8,
          padding: 12,
          color: 'var(--accent-danger)',
          fontSize: '0.85rem',
          marginBottom: 16,
          textAlign: 'center'
        }}>
          📡 Connection lost. You can continue scanning; your scans will queue locally.
        </div>
      )}

      {message && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 12,
          fontSize: '0.85rem',
          marginBottom: 16,
          textAlign: 'center',
          color: message.startsWith('❌') ? 'var(--accent-danger)' : 'var(--accent-success)'
        }}>
          {message}
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="stat-card" style={{ '--stat-color': '#f59e0b', padding: 16 }}>
          <div className="stat-card-value">{queue.length}</div>
          <div className="stat-card-label">Pending Offline Scans</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#10b981', padding: 16 }}>
          <div className="stat-card-value">{online ? 'Available' : 'Unavailable'}</div>
          <div className="stat-card-label">Server Sync</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSyncAll} 
          disabled={queue.length === 0 || syncing || !online} 
          style={{ flex: 2, justifyContent: 'center' }}
        >
          {syncing ? '⏳ Syncing...' : `☁️ Sync All (${queue.length})`}
        </button>
        {queue.length > 0 && (
          <button 
            className="btn btn-secondary" 
            style={{ border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', justifyContent: 'center' }} 
            onClick={handleClearQueue}
          >
            Clear
          </button>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Queue Activity Log</h3>
        {queue.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: '2rem' }}>☁️</div>
            <p className="empty-state-text" style={{ fontSize: '0.85rem' }}>All scans synchronized with server.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {queue.map(q => (
              <div 
                key={q.id} 
                className="sync-item" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 12, 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 8 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {q.type === 'BAG_COLLECTED' ? '🏷️' : q.type === 'GPS_CHECKIN' ? '📍' : '⚖️'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {q.type === 'BAG_COLLECTED' ? 'Bag Pickup' : q.type === 'GPS_CHECKIN' ? 'GPS Check-in' : 'Weigh Bag'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {q.payload?.barcode || `Coordinates: ${q.payload?.lat?.toFixed(4)}, ${q.payload?.lng?.toFixed(4)}`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>pending</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(q.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
