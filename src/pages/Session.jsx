import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { db } from '../firebase';
import {
  collection, addDoc, doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';

const SYSTEM_PROMPTS = {
  cafe: `You are a friendly Japanese sensei helping a student practice ordering at a café in Japan. Guide them through realistic café interactions: greetings, ordering drinks and food, asking about specials, paying. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences. Be warm and encouraging.`,

  directions: `You are a helpful Japanese sensei practicing directions and navigation. Simulate asking for directions near a train station, reading maps, and understanding station announcements. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  office: `You are a professional Japanese sensei practicing workplace Japanese. Cover greetings, meetings, emails, politeness levels (keigo), and common office phrases. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  shopping: `You are a helpful Japanese sensei practicing shopping conversations. Cover asking prices, sizes, colors, checkout, and polite requests. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  food: `You are an enthusiastic Japanese sensei practicing food and restaurant Japanese. Cover ordering, dietary needs, compliments to the chef, and food vocabulary. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  greetings: `You are a warm Japanese sensei drilling essential greetings and daily expressions. Cover morning/evening greetings, introductions, farewells, and polite responses. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  health: `You are a caring Japanese sensei practicing health and medical Japanese. Cover describing symptoms, visiting a pharmacy or clinic, and understanding instructions. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  culture: `You are a knowledgeable Japanese sensei teaching cultural context alongside language. Cover customs, festivals, etiquette, and culturally appropriate phrases. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  hiragana: `You are a patient Japanese sensei focused on hiragana reading and writing practice. Quiz the student on characters, give reading practice with simple words, and explain stroke order concepts. Always respond as JSON: { "jp": "<your Japanese reply using hiragana>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short tip about the character or reading, or null>", "correction": "<corrected reading if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,

  free: `You are a friendly Japanese sensei for open conversation practice. Follow the student's lead on any topic and naturally weave in corrections and tips. Always respond as JSON: { "jp": "<your Japanese reply>", "en": "<English translation of your reply>", "studentEn": "<natural English version of what the student said>", "tip": "<short grammar or vocab tip, or null>", "correction": "<corrected Japanese if student made a mistake, or null>" }. Keep jp replies to 1-2 sentences.`,
};

const TOPIC_LABELS = {
  cafe: 'Café', directions: 'Directions', office: 'Office', shopping: 'Shopping',
  food: 'Food', greetings: 'Greetings', health: 'Health', culture: 'Culture',
  hiragana: 'Hiragana', free: 'Free',
};

function parseSSE(chunk) {
  const lines = chunk.split('\n');
  const results = [];
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.delta?.text;
        if (text) results.push(text);
      } catch { /* ignore */ }
    }
  }
  return results.join('');
}

function speak(text, lang = 'ja-JP') {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 0.85;
    utt.onend = resolve;
    utt.onerror = resolve;
    window.speechSynthesis.speak(utt);
  });
}

