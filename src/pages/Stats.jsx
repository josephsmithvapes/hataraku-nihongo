import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';

export default function Stats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const statsSnap = await getDoc(doc(db, 'stats', user.uid));
      if (statsSnap.exists()) setStats(statsSnap.data());

      const q = query(
        collection(db, 'sessions'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      setRecentSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [user]);

  const TOPIC_LABELS = {
    cafe: '☕ Café', directions: '🚉 Directions', office: '🏢 Office',
    shopping: '🛒 Shopping', food: '🍜 Food', greetings: '👋 Greetings',
    health: '🏥 Health', culture: '🎌 Culture', hiragana: '🔤 Hiragana', free: '💬 Free',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#aaa' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'sans-serif', padding: '1.5rem 1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#555' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#111' }}>Your Progress</h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
        {[
          { value: stats?.streak ?? 0, label: 'Day streak', icon: '🔥' },
          { value: stats?.wordsLearned ?? 0, label: 'Words learned', icon: '📖' },
          { value: stats?.sessionsCount ?? 0, label: 'Sessions', icon: '🎯' },
        ].map(({ value, label, icon }) => (
          <div key={label} style={{
            background: '#fafafa', border: '1px solid #eee', borderRadius: '12px',
            padding: '1rem 0.75rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem' }}>{icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111', margin: '0.25rem 0' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <h2 style={{ fontSize: '0.95rem', color: '#555', fontWeight: 600, marginBottom: '0.75rem' }}>Recent Sessions</h2>
      {recentSessions.length === 0 ? (
        <p style={{ color: '#bbb', fontSize: '0.9rem' }}>No sessions yet. Start practicing!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          {recentSessions.map(s => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 1rem', border: '1px solid #eee', borderRadius: '10px', background: '#fafafa',
            }}>
              <span style={{ fontWeight: 500, color: '#333' }}>{TOPIC_LABELS[s.topic] ?? s.topic}</span>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                {s.messages?.length ?? 0} messages
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Mistake patterns */}
      {stats?.mistakePatterns?.length > 0 && (
        <>
          <h2 style={{ fontSize: '0.95rem', color: '#555', fontWeight: 600, marginBottom: '0.75rem' }}>Common Corrections</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.mistakePatterns.slice(-8).reverse().map((m, i) => (
              <div key={i} style={{
                padding: '0.65rem 1rem', background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '8px', fontSize: '0.9rem', color: '#92400e',
              }}>
                ✏️ {m}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
