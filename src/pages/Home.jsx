import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import PixelScene from '../components/PixelScene';

const TOPICS = [
  { id: 'cafe',       emoji: '☕', label: 'Café' },
  { id: 'directions', emoji: '🚉', label: 'Directions' },
  { id: 'office',     emoji: '🏢', label: 'Office' },
  { id: 'shopping',   emoji: '🛒', label: 'Shopping' },
  { id: 'food',       emoji: '🍜', label: 'Food' },
  { id: 'greetings',  emoji: '👋', label: 'Greetings' },
  { id: 'health',     emoji: '🏥', label: 'Health' },
  { id: 'culture',    emoji: '🎌', label: 'Culture' },
  { id: 'hiragana',   emoji: '🔤', label: 'Hiragana' },
  { id: 'free',       emoji: '💬', label: 'Free' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'sans-serif',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>働く日本語</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#999' }}>
           user: {user?.displayName ?? user?.email}
          </p>
        </div>
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '0.4rem 0.9rem',
            fontSize: '0.85rem',
            color: '#666',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>

      {/* ── Stories section ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#111', fontWeight: 600 }}>お話を読む</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Read pixel-art stories</p>
          </div>
          <button
            onClick={() => navigate('/stories')}
            style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}
          >
            全部見る →
          </button>
        </div>

        {/* Featured story card */}
        <div
          onClick={() => navigate('/stories/momotaro?difficulty=N5')}
          style={{
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            background: '#fafafa',
            boxShadow: '0 2px 12px rgba(0,0,80,0.08)',
          }}
        >
          <div style={{ background: '#111', lineHeight: 0 }}>
            <PixelScene story="momotaro" />
          </div>
          <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 0.1rem', fontSize: '1.15rem', fontFamily: '"Noto Serif JP", serif', color: '#111' }}>桃太郎</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Momotarō · N5 · 7 pages</p>
            </div>
            <span style={{ fontSize: '1.25rem', color: '#000080' }}>→</span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1rem', color: '#555', marginBottom: '1.25rem', fontWeight: 500 }}>
        Choose a topic
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
      }}>
        {TOPICS.map(({ id, emoji, label }) => (
          <button
            key={id}
            onClick={() => navigate(`/session/${id}`)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1.5rem 1rem',
              border: '1px solid #eee',
              borderRadius: '12px',
              background: '#fafafa',
              fontSize: '1rem',
              color: '#222',
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <span style={{ fontSize: '2rem' }}>{emoji}</span>
            <span style={{ fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
