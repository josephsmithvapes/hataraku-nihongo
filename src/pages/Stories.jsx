import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import PixelScene from '../components/PixelScene';

const STORIES = [
  {
    id: 'momotaro',
    jpTitle: '桃太郎',
    enTitle: 'Momotarō',
    tagline: '「鬼ヶ島へ行こう！」',
    taglineEn: '"Let\'s go to Demon Island!"',
    origin: 'Japanese Folk Tale',
  },
  {
    id: 'urashima',
    jpTitle: '浦島太郎',
    enTitle: 'Urashima Tarō',
    tagline: '「竜宮城へようこそ」',
    taglineEn: '"Welcome to the Dragon Palace"',
    origin: 'Japanese Folk Tale',
  },
  {
    id: 'kaguya',
    jpTitle: 'かぐや姫',
    enTitle: 'Kaguya-hime',
    tagline: '「月から来た姫」',
    taglineEn: '"The Princess from the Moon"',
    origin: 'Japanese Folk Tale',
  },
  {
    id: 'goldilocks',
    jpTitle: '三匹のくま',
    enTitle: 'Goldilocks',
    tagline: '「ちょうどいいよ！」',
    taglineEn: '"This one is just right!"',
    origin: 'Western Folk Tale',
  },
  {
    id: 'pigs',
    jpTitle: '三匹のこぶた',
    enTitle: 'Three Little Pigs',
    tagline: '「僕の家を壊さないで！」',
    taglineEn: '"Don\'t blow my house down!"',
    origin: 'Western Folk Tale',
  },
];

const DIFFICULTIES = ['N5', 'N4', 'N3'];

const DIFF_COLORS = {
  N5: { bg: '#dcfce7', text: '#15803d', active: '#16a34a' },
  N4: { bg: '#fef9c3', text: '#a16207', active: '#ca8a04' },
  N3: { bg: '#fee2e2', text: '#b91c1c', active: '#dc2626' },
};

export default function Stories() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [difficulties, setDifficulties] = useState(() =>
    Object.fromEntries(STORIES.map(s => [s.id, 'N5']))
  );

  const setDiff = (id, diff) => setDifficulties(prev => ({ ...prev, [id]: diff }));

  const open = (id) => navigate(`/stories/${id}?difficulty=${difficulties[id]}`);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'sans-serif',
      padding: '0 0 3rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem 1rem',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#555', padding: '0.25rem' }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#111' }}>お話の本棚</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Story Library</p>
          </div>
        </div>
        <button
          onClick={signOut}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', color: '#666', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #000080 0%, #7800BC 100%)',
        padding: '1.5rem',
        textAlign: 'center',
        color: '#fff',
      }}>
        <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', opacity: 0.7, letterSpacing: '0.1em' }}>PIXEL STORIES</p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontFamily: '"Noto Serif JP", serif' }}>むかしむかし…</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Read classic tales. Tap words. Learn Japanese.</p>
      </div>

      {/* Story cards */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {STORIES.map((story) => {
          const diff = difficulties[story.id];
          const dc = DIFF_COLORS[diff];
          return (
            <div
              key={story.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#fafafa',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {/* Pixel art cover — clickable */}
              <div
                onClick={() => open(story.id)}
                style={{ cursor: 'pointer', background: '#111', lineHeight: 0 }}
              >
                <PixelScene story={story.id} />
              </div>

              {/* Card body */}
              <div style={{ padding: '1rem 1rem 1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '1.4rem', fontFamily: '"Noto Serif JP", serif', color: '#111', lineHeight: 1.2 }}>
                      {story.jpTitle}
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.85rem', color: '#555', fontWeight: 500 }}>
                      {story.enTitle}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#999',
                    background: '#f3f4f6',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                    marginTop: '0.2rem',
                  }}>
                    {story.origin}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                  {story.tagline} <span style={{ color: '#aaa', fontStyle: 'normal' }}>— {story.taglineEn}</span>
                </p>

                {/* Difficulty + Read button row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', marginRight: '0.25rem' }}>Level:</span>
                  {DIFFICULTIES.map(d => {
                    const c = DIFF_COLORS[d];
                    const active = d === diff;
                    return (
                      <button
                        key={d}
                        onClick={() => setDiff(story.id, d)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: active ? `2px solid ${c.active}` : '2px solid transparent',
                          background: active ? c.bg : '#f3f4f6',
                          color: active ? c.text : '#999',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => open(story.id)}
                    style={{
                      marginLeft: 'auto',
                      padding: '0.45rem 1rem',
                      background: '#111',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    読む →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
