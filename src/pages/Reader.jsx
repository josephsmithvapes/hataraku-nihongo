import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import PixelScene from '../components/PixelScene';

// ─── Story metadata ───────────────────────────────────────────────────────────
const STORY_META = {
  momotaro:   { jpTitle: '桃太郎',    enTitle: 'Momotarō',        topic: 'culture' },
  urashima:   { jpTitle: '浦島太郎',  enTitle: 'Urashima Tarō',   topic: 'culture' },
  kaguya:     { jpTitle: 'かぐや姫',  enTitle: 'Kaguya-hime',     topic: 'culture' },
  goldilocks: { jpTitle: '三匹のくま', enTitle: 'Goldilocks',      topic: 'free' },
  pigs:       { jpTitle: '三匹のこぶた', enTitle: 'Three Little Pigs', topic: 'free' },
};

// ─── SSE helper (reused from Session pattern) ─────────────────────────────────
function parseSSE(chunk) {
  const lines = chunk.split('\n');
  let out = '';
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      const text = parsed?.delta?.text;
      if (text) out += text;
    } catch { /* ignore */ }
  }
  return out;
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speak(text, lang = 'ja-JP') {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.8;
  window.speechSynthesis.speak(utt);
}

// ─── Japanese tokenizer ───────────────────────────────────────────────────────
function tokenize(text) {
  const tokens = [];
  let cur = '';
  let curType = null;

  const typeOf = (ch) => {
    const c = ch.charCodeAt(0);
    if (c >= 0x4E00 && c <= 0x9FFF) return 'kanji';
    if (c >= 0x3040 && c <= 0x309F) return 'hiragana';
    if (c >= 0x30A0 && c <= 0x30FF) return 'katakana';
    if (c >= 0xFF01 && c <= 0xFF5E) return 'fw';
    if (c > 0x0020 && c <= 0x007E) return 'latin';
    return 'other';
  };

  for (const ch of text) {
    const t = typeOf(ch);
    if (t === 'other') {
      if (cur) { tokens.push({ text: cur, type: curType }); cur = ''; curType = null; }
      tokens.push({ text: ch, type: 'other' });
    } else if (t === curType) {
      cur += ch;
    } else {
      if (cur) tokens.push({ text: cur, type: curType });
      cur = ch; curType = t;
    }
  }
  if (cur) tokens.push({ text: cur, type: curType });
  return tokens;
}

// ─── Vocabulary helpers ───────────────────────────────────────────────────────
const VOC_KEY = 'hataraku_vocab';
function loadVocab() { try { return JSON.parse(localStorage.getItem(VOC_KEY) || '[]'); } catch { return []; } }
function saveWordToVocab(entry) {
  const list = loadVocab();
  if (!list.find(e => e.word === entry.word)) {
    list.unshift({ ...entry, savedAt: Date.now() });
    localStorage.setItem(VOC_KEY, JSON.stringify(list.slice(0, 200)));
  }
}

// ─── Story system prompt ──────────────────────────────────────────────────────
function storyPrompt(enTitle, storyId, difficulty) {
  return `You are a Japanese language tutor and storyteller.
Generate the story of "${enTitle}" as a series of pages for JLPT ${difficulty} learners.
Respond with ONLY a valid JSON array — no markdown fences, no explanation.
Each element must have exactly three keys:
  "jp":    Japanese text for this page (${difficulty === 'N5' ? 'very simple hiragana/katakana, basic kanji with furigana in parentheses' : difficulty === 'N4' ? 'simple sentences, common kanji' : 'natural sentences, varied kanji'}). 1–2 short sentences.
  "en":    English translation of the jp text.
  "scene": Always the string "${storyId}".
Generate exactly 7 pages that tell the complete story arc from beginning to end.`;
}

// ─── Word panel: fetch definition ────────────────────────────────────────────
const DEF_PROMPT = `You are a concise Japanese dictionary. Given a Japanese word or phrase, respond with ONLY valid JSON:
{"romaji":"...","meaning":"...","partOfSpeech":"..."}
romaji: romanized pronunciation. meaning: short English definition (max 8 words). partOfSpeech: noun/verb/adjective/adverb/particle/phrase/other.`;