export default function Session() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [displayedJp, setDisplayedJp] = useState('');
  const sessionIdRef = useRef(null);
  const wordsLearnedRef = useRef(new Set());
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  const saveToFirestore = useCallback(async (msgs) => {
    if (!user) return;
    const sessionData = {
      uid: user.uid,
      topic,
      messages: msgs,
      updatedAt: serverTimestamp(),
    };
    if (!sessionIdRef.current) {
      const ref = await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        createdAt: serverTimestamp(),
      });
      sessionIdRef.current = ref.id;
    } else {
      await setDoc(doc(db, 'sessions', sessionIdRef.current), sessionData, { merge: true });
    }

    const statsRef = doc(db, 'stats', user.uid);
    const statsSnap = await getDoc(statsRef);
    const prev = statsSnap.exists() ? statsSnap.data() : { wordsLearned: 0, sessionsCount: 0, streak: 0, lastSessionDate: null, mistakePatterns: [] };

    const today = new Date().toDateString();
    const lastDate = prev.lastSessionDate?.toDate?.()?.toDateString?.() ?? null;
    const streak = lastDate === today ? prev.streak : (lastDate === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1);

    const corrections = msgs.filter(m => m.role === 'assistant' && m.correction).map(m => m.correction);
    const mistakePatterns = [...new Set([...(prev.mistakePatterns ?? []), ...corrections])].slice(-20);

    await setDoc(statsRef, {
      wordsLearned: prev.wordsLearned + wordsLearnedRef.current.size,
      sessionsCount: (prev.sessionsCount ?? 0) + (sessionIdRef.current ? 0 : 1),
      streak,
      lastSessionDate: serverTimestamp(),
      mistakePatterns,
    }, { merge: true });
  }, [user, topic]);

  const typeWords = useCallback(async (text) => {
    const words = text.split(/(?<=[\u3000-\u9fff\uff00-\uffef])|(?=[\u3000-\u9fff\uff00-\uffef])|\s+/).filter(Boolean);
    let built = '';
    for (const word of words) {
      built += word;
      setDisplayedJp(built);
      await new Promise(r => setTimeout(r, 120));
    }
    return text;
  }, []);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || loading) return;
    setLoading(true);

    const userMsg = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setDisplayedJp('');

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.role === 'assistant' ? m.jp : m.content,
      }));

      const res = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_PROMPTS[topic] || SYSTEM_PROMPTS.free, messages: apiMessages }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += parseSSE(decoder.decode(value, { stream: true }));
      }

      let parsed;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch?.[0] ?? raw);
      } catch {
        parsed = { jp: raw, en: '', studentEn: '', tip: null, correction: null };
      }

      const assistantMsg = { role: 'assistant', ...parsed };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      if (parsed.jp) {
        const jpWords = parsed.jp.match(/[\u3000-\u9fff\uff00-\uffefa-zA-Z0-9ぁ-んァ-ン]+/g) ?? [];
        jpWords.forEach(w => wordsLearnedRef.current.add(w));
        await Promise.all([typeWords(parsed.jp), speak(parsed.jp)]);
      }

      await saveToFirestore(finalMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, topic, serverUrl, typeWords, saveToFirestore]);

  // Initial sensei greeting
  useEffect(() => {
    sendMessage(`Let's start a ${TOPIC_LABELS[topic] || topic} practice session. Please greet me in Japanese and give me an opening prompt.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedJp]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('Speech recognition not supported in this browser.');
    const rec = new SR();
    rec.lang = 'ja-JP';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#555' }}>←</button>
        <span style={{ fontWeight: 600, color: '#111' }}>{TOPIC_LABELS[topic] || topic}</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'assistant' ? (
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: 500, color: '#111', margin: '0 0 0.35rem', lineHeight: 1.5 }}>
                  {i === messages.length - 1 && displayedJp ? displayedJp : msg.jp}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#888', margin: '0 0 0.4rem' }}>{msg.en}</p>
                {msg.correction && (
                  <p style={{ fontSize: '0.9rem', color: '#d97706', margin: '0 0 0.3rem', background: '#fffbeb', padding: '0.4rem 0.75rem', borderRadius: '6px', display: 'inline-block' }}>
                    ✏️ {msg.correction}
                  </p>
                )}
                {msg.tip && (
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                    💡 {msg.tip}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', background: '#f3f4f6', borderRadius: '12px', padding: '0.6rem 1rem', fontSize: '1rem', color: '#333', maxWidth: '80%' }}>
                  {msg.content}
                </span>
              </div>
            )}
          </div>
        ))}
        {loading && !displayedJp && (
          <p style={{ color: '#ccc', fontSize: '1.4rem' }}>…</p>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Reply in Japanese or English…"
          disabled={loading}
          style={{ flex: 1, padding: '0.7rem 1rem', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', outline: 'none' }}
        />
        <button
          onClick={listening ? stopListening : startListening}
          disabled={loading}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: listening ? '#ef4444' : '#f3f4f6',
            fontSize: '1.2rem', cursor: 'pointer', flexShrink: 0,
          }}
        >
          {listening ? '⏹' : '🎤'}
        </button>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.7rem 1.1rem', background: '#111', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '0.95rem', cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
