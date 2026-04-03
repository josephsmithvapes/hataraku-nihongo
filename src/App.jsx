import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg: "#faf8f3", surface: "#ffffff", surface2: "#f2ede2",
  border: "rgba(120,90,40,0.13)", borderHover: "rgba(120,90,40,0.22)",
  accent: "#a06828", accentDim: "rgba(160,104,40,0.09)", accentGlow: "rgba(160,104,40,0.22)",
  text: "#1a1208", text2: "#8a7a60", text3: "#c8b898",
  gold: "#a06828",
};
const JF = "'Cormorant Garamond', serif";
const UF = "'Outfit', sans-serif";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#faf8f3;}
  button{cursor:pointer;border:none;background:none;font-family:inherit;}
  input{font-family:inherit;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:rgba(160,104,40,0.28);border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.94)}}
  @keyframes ripple{0%{transform:scale(.8);opacity:1}100%{transform:scale(2.8);opacity:0}}
  @keyframes dot{0%,80%,100%{transform:scale(.5);opacity:.3}40%{transform:scale(1);opacity:1}}
  @keyframes steamRise{0%{opacity:0;transform:translateY(0)scaleX(1)}50%{opacity:.55;transform:translateY(-12px)scaleX(1.3)}100%{opacity:0;transform:translateY(-24px)scaleX(.7)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes mangaFlip{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
  .steam{animation:steamRise 2.2s ease-in-out infinite;}
  .steam2{animation:steamRise 2.2s ease-in-out .8s infinite;}
  .msg-in{animation:fadeUp .3s ease both;}
  .scene-card:hover{transform:translateX(4px);}
  .phrase-card:hover .phrase-play{opacity:1!important;}
  input:focus{outline:none;border-color:rgba(160,104,40,0.5)!important;}
`;

// ─────────────────────────────────────────────
// SCENE DATA
// ─────────────────────────────────────────────
const SCENES = [
  {
    id:"coffee", kanji:"喫茶店", reading:"きっさてん", english:"Coffee Shop",
    role:"Barista", emoji:"☕", color:"#7a4a1e",
    subtitle:"Working the counter at a Tokyo café",
    vocab:[
      {jp:"いらっしゃいませ",read:"irasshaimase",en:"Welcome to our shop"},
      {jp:"ご注文はお決まりですか？",read:"go-chūmon wa o-kimari desu ka?",en:"Are you ready to order?"},
      {jp:"サイズはどちらに？",read:"saizu wa dochira ni?",en:"Which size?"},
      {jp:"お持ち帰りですか？",read:"o-mochikaeri desu ka?",en:"Is this for takeaway?"},
      {jp:"少々お待ちください",read:"shōshō o-machi kudasai",en:"Please wait just a moment"},
      {jp:"合計で○○円です",read:"gōkei de ___ en desu",en:"Your total is ___ yen"},
      {jp:"お次のお客様",read:"o-tsugi no o-kyakusama",en:"Next customer, please"},
    ],
    manga:[
      {setting:"A customer pushes open the door",speaker:"Customer",jp:"すみません！",en:"Excuse me!",sfx:"ガラガラ",isUser:false},
      {setting:"You smile from behind the counter",speaker:"You ☕",jp:"いらっしゃいませ！ご注文はお決まりですか？",en:"Welcome! Are you ready to order?",sfx:"",isUser:true},
      {setting:"The customer studies the menu board",speaker:"Customer",jp:"ホットラテをひとつ、Mサイズで。",en:"One hot latte, medium size please.",sfx:"ジーッ",isUser:false},
      {setting:"You tap the register and smile",speaker:"You ☕",jp:"かしこまりました！少々お待ちください。",en:"Certainly! Please wait a moment.",sfx:"ピッ",isUser:true},
    ],
    system:`You are Yuki, a warm and cheerful Tokyo café barista helping a new employee practice Japanese customer service.

RULES:
- Roleplay as customers placing coffee orders, OR gently correct the learner's Japanese
- After any mistake, show the CORRECT Japanese naturally in your reply, then [explain briefly in English]
- Introduce ONE new word or phrase per exchange — mark it ✨
- Keep each reply to 2–4 lines MAXIMUM
- Format all Japanese naturally, add [English translation in brackets]
- Be encouraging! Mistakes are part of learning
- Scene vocab: いらっしゃいませ, ご注文, サイズ, お持ち帰り, お待ちください, 合計`
  },
  {
    id:"hotel", kanji:"ホテル", reading:"ほてる", english:"Hotel",
    role:"Front Desk", emoji:"🏨", color:"#1e3a5f",
    subtitle:"Reception desk at a Kyoto ryokan",
    vocab:[
      {jp:"チェックインをお願いします",read:"chekku-in o onegai shimasu",en:"I'd like to check in"},
      {jp:"ご予約のお名前をお聞かせください",read:"go-yoyaku no o-namae o o-kikase kudasai",en:"May I have your reservation name?"},
      {jp:"お部屋はご用意できております",read:"o-heya wa go-yōi dekite orimasu",en:"Your room is ready"},
      {jp:"朝食は七時からでございます",read:"chōshoku wa shichi-ji kara de gozaimasu",en:"Breakfast starts at 7 AM"},
      {jp:"エレベーターはこちらです",read:"erebētā wa kochira desu",en:"The elevator is this way"},
      {jp:"ごゆっくりお過ごしください",read:"go-yukkuri o-sugoshi kudasai",en:"Please enjoy your stay"},
    ],
    manga:[
      {setting:"A guest enters pulling a rolling suitcase",speaker:"Guest",jp:"チェックインをお願いします。",en:"I'd like to check in.",sfx:"ゴロゴロ",isUser:false},
      {setting:"You bow gracefully at the marble desk",speaker:"You 🏨",jp:"いらっしゃいませ。ご予約のお名前をお聞かせください。",en:"Welcome. May I have your reservation name?",sfx:"",isUser:true},
      {setting:"Guest hands over their passport",speaker:"Guest",jp:"田中と申します。",en:"My name is Tanaka.",sfx:"スッ",isUser:false},
      {setting:"You present the key card with both hands",speaker:"You 🏨",jp:"田中様、お部屋はご用意できております。ごゆっくりお過ごしください。",en:"Ms. Tanaka, your room is ready. Please enjoy your stay.",sfx:"",isUser:true},
    ],
    system:`You are Kenji, a calm and professional front desk staff at a traditional Kyoto ryokan. Help the learner practice hotel Japanese, especially keigo (honorific speech).

RULES:
- Roleplay check-in, room requests, questions about facilities, check-out
- Teach keigo: show plain form vs. polite form side by side when relevant
- Keep each reply to 2–4 lines
- Format: Japanese naturally, [English in brackets]
- Mark one new phrase per message with ✨
- Be gracious and patient — hotel staff are exceptionally polite in Japan`
  },
  {
    id:"conbini", kanji:"コンビニ", reading:"こんびに", english:"Convenience Store",
    role:"Cashier", emoji:"🏪", color:"#1a5c36",
    subtitle:"Register at a 24-hour combini",
    vocab:[
      {jp:"袋はご利用ですか？",read:"fukuro wa go-riyō desu ka?",en:"Would you like a bag?"},
      {jp:"温めますか？",read:"atatame masu ka?",en:"Shall I heat this up?"},
      {jp:"ポイントカードはお持ちですか？",read:"pointo kādo wa o-mochi desu ka?",en:"Do you have a points card?"},
      {jp:"お会計は○○円です",read:"o-kaikei wa ___ en desu",en:"Your total is ___ yen"},
      {jp:"お釣りは○○円です",read:"o-tsuri wa ___ en desu",en:"Your change is ___ yen"},
      {jp:"レシートはご入用ですか？",read:"reshīto wa go-inyū desu ka?",en:"Would you like a receipt?"},
    ],
    manga:[
      {setting:"Customer places items on the counter",speaker:"Customer",jp:"お弁当とこれ、お願いします。",en:"This bento and this one, please.",sfx:"ドン",isUser:false},
      {setting:"You scan the bento box",speaker:"You 🏪",jp:"お弁当、温めますか？",en:"Shall I warm up the bento?",sfx:"ピッ",isUser:true},
      {setting:"Customer nods",speaker:"Customer",jp:"はい、お願いします。袋も一枚。",en:"Yes please. And one bag too.",sfx:"",isUser:false},
      {setting:"You bag the items and hit total",speaker:"You 🏪",jp:"合計で540円です。ポイントカードはお持ちですか？",en:"Total is 540 yen. Do you have a points card?",sfx:"チン",isUser:true},
    ],
    system:`You are Mika, a fast and efficient convenience store cashier at a Japanese combini. Help the learner master the combini cashier script.

RULES:
- The combini script is almost formulaic in Japan — teach that pattern!
- Roleplay scanning items, asking standard questions, giving change
- Include practice with numbers (prices in yen) 
- Keep each reply to 2–4 lines
- Format: Japanese, [English]
- Mark one new expression per message with ✨
- Pace is fast — combini interactions are quick and polished`
  },
  {
    id:"restaurant", kanji:"レストラン", reading:"れすとらん", english:"Restaurant",
    role:"Server", emoji:"🍜", color:"#8a3a00",
    subtitle:"Serving at a Tokyo ramen shop",
    vocab:[
      {jp:"何名様ですか？",read:"nan-mei-sama desu ka?",en:"How many in your party?"},
      {jp:"こちらへどうぞ",read:"kochira e dōzo",en:"This way, please"},
      {jp:"ご注文はお決まりですか？",read:"go-chūmon wa o-kimari desu ka?",en:"Ready to order?"},
      {jp:"おすすめは味噌ラーメンです",read:"osusume wa miso rāmen desu",en:"I recommend the miso ramen"},
      {jp:"お会計をお願いします",read:"o-kaikei o onegai shimasu",en:"The check, please"},
      {jp:"ご馳走様でした",read:"gochisōsama deshita",en:"Thank you for the meal (said to staff after eating)"},
    ],
    manga:[
      {setting:"Two customers stand at the entrance",speaker:"Customers",jp:"二人なんですが、いいですか？",en:"There are two of us — is that okay?",sfx:"",isUser:false},
      {setting:"You grab two menus with a smile",speaker:"You 🍜",jp:"もちろんです！こちらへどうぞ。",en:"Of course! Right this way.",sfx:"",isUser:true},
      {setting:"Customers look at the menu board",speaker:"Customer",jp:"おすすめは何ですか？",en:"What do you recommend?",sfx:"",isUser:false},
      {setting:"You point to the menu enthusiastically",speaker:"You 🍜",jp:"当店の味噌ラーメンが大人気です！チャーシューが絶品ですよ。",en:"Our miso ramen is super popular! The chashu pork is amazing.",sfx:"",isUser:true},
    ],
    system:`You are Ryu, an energetic ramen shop server in Tokyo. Help the learner practice restaurant Japanese.

RULES:
- Roleplay seating, taking orders, recommending dishes, handling the check
- Be enthusiastic about the food — passion is key in Japanese hospitality
- Teach restaurant-specific vocabulary (席, 注文, おすすめ, お会計...)
- Keep each reply to 2–4 lines
- Format: Japanese, [English]
- Mark one new food/service term with ✨ per message`
  },
  {
    id:"station", kanji:"駅", reading:"えき", english:"Train Station",
    role:"Station Staff", emoji:"🚉", color:"#2a3fa8",
    subtitle:"Information desk at JR Shinjuku",
    vocab:[
      {jp:"○○行きはどのホームですか？",read:"___ yuki wa dono hōmu desu ka?",en:"Which platform for the train to ___?"},
      {jp:"次の電車は○時○分です",read:"tsugi no densha wa ___ ji ___ fun desu",en:"The next train is at ___"},
      {jp:"○番線からご乗車ください",read:"___ bansen kara go-jōsha kudasai",en:"Please board from platform ___"},
      {jp:"乗り換えが必要です",read:"norikae ga hitsuyō desu",en:"You'll need to transfer"},
      {jp:"ICカードで乗れます",read:"IC kādo de noremasu",en:"You can ride with an IC card"},
      {jp:"終電は○時です",read:"shūden wa ___ ji desu",en:"The last train is at ___"},
    ],
    manga:[
      {setting:"A confused tourist approaches with a map",speaker:"Tourist",jp:"すみません、渋谷に行きたいんですが…",en:"Excuse me, I want to get to Shibuya...",sfx:"キョロキョロ",isUser:false},
      {setting:"You point confidently toward the platforms",speaker:"You 🚉",jp:"3番線です。あと5分で来ますよ。",en:"Platform 3. It arrives in 5 minutes.",sfx:"",isUser:true},
      {setting:"Tourist looks relieved but asks more",speaker:"Tourist",jp:"乗り換えはありますか？",en:"Do I need to transfer?",sfx:"",isUser:false},
      {setting:"You sketch a quick route on a small notepad",speaker:"You 🚉",jp:"新宿で山手線に乗り換えてください。ICカードが使えますよ。",en:"Transfer to the Yamanote Line at Shinjuku. Your IC card works there.",sfx:"サラサラ",isUser:true},
    ],
    system:`You are Hiro, a helpful station information staff at JR Shinjuku. Help the learner practice giving directions, times, and transit information in Japanese.

RULES:
- Roleplay: passengers asking directions, times, transfers, tickets, IC cards
- Include numbers (platform numbers, departure times) for practice
- Keep each reply to 2–4 lines — station interactions are quick!
- Format: Japanese, [English]
- Mark one new station term with ✨ per message`
  },
];

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function speakJP(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, ""));
  u.lang = "ja-JP"; u.rate = 0.82; u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const jv = voices.find(v => v.lang.startsWith("ja"));
  if (jv) u.voice = jv;
  window.speechSynthesis.speak(u);
}

async function askClaude(msgs, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: msgs.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "ごめんなさい！もう一度試してください。[Sorry, please try again.]";
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [scene, setScene] = useState(null);
  const [tab, setTab] = useState("phrases");
  const [romaji, setRomaji] = useState(true);
  const [mangaPanel, setMangaPanel] = useState(0);
  const [msgs, setMsgs] = useState([]);

  const selectScene = (s) => { setScene(s); setTab("phrases"); setMangaPanel(0); setMsgs([]); };
  const backToSelect = () => { setScene(null); window.speechSynthesis?.cancel(); };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: UF, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      {!scene
        ? <SceneSelect onSelect={selectScene} />
        : <MainApp scene={scene} tab={tab} setTab={setTab} romaji={romaji} setRomaji={setRomaji}
            mangaPanel={mangaPanel} setMangaPanel={setMangaPanel}
            msgs={msgs} setMsgs={setMsgs} onBack={backToSelect} />
      }
    </div>
  );
}

// ─────────────────────────────────────────────
// SCENE SELECT
// ─────────────────────────────────────────────
function SceneSelect({ onSelect }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ padding: "48px 24px 28px", position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: "absolute", right: 16, top: 16, fontFamily: JF, fontSize: 88, fontWeight: 800, color: "rgba(255,255,255,0.025)", lineHeight: 1, writingMode: "vertical-rl", letterSpacing: ".05em", userSelect: "none", pointerEvents: "none" }}>日本語学習</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.accent}, transparent)` }} />
        <div style={{ display: "inline-block", background: C.accent, color: "#fff", fontSize: 8, letterSpacing: ".18em", padding: "4px 10px", borderRadius: 2, marginBottom: 18, fontWeight: 600 }}>SITUATIONAL JAPANESE</div>
        <div style={{ fontFamily: JF, fontSize: 48, fontWeight: 600, lineHeight: 1.05, marginBottom: 10, fontStyle: "italic" }}>
          働く<br /><span style={{ color: C.accent }}>日本語</span>
        </div>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.8, maxWidth: 260, fontFamily: UF, fontWeight: 300 }}>
          Real Japanese for real work situations.<br />Voice practice · Manga lessons · AI tutor
        </div>
      </div>

      {/* Scene list */}
      <div style={{ padding: "24px 20px 48px" }}>
        <div style={{ fontSize: 9, color: C.text2, letterSpacing: ".16em", marginBottom: 16, fontFamily: UF, fontWeight: 400 }}>Choose your scene ↓</div>
        {SCENES.map((s, i) => (
          <button key={s.id} className="scene-card" onClick={() => onSelect(s)} style={{
            display: "block", width: "100%", textAlign: "left",
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `2px solid ${C.accent}`,
            borderRadius: 10, padding: "15px 16px", marginBottom: 10,
            color: C.text, transition: "all 0.18s",
            animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24, lineHeight: 1, opacity: 0.85 }}>{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: JF, fontSize: 24, fontWeight: 600, fontStyle: "italic" }}>{s.kanji}</span>
                  <span style={{ fontSize: 9, color: C.accent, letterSpacing: ".1em", fontFamily: UF }}>{s.reading.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 11, color: C.text2, marginTop: 2, fontFamily: UF, fontWeight: 300 }}>{s.subtitle}</div>
              </div>
              <div style={{ textAlign: "center", borderLeft: `1px solid ${C.border}`, paddingLeft: 14, flexShrink: 0 }}>
                <div style={{ fontFamily: JF, fontSize: 22, fontWeight: 600, color: C.text }}>{s.vocab.length}</div>
                <div style={{ fontSize: 8, color: C.text2, letterSpacing: ".1em", fontFamily: UF }}>PHRASES</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP (after scene selected)
// ─────────────────────────────────────────────
function MainApp({ scene, tab, setTab, romaji, setRomaji, mangaPanel, setMangaPanel, msgs, setMsgs, onBack }) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20, background: C.bg, backdropFilter: "blur(16px)" }}>
        <button onClick={onBack} style={{ color: C.text2, fontSize: 18, padding: "2px 10px 2px 0", lineHeight: 1 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: JF, fontSize: 26, fontWeight: 600, fontStyle: "italic", lineHeight: 1 }}>{scene.kanji}</div>
          <div style={{ fontSize: 9, color: C.text2, marginTop: 2, letterSpacing: ".1em", fontFamily: UF, fontWeight: 300 }}>{scene.english.toUpperCase()} · {scene.role.toUpperCase()}</div>
        </div>
        <button onClick={() => setRomaji(r => !r)} style={{ fontSize: 9, letterSpacing: ".1em", color: romaji ? C.accent : C.text2, border: `1px solid ${romaji ? C.accent : C.border}`, borderRadius: 20, padding: "4px 12px", transition: "all .2s", fontFamily: UF, fontWeight: 400 }}>
          {romaji ? "ローマ字 ✓" : "ローマ字"}
        </button>
      </div>

      {/* Tab Nav — pill style */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: "flex", background: C.surface2, borderRadius: 24, padding: 3, gap: 2 }}>
          {[
            { id: "phrases", jp: "フレーズ", en: "Phrases" },
            { id: "manga",   jp: "漫画",    en: "Manga"   },
            { id: "talk",    jp: "話す",    en: "Talk"    },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "7px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              borderRadius: 20,
              background: tab === t.id ? C.surface : "transparent",
              border: `1px solid ${tab === t.id ? C.border : "transparent"}`,
              color: tab === t.id ? C.accent : C.text2,
              transition: "all .2s",
            }}>
              <span style={{ fontFamily: JF, fontSize: 16, fontWeight: tab === t.id ? 600 : 400, fontStyle: "italic" }}>{t.jp}</span>
              <span style={{ fontSize: 9, letterSpacing: ".08em", fontFamily: UF, fontWeight: 300 }}>{t.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "phrases" && <PhrasesTab scene={scene} romaji={romaji} />}
      {tab === "manga" && <MangaTab scene={scene} panel={mangaPanel} setPanel={setMangaPanel} />}
      {tab === "talk" && <TalkTab scene={scene} msgs={msgs} setMsgs={setMsgs} />}
    </>
  );
}

