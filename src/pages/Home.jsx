import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

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
            {user?.displayName ?? user?.email}
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