async function fetchDefinition(word, serverUrl) {
  try {
    const res = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: DEF_PROMPT,
        messages: [{ role: 'user', content: word }],
      }),
    });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let raw = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += parseSSE(dec.decode(value, { stream: true }));
    }
    const m = raw.match(/\{[\s\S]*?\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reader() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const difficulty = searchParams.get('difficulty') || 'N5';
  const meta = STORY_META[id] ?? STORY_META.momotaro;
  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  // Story state
  const [pages, setPages]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [pageIdx, setPageIdx]     = useState(0);
  const [showEn, setShowEn]       = useState(false);

  // Word panel state
  const [wordPanel, setWordPanel] = useState(null); // { word, romaji, meaning, partOfSpeech }
  const [defLoading, setDefLoading] = useState(false);
  const [saved, setSaved]         = useState(false);

  // Swipe handling
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // ── Load story pages ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPageIdx(0);
    setShowEn(false);
    setWordPanel(null);

    async function load() {
      try {
        const res = await fetch(`${serverUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: storyPrompt(meta.enTitle, id, difficulty),
            messages: [{ role: 'user', content: `Tell the story of ${meta.enTitle} (${meta.jpTitle}) at JLPT ${difficulty} level.` }],
          }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let raw = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += parseSSE(dec.decode(value, { stream: true }));
        }

        const m = raw.match(/\[[\s\S]*\]/);
        if (!m) throw new Error('No JSON array found in response');
        const arr = JSON.parse(m[0]);
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('Empty story returned');
        setPages(arr);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, difficulty, meta.enTitle, meta.jpTitle, serverUrl]);

  // ── Page navigation ──────────────────────────────────────────────────────────
  const prevPage = useCallback(() => {
    setPageIdx(p => Math.max(0, p - 1));
    setShowEn(false);
    setWordPanel(null);
  }, []);

  const nextPage = useCallback(() => {
    setPageIdx(p => Math.min(pages.length, p + 1)); // pages.length = "end" screen
    setShowEn(false);
    setWordPanel(null);
  }, [pages.length]);

  // ── Touch / swipe ────────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    touchStartX.current = null;
    if (Math.abs(dx) < 40 || dy > 60) return; // not a horizontal swipe
    if (dx < 0) nextPage();
    else prevPage();
  };

  // ── Word tap ─────────────────────────────────────────────────────────────────
  const onWordTap = useCallback(async (word) => {
    if (!word || word.type === 'other') return;
    setSaved(false);
    setWordPanel({ word: word.text, romaji: null, meaning: null, partOfSpeech: null });
    setDefLoading(true);
    const def = await fetchDefinition(word.text, serverUrl);
    setWordPanel(prev => prev ? { ...prev, ...(def || {}) } : prev);
    setDefLoading(false);
  }, [serverUrl]);

  // ── Save to vocab ────────────────────────────────────────────────────────────
  const onSave = () => {
    if (!wordPanel) return;
    saveWordToVocab(wordPanel);
    setSaved(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const currentPage = pages[pageIdx];
  const isEnd = pageIdx >= pages.length;
  const totalPages = pages.length;

  // Loading / error
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>📖</div>
        <p style={{ color: '#888', fontFamily: '"Noto Serif JP", serif', fontSize: '1.1rem' }}>お話を生成中…</p>
        <p style={{ color: '#bbb', fontSize: '0.8rem' }}>Generating story…</p>
        <div style={{ width: 40, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#7800BC', width: '60%', animation: 'slide 1.2s ease-in-out infinite', borderRadius: 2 }} />
        </div>
        <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', gap: '1rem' }}>
        <p style={{ fontSize: '1.5rem' }}>⚠️</p>
        <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={() => navigate(`/stories/${id}?difficulty=${difficulty}`)} style={{ padding: '0.6rem 1.2rem', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Retry
        </button>
        <button onClick={() => navigate('/stories')} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', color: '#666', fontSize: '0.85rem' }}>
          Back to stories
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <button onClick={() => navigate('/stories')} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#555' }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '1rem', fontFamily: '"Noto Serif JP", serif', color: '#111' }}>{meta.jpTitle}</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>{meta.enTitle} · JLPT {difficulty}</p>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{Math.min(pageIdx + 1, totalPages)} / {totalPages}</span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Pixel art scene */}
        <div style={{ background: '#111', flexShrink: 0, lineHeight: 0 }}>
          <PixelScene story={currentPage?.scene ?? id} />
        </div>

        {/* End screen */}
        {isEnd ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '2rem' }}>🎉</p>
            <p style={{ fontFamily: '"Noto Serif JP", serif', fontSize: '1.5rem', color: '#111' }}>おわり</p>
            <p style={{ color: '#888', fontSize: '0.85rem' }}>You finished the story!</p>
            <button
              onClick={() => navigate(`/session/${meta.topic}`)}
              style={{ padding: '0.8rem 1.5rem', background: '#000080', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              先生と話す → Continue with sensei
            </button>
            <button
              onClick={() => { setPageIdx(0); setShowEn(false); }}
              style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.85rem', color: '#666', cursor: 'pointer' }}
            >
              Read again
            </button>
            <button
              onClick={() => navigate('/stories')}
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', fontSize: '0.85rem', color: '#aaa', cursor: 'pointer' }}
            >
              ← Back to stories
            </button>
          </div>
        ) : (
          /* Story page */
          <div style={{ flex: 1, padding: '1.25rem 1.5rem 6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Japanese text — tappable by token */}
            <div
              style={{ lineHeight: 1.9, userSelect: 'none' }}
              onClick={() => setShowEn(prev => !prev)}
            >
              {tokenize(currentPage?.jp ?? '').map((tok, i) => (
                tok.type === 'other'
                  ? <span key={i} style={{ fontFamily: '"Noto Serif JP", serif', fontSize: '1.6rem', color: '#111' }}>{tok.text}</span>
                  : <span
                      key={i}
                      onClick={(e) => { e.stopPropagation(); onWordTap(tok); }}
                      style={{
                        fontFamily: '"Noto Serif JP", serif',
                        fontSize: '1.6rem',
                        color: '#111',
                        cursor: 'pointer',
                        borderBottom: '2px solid transparent',
                        transition: 'border-color 0.15s',
                        padding: '0 1px',
                      }}
                      onPointerEnter={e => e.currentTarget.style.borderBottomColor = '#7800BC'}
                      onPointerLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                    >
                      {tok.text}
                    </span>
              ))}
            </div>

            {/* English translation — tap jp text to toggle */}
            {showEn ? (
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6, padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #7800BC' }}>
                {currentPage?.en}
              </p>
            ) : (
              <button
                onClick={() => setShowEn(true)}
                style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#9ca3af', cursor: 'pointer' }}
              >
                Tap to see translation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Page progress + nav bar */}
      {!isEnd && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={prevPage}
            disabled={pageIdx === 0}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e5e7eb', background: pageIdx === 0 ? '#f9fafb' : '#fff', fontSize: '1rem', cursor: pageIdx === 0 ? 'default' : 'pointer', color: pageIdx === 0 ? '#d1d5db' : '#555', flexShrink: 0 }}
          >
            ‹
          </button>

          {/* Progress dots */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            {pages.map((_, i) => (
              <div
                key={i}
                onClick={() => { setPageIdx(i); setShowEn(false); setWordPanel(null); }}
                style={{
                  width: i === pageIdx ? 18 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: i === pageIdx ? '#000080' : i < pageIdx ? '#7800BC' : '#e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#000080', fontSize: '1rem', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
          >
            ›
          </button>
        </div>
      )}

      {/* Word panel (bottom sheet) */}
      {wordPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: isEnd ? 0 : 68,
            left: 0,
            right: 0,
            background: '#fff',
            borderTop: '2px solid #000080',
            borderRadius: '16px 16px 0 0',
            padding: '1rem 1.25rem 1.5rem',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: '55vh',
            overflowY: 'auto',
          }}
        >
          {/* Handle + close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto' }} />
            <button
              onClick={() => setWordPanel(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}
            >
              ×
            </button>
          </div>

          {/* Word display */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            {/* Large character box */}
            <div style={{
              width: 80, height: 80, flexShrink: 0,
              background: 'linear-gradient(135deg, #000080, #7800BC)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: '"Noto Serif JP", serif', fontSize: '2rem',
            }}>
              {wordPanel.word[0]}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 0.1rem', fontFamily: '"Noto Serif JP", serif', fontSize: '1.5rem', color: '#111', wordBreak: 'break-all' }}>
                {wordPanel.word}
              </p>
              {defLoading ? (
                <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>Looking up…</p>
              ) : (
                <>
                  {wordPanel.romaji && (
                    <p style={{ margin: '0 0 0.2rem', color: '#7800BC', fontSize: '0.95rem', fontWeight: 500 }}>
                      {wordPanel.romaji}
                    </p>
                  )}
                  {wordPanel.partOfSpeech && (
                    <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                      {wordPanel.partOfSpeech}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Meaning */}
          {!defLoading && wordPanel.meaning && (
            <p style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#374151', lineHeight: 1.5, paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
              {wordPanel.meaning}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => speak(wordPanel.word)}
              style={{ flex: 1, padding: '0.6rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              🔊 Hear it
            </button>
            <button
              onClick={onSave}
              disabled={saved}
              style={{ flex: 1, padding: '0.6rem', background: saved ? '#dcfce7' : '#000080', border: 'none', borderRadius: '8px', fontSize: '0.85rem', cursor: saved ? 'default' : 'pointer', color: saved ? '#15803d' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {saved ? '✓ Saved' : '＋ Save word'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