// ─────────────────────────────────────────────
// PHRASES TAB
// ─────────────────────────────────────────────
function PhrasesTab({ scene, romaji }) {
  return (
    <div style={{ padding: "24px 18px 60px" }}>
      <div style={{ fontSize: 9, color: C.text2, letterSpacing: ".16em", marginBottom: 22, fontFamily: UF, fontWeight: 300 }}>
        {scene.vocab.length} key phrases · {scene.english}
      </div>
      {scene.vocab.map((v, i) => (
        <div key={i} className="phrase-card" style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderLeft: `2px solid ${i === 0 ? C.accent : C.border}`,
          borderRadius: 10, padding: "16px 16px", marginBottom: 10,
          animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
          transition: "border-color .2s",
          position: "relative",
        }}>
          <div style={{ fontFamily: JF, fontSize: 26, fontWeight: 600, fontStyle: "italic", letterSpacing: ".02em", marginBottom: 5, color: C.text }}>{v.jp}</div>
          {romaji && <div style={{ fontSize: 12, color: C.gold, marginBottom: 6, letterSpacing: ".04em", fontFamily: UF, fontWeight: 300 }}>{v.read}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.text2, fontFamily: UF, fontWeight: 300 }}>{v.en}</div>
            <button className="phrase-play" onClick={() => speakJP(v.jp)} style={{
              width: 30, height: 30, borderRadius: "50%", border: `1px solid ${C.border}`,
              color: C.text2, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "all .2s",
            }} onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}>▶</button>
          </div>
          <button onClick={() => speakJP(v.jp)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", borderRadius: 10 }} aria-label="play" />
        </div>
      ))}
      <div style={{ marginTop: 18, padding: "15px 17px", background: C.accentDim, border: `1px solid rgba(160,104,40,0.18)`, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.75, fontFamily: UF, fontWeight: 300 }}>
        <span style={{ color: C.accent, fontWeight: 500, display: "block", marginBottom: 5, letterSpacing: ".04em", fontSize: 11 }}>✦ PRO TIP</span>
        Notice the ご・お honorific prefixes on nouns (ご注文, お客様). In Japanese service culture, these show respect and signal professionalism. <span style={{ color: C.text2 }}>Tap any card to hear the pronunciation.</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MANGA TAB
