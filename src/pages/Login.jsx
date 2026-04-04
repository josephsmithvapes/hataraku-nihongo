import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#fff',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: '#111' }}>
        働く日本語
      </h1>
      <p style={{ color: '#888', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
        Japanese for everyday life
      </p>
      <button
        onClick={signInWithGoogle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.5rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: '#fff',
          fontSize: '1rem',
          color: '#333',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          width={20}
          height={20}
        />
        Sign in with Google
      </button>
    </div>
  );
}