// ─────────────────────────────────────────────
function MangaTab({ scene, panel, setPanel }) {
  const p = scene.manga[panel];
  const total = scene.manga.length;
  return (
    <div style={{ padding: "18px 18px 60px" }}>
      {/* Progress bars */}
      <div style={{ display: "flex", gap: 5, marginBottom: 20 }}>
        {scene.manga.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= panel ? C.accent : C.border, transition: "background .3s", cursor: "pointer" }} onClick={() => setPanel(i)} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: C.text2, letterSpacing: ".15em", marginBottom: 16, fontFamily: UF, fontWeight: 300 }}>Scene {panel + 1} / {total}</div>

      {/* Manga panel artwork */}
      <div key={panel} style={{ borderRadius: 4, overflow: "hidden", marginBottom: 16, boxShadow: "0 6px 28px rgba(30,18,8,.12)", border: "3px solid #1a1208", animation: "mangaFlip .3s ease" }}>
        <SceneArt scene={scene} panel={panel} />
      </div>

      {/* Setting caption */}
      <div style={{ fontSize: 11, color: C.text2, textAlign: "center", fontStyle: "italic", marginBottom: 16, fontFamily: JF, letterSpacing: ".03em" }}>
        ―  {p.setting}  ―
      </div>

      {/* Speech bubble */}
      <div style={{
        background: p.isUser ? C.accentDim : C.surface,
        border: `1px solid ${p.isUser ? `rgba(160,104,40,.28)` : C.border}`,
        borderRadius: 12, padding: "18px 18px", marginBottom: 16, position: "relative",
      }}>
        <div style={{ fontSize: 9, letterSpacing: ".14em", color: p.isUser ? C.accent : C.text2, marginBottom: 8, fontFamily: UF, fontWeight: 500 }}>
          {p.speaker.toUpperCase()}
        </div>
        <div style={{ fontFamily: JF, fontSize: 24, fontWeight: 600, fontStyle: "italic", lineHeight: 1.55, letterSpacing: ".02em", marginBottom: 8, color: C.text }}>
          {p.jp}
        </div>
        {p.sfx && <div style={{ position: "absolute", top: 14, right: 52, fontFamily: JF, fontSize: 14, fontWeight: 700, color: "rgba(30,18,8,.18)", transform: "rotate(-6deg)", fontStyle: "italic" }}>{p.sfx}</div>}
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, fontFamily: UF, fontWeight: 300 }}>{p.en}</div>
        <button onClick={() => speakJP(p.jp)} style={{
          position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%",
          border: `1px solid ${C.border}`, color: C.text2, fontSize: 11,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s"
        }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>▶</button>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={panel === 0} onClick={() => setPanel(p => Math.max(0, p - 1))} style={{
          flex: 1, padding: "13px", borderRadius: 24, fontSize: 12, letterSpacing: ".06em",
          background: "transparent",
          border: `1px solid ${panel === 0 ? C.border : C.borderHover}`,
          color: panel === 0 ? C.text3 : C.text2, transition: "all .2s",
          fontFamily: UF, fontWeight: 400,
        }}>← Prev</button>
        <button disabled={panel === total - 1} onClick={() => setPanel(p => Math.min(total - 1, p + 1))} style={{
          flex: 1, padding: "13px", borderRadius: 24, fontSize: 12, letterSpacing: ".06em", fontWeight: 500,
          background: panel === total - 1 ? "transparent" : C.accent,
          border: `1px solid ${panel === total - 1 ? C.border : C.accent}`,
          color: panel === total - 1 ? C.text3 : "#fff", transition: "all .2s",
          fontFamily: UF,
        }}>Next →</button>
      </div>

      {panel === total - 1 && (
        <div style={{ marginTop: 16, padding: "14px 16px", background: C.accentDim, border: `1px solid rgba(160,104,40,0.22)`, borderRadius: 10, fontSize: 13, color: C.text, textAlign: "center", lineHeight: 1.7, fontFamily: UF, fontWeight: 300 }}>
          Scene complete — switch to <em style={{ fontFamily: JF, fontSize: 16, fontWeight: 600 }}>話す</em> to practice with AI.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CSS SCENE ILLUSTRATIONS
// ─────────────────────────────────────────────
function SceneArt({ scene, panel }) {
  const artMap = { coffee: CoffeeArt, hotel: HotelArt, conbini: ConbiniArt, restaurant: RestaurantArt, station: StationArt };
  const Art = artMap[scene.id] || (() => <div style={{ width: "100%", height: 180, background: "#eee" }} />);
  return <Art panel={panel} />;
}

const MANGA_BG = { background: "#f7f3ec", width: "100%", height: 185, position: "relative", overflow: "hidden" };

function CoffeeArt({ panel }) {
  return (
    <div style={MANGA_BG}>
      {/* Wall / floor */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #fdf8f0 60%, #e8d8c0 60%)" }} />
      {/* Window */}
      <div style={{ position: "absolute", top: 12, left: 16, width: 52, height: 64, background: "rgba(200,230,255,.4)", border: "3px solid #c8a87a" }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
          {[0,1,2,3].map(i => <div key={i} style={{ border: "1.5px solid #c8a87a" }} />)}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,240,200,.4) 0%, transparent 60%)" }} />
      </div>
      {/* Menu board */}
      <div style={{ position: "absolute", top: 10, right: 14, width: 64, height: 52, background: "#2a1a0a", borderRadius: 2, border: "3px solid #5a3a1a", display: "flex", flexDirection: "column", gap: 3, padding: 5 }}>
        {["ラテ　¥450","コーヒー　¥380","抹茶　¥520"].map((t, i) => (
          <div key={i} style={{ fontSize: 6, color: "#f0d090", fontFamily: JF, whiteSpace: "nowrap" }}>{t}</div>
        ))}
      </div>
      {/* Counter */}
      <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, height: 8, background: "#3a2010" }} />
      <div style={{ position: "absolute", bottom: 34, left: 0, right: 0, height: 30, background: "#5a3018" }} />
      {/* Cup on counter */}
      <div style={{ position: "absolute", bottom: 36, left: "42%", transform: "translateX(-50%)" }}>
        <div style={{ width: 28, height: 22, background: "#fff", border: "2.5px solid #222", borderRadius: "2px 2px 5px 5px", position: "relative" }}>
          <div style={{ position: "absolute", right: -7, top: 5, width: 7, height: 11, border: "2.5px solid #222", borderLeft: "none", borderRadius: "0 5px 5px 0" }} />
          <div style={{ margin: "4px 4px 0", height: 5, background: "#6b3a1f", borderRadius: 2 }} />
        </div>
        <div className="steam" style={{ position: "absolute", bottom: "100%", left: "30%", width: 2.5, height: 10, background: "rgba(80,50,20,.35)", borderRadius: 3 }} />
        <div className="steam2" style={{ position: "absolute", bottom: "100%", left: "65%", width: 2.5, height: 8, background: "rgba(80,50,20,.25)", borderRadius: 3 }} />
      </div>
      {/* Barista */}
      <div style={{ position: "absolute", bottom: 64, right: "22%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 22, height: 22, background: "#4a3020", borderRadius: "50%", marginBottom: 1 }} />
        <div style={{ width: 28, height: 30, background: "#e8e8e8", borderRadius: "8px 8px 0 0" }} />
        <div style={{ position: "absolute", top: 2, width: 22, height: 10, background: "#222", borderRadius: "50% 50% 0 0" }} />
      </div>
      {/* Customer - visible on panel 0 */}
      {panel === 0 && (
        <div style={{ position: "absolute", bottom: 64, left: "18%", animation: "slideIn .3s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 20, height: 20, background: "#6b5040", borderRadius: "50%", marginBottom: 1 }} />
          <div style={{ width: 26, height: 28, background: "#6688aa", borderRadius: "8px 8px 0 0" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, border: "4px solid #111", borderRadius: 1, pointerEvents: "none" }} />
    </div>
  );
}

function HotelArt({ panel }) {
  return (
    <div style={MANGA_BG}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #f8f5ee 55%, #d8cfc0 55%)" }} />
      {/* Pillars */}
      {[0.1, 0.78].map((x, i) => (
        <div key={i} style={{ position: "absolute", bottom: 0, left: `${x * 100}%`, width: 14, height: "100%", background: "#d0c0a8", border: "2px solid #b8a888" }} />
      ))}
      {/* Reception desk */}
      <div style={{ position: "absolute", bottom: 28, left: "18%", right: "22%", height: 42, background: "#8b6040", borderRadius: "2px 2px 0 0", border: "2px solid #5a3820" }} />
      <div style={{ position: "absolute", bottom: 70, left: "18%", right: "22%", height: 8, background: "#6b4828" }} />
      {/* Logo on desk */}
      <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", fontFamily: JF, fontSize: 10, fontWeight: 800, color: "#f0d090", whiteSpace: "nowrap" }}>御宿</div>
      {/* Staff behind desk */}
      <div style={{ position: "absolute", bottom: 78, left: "52%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 18, height: 18, background: "#4a3020", borderRadius: "50%", marginBottom: 1 }} />
        <div style={{ width: 22, height: 24, background: "#1a2840", borderRadius: "6px 6px 0 0" }} />
      </div>
      {/* Guest with luggage */}
      {panel !== 3 && (
        <div style={{ position: "absolute", bottom: 28, left: "18%", animation: "slideIn .3s ease" }}>
          <div style={{ width: 18, height: 18, background: "#6b5040", borderRadius: "50%", marginBottom: 1 }} />
          <div style={{ width: 22, height: 26, background: "#557788", borderRadius: "6px 6px 0 0" }} />
          {/* luggage */}
          <div style={{ position: "absolute", bottom: 0, left: 24, width: 12, height: 18, background: "#888", border: "2px solid #555", borderRadius: 2 }}>
            <div style={{ width: 6, height: 3, background: "#666", margin: "2px auto" }} />
          </div>
        </div>
      )}
      {/* Plant */}
      <div style={{ position: "absolute", bottom: 28, right: "20%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 14, height: 22, background: "#2d7a3a", borderRadius: "50% 50% 10% 10%", position: "relative" }}>
          <div style={{ position: "absolute", top: 6, left: -6, width: 12, height: 10, background: "#3d9a4a", borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: 6, right: -5, width: 11, height: 9, background: "#2d8a3a", borderRadius: "50%" }} />
        </div>
        <div style={{ width: 16, height: 10, background: "#a06030", borderRadius: "0 0 3px 3px", border: "1px solid #7a4020" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, border: "4px solid #111", borderRadius: 1, pointerEvents: "none" }} />
    </div>
  );
}

function ConbiniArt({ panel }) {
  return (
    <div style={MANGA_BG}>
      <div style={{ position: "absolute", inset: 0, background: "#f8f8f8" }} />
      {/* Bright ceiling lights */}
      {[0.15, 0.5, 0.85].map((x, i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: `${x * 100}%`, transform: "translateX(-50%)", width: 40, height: 8, background: "rgba(255,255,200,.9)", boxShadow: "0 4px 16px rgba(255,255,200,.6)" }} />
      ))}
      {/* Shelves */}
      <div style={{ position: "absolute", top: 14, right: 6, width: 72, bottom: 36 }}>
        {[0,1,2,3].map(r => (
          <div key={r} style={{ marginBottom: 3 }}>
            <div style={{ height: 2, background: "#aaa", marginBottom: 1 }} />
            <div style={{ display: "flex", gap: 1 }}>
              {[..."abcde"].map((c, j) => <div key={c} style={{ flex: 1, height: 22, background: ["#e74c3c","#3498db","#f39c12","#2ecc71","#9b59b6"][j], borderRadius: 1 }} />)}
            </div>
          </div>
        ))}
      </div>
      {/* Counter */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: "42%", height: 8, background: "#666" }} />
      <div style={{ position: "absolute", bottom: 36, left: 0, right: "42%", height: 32, background: "#888", border: "1px solid #777" }} />
      {/* Register */}
      <div style={{ position: "absolute", bottom: 36, left: "22%", width: 36, height: 28, background: "#27ae60", borderRadius: 3, border: "2px solid #1a8a4a" }}>
        <div style={{ margin: "4px 4px", height: 10, background: "#1a6a30", borderRadius: 2 }} />
        <div style={{ display: "flex", gap: 2, padding: "0 4px" }}>
          {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 6, background: "#0d4a20", borderRadius: 1 }} />)}
        </div>
      </div>
      {/* Staff */}
      <div style={{ position: "absolute", bottom: 68, left: "12%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 16, height: 16, background: "#4a3020", borderRadius: "50%", marginBottom: 1 }} />
        <div style={{ width: 20, height: 22, background: "#27ae60", borderRadius: "6px 6px 0 0" }} />
      </div>
      {/* Customer */}
      {panel <= 2 && (
        <div style={{ position: "absolute", bottom: 36, left: "48%", animation: "slideIn .3s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 16, height: 16, background: "#6b5040", borderRadius: "50%", marginBottom: 1 }} />
          <div style={{ width: 20, height: 22, background: "#4488bb", borderRadius: "6px 6px 0 0" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, border: "4px solid #111", borderRadius: 1, pointerEvents: "none" }} />
    </div>
  );
}

function RestaurantArt({ panel }) {
  return (
    <div style={MANGA_BG}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #fdf6ec 65%, #c8a870 65%)" }} />
      {/* Noren (暖簾) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex" }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 28, background: "#c0392b", marginRight: 2, borderRadius: "0 0 3px 3px", border: "1px solid #8a2010" }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", fontFamily: JF, fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: ".05em" }}>拉麺</div>
      {/* Table */}
      <div style={{ position: "absolute", bottom: 30, left: "28%", right: "28%", height: 10, background: "#5a3818" }} />
      <div style={{ position: "absolute", bottom: 40, left: "24%", right: "24%", height: 6, background: "#3a2010", borderRadius: 2 }} />
      {/* Bowl on table */}
      <div style={{ position: "absolute", bottom: 46, left: "50%", transform: "translateX(-50%)" }}>
        <div style={{ width: 40, height: 22, background: "#fff", border: "3px solid #222", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
          <div style={{ background: "#b84010", height: 12, margin: "4px 4px 0", borderRadius: 4 }} />
          <div style={{ width: 14, height: 8, background: "#d07030", borderRadius: "50%", margin: "-2px auto 0", position: "relative" }} />
        </div>
        <div className="steam" style={{ position: "absolute", bottom: "100%", left: "28%", width: 2.5, height: 10, background: "rgba(180,80,10,.3)", borderRadius: 3 }} />
        <div className="steam2" style={{ position: "absolute", bottom: "100%", left: "65%", width: 2.5, height: 12, background: "rgba(180,80,10,.25)", borderRadius: 3 }} />
      </div>
      {/* Server */}
      <div style={{ position: "absolute", bottom: 30, right: "22%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 18, height: 18, background: "#4a3020", borderRadius: "50%", marginBottom: 1 }} />
        <div style={{ width: 22, height: 26, background: "#fff", borderRadius: "6px 6px 0 0", border: "1px solid #ddd" }} />
      </div>
      {/* Customers */}
      {panel <= 1 && (
        <>
          <div style={{ position: "absolute", bottom: 30, left: "14%", animation: "slideIn .3s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 16, height: 16, background: "#6b5040", borderRadius: "50%", marginBottom: 1 }} />
            <div style={{ width: 20, height: 22, background: "#5577aa", borderRadius: "6px 6px 0 0" }} />
          </div>
          <div style={{ position: "absolute", bottom: 30, left: "28%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 16, height: 16, background: "#8b6050", borderRadius: "50%", marginBottom: 1 }} />
            <div style={{ width: 20, height: 22, background: "#aa5577", borderRadius: "6px 6px 0 0" }} />
          </div>
        </>
      )}
      <div style={{ position: "absolute", inset: 0, border: "4px solid #111", borderRadius: 1, pointerEvents: "none" }} />
    </div>
  );
}

function StationArt({ panel }) {
  return (
    <div style={MANGA_BG}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #eef2f9 60%, #c0c8d8 60%)" }} />
      {/* Platform yellow line */}
      <div style={{ position: "absolute", bottom: 55, left: 0, right: 0, height: 6, background: "#f1c40f", borderTop: "2px solid #d4aa00", borderBottom: "2px solid #d4aa00" }} />
      {/* Tracks */}
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0 }}>
        <div style={{ height: 5, background: "#555", marginBottom: 14 }} />
        <div style={{ height: 5, background: "#555" }} />
      </div>
      {/* Train (partial) */}
      <div style={{ position: "absolute", bottom: 61, right: -4, width: 90, height: 80, background: "#2855a0", borderRadius: "10px 10px 0 0", border: "2px solid #1a3a78" }}>
        <div style={{ display: "flex", gap: 4, padding: "8px 8px 0" }}>
          <div style={{ flex: 1, height: 26, background: "#c0d8ee", borderRadius: 2 }} />
          <div style={{ flex: 1, height: 26, background: "#c0d8ee", borderRadius: 2 }} />
        </div>
        <div style={{ height: 6, background: "#fff", margin: "4px 12px" }} />
        <div style={{ height: 3, background: "#c0d8ee", margin: "0 8px" }} />
      </div>
      {/* Platform sign */}
      <div style={{ position: "absolute", top: 18, left: "12%", width: 68, height: 28, background: "#2855a0", borderRadius: 3, border: "2px solid #1a3a78", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 11, fontFamily: JF, fontWeight: 900 }}>3番線</span>
      </div>
      {/* Route sign */}
      <div style={{ position: "absolute", top: 56, left: "12%", width: 68, height: 20, background: "#f0f0f0", borderRadius: 2, border: "1px solid #bbb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 7, color: "#333", fontFamily: JF }}>→ 渋谷・品川</span>
      </div>
      {/* Staff */}
      <div style={{ position: "absolute", bottom: 61, left: "40%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 18, height: 18, background: "#4a3020", borderRadius: "50%", marginBottom: 1 }} />
        <div style={{ width: 22, height: 26, background: "#2855a0", borderRadius: "6px 6px 0 0" }} />
        {/* Flag/baton */}
        {panel <= 1 && <div style={{ position: "absolute", top: 4, left: 22, width: 2, height: 16, background: "#222" }}><div style={{ width: 12, height: 8, background: "#e82a2a", marginTop: -2, borderRadius: "0 2px 2px 0" }} /></div>}
      </div>
      {/* Tourist */}
      {panel % 2 === 0 && (
        <div style={{ position: "absolute", bottom: 61, left: "20%", animation: "slideIn .3s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 18, height: 18, background: "#7a6050", borderRadius: "50%", marginBottom: 1 }} />
          <div style={{ width: 22, height: 26, background: "#ee8833", borderRadius: "6px 6px 0 0" }} />
          {/* Backpack */}
          <div style={{ position: "absolute", bottom: 2, left: -8, width: 8, height: 16, background: "#cc5522", borderRadius: "2px 2px 3px 3px" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, border: "4px solid #111", borderRadius: 1, pointerEvents: "none" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// TALK TAB
// ─────────────────────────────────────────────
function TalkTab({ scene, msgs, setMsgs }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const endRef = useRef(null);
  const recogRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with a greeting when msgs is empty
  useEffect(() => {
    if (msgs.length === 0) {
      setMsgs([{
        role: "assistant",
        content: `こんにちは！${scene.kanji}の練習を始めましょう！\n[Hi! Let's start practicing at the ${scene.english}!]\n\nI'm your AI tutor for this scene. Try saying:\n「${scene.vocab[0].jp}」\n[${scene.vocab[0].en}] ✨\n\nOr just type in English to ask me anything about this scene.`
      }]);
    }
  }, [scene]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const reply = await askClaude(newMsgs, scene.system);
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "エラーが発生しました！[Connection error — please try again.]" }]);
    }
    setLoading(false);
  };

  const startListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Try Chrome!"); return; }
    const r = new SR();
    r.lang = "ja-JP"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = e => { send(e.results[0][0].transcript); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 138px)" }}>
      {/* Scene context banner */}
      <div style={{ padding: "8px 18px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 15, opacity: .8 }}>{scene.emoji}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 9, color: C.accent, letterSpacing: ".1em", fontFamily: UF, fontWeight: 500 }}>SCENE  </span>
          <span style={{ fontSize: 11, color: C.text2, fontFamily: UF, fontWeight: 300 }}>{scene.subtitle}</span>
        </div>
        <button onClick={() => setShowHints(h => !h)} style={{ fontSize: 9, letterSpacing: ".08em", color: showHints ? C.accent : C.text2, border: `1px solid ${showHints ? C.accent : C.border}`, borderRadius: 20, padding: "3px 11px", fontFamily: UF, fontWeight: 400 }}>
          Hints {showHints ? "▲" : "▼"}
        </button>
      </div>

      {/* Hint phrases */}
      {showHints && (
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, overflowX: "auto", flexShrink: 0 }}>
          {scene.vocab.slice(0, 5).map((v, i) => (
            <button key={i} onClick={() => { setInput(v.jp); setShowHints(false); inputRef.current?.focus(); }} style={{
              flexShrink: 0, padding: "5px 13px", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 20, fontSize: 14, color: C.text, fontFamily: JF, fontStyle: "italic", whiteSpace: "nowrap",
              transition: "all .2s",
            }} onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              {v.jp}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 8px" }}>
        {msgs.map((m, i) => (
          <div key={i} className="msg-in" style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ fontSize: 9, color: C.text2, marginBottom: 5, letterSpacing: ".1em", fontFamily: UF, fontWeight: 300 }}>AI Tutor · {scene.role}</div>
            )}
            <div style={{
              maxWidth: "88%", padding: "13px 16px",
              borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
              background: m.role === "user" ? C.accent : C.surface,
              border: `1px solid ${m.role === "user" ? "transparent" : C.border}`,
              fontSize: m.role === "assistant" ? 17 : 14, lineHeight: 1.8, whiteSpace: "pre-wrap",
              fontFamily: m.role === "assistant" ? JF : UF,
              fontStyle: m.role === "assistant" ? "italic" : "normal",
              fontWeight: m.role === "assistant" ? 500 : 300,
              letterSpacing: m.role === "assistant" ? ".02em" : "normal",
              color: m.role === "user" ? "#fff" : C.text,
            }}>{m.content}</div>
            {m.role === "assistant" && (
              <button onClick={() => { const jpLine = m.content.split("\n").find(l => /[\u3040-\u30ff\u4e00-\u9fff]/.test(l)) || m.content; speakJP(jpLine); }} style={{ marginTop: 5, fontSize: 9, color: C.text2, letterSpacing: ".1em", padding: "3px 10px", border: `1px solid ${C.border}`, borderRadius: 20, fontFamily: UF, fontWeight: 300 }}>
                ▶ Play
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 5, padding: "8px 12px", alignItems: "center" }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.text3, animation: `dot 1.4s ${i * 0.16}s ease-in-out infinite` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0, background: C.bg }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
          placeholder="日本語 or English..."
          style={{ flex: 1, padding: "11px 15px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, color: C.text, fontSize: 14, fontFamily: JF, fontStyle: "italic", transition: "border-color .2s" }}
        />
        {/* Mic */}
        <button onClick={listening ? () => { recogRef.current?.stop(); setListening(false); } : startListen} style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: listening ? C.accent : C.surface, border: `1px solid ${listening ? C.accent : C.border}`,
          color: listening ? "#fff" : C.text2, fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: listening ? "pulse 1.5s ease-in-out infinite" : "none",
          position: "relative", transition: "all .2s",
        }}>
          {listening ? "⏹" : "🎤"}
          {listening && <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: `2px solid ${C.accent}`, animation: "ripple 1.5s ease-out infinite" }} />}
        </button>
        {/* Send */}
        <button onClick={() => send(input)} disabled={!input.trim() || loading} style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: input.trim() && !loading ? C.accent : C.surface,
          border: `1px solid ${input.trim() && !loading ? C.accent : C.border}`,
          color: input.trim() && !loading ? "#fff" : C.text2, fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s",
        }}>→</button>
      </div>
    </div>
  );
}
