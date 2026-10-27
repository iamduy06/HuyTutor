/**
 * Shared audio utilities — dùng chung cho FlashcardPlayer và Game modes.
 * fetchDictAudio: lấy URL phát âm từ dictionaryapi.dev (US accent ưu tiên)
 * browserTTS: fallback khi API lỗi hoặc timeout
 */

export async function fetchDictAudio(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const entry of data) {
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.includes("us")) return ph.audio;
      }
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.trim()) return ph.audio;
      }
    }
  } catch {}
  return null;
}

export function browserTTS(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }, 50);
}

let sharedAudio: HTMLAudioElement | null = null;
let isUnlocked = false;

export function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
  }
  return sharedAudio;
}

export function unlockSharedAudio() {
  if (isUnlocked) return;
  const audio = getSharedAudio();
  if (audio) {
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    audio.play().then(() => {
      audio.pause();
      isUnlocked = true;
    }).catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  const unlockFn = () => {
    unlockSharedAudio();
    document.removeEventListener('click', unlockFn);
    document.removeEventListener('touchstart', unlockFn);
  };
  document.addEventListener('click', unlockFn);
  document.addEventListener('touchstart', unlockFn);
}

/**
 * Phát âm 1 từ: cache → fetch API → fallback TTS
 * @param raw     từ cần phát âm (đã được normalize bên ngoài)
 * @param cache   Map<word, url> để tái sử dụng
 * @param onLoad  callback khi bắt đầu load (set loading state)
 * @param onDone  callback khi xong (clear loading state)
 */
export async function speakWordWithCache(
  raw: string,
  cache: Map<string, string>,
  audioRef: { current: HTMLAudioElement | null },
  tokenRef: { current: number },
  onLoad: () => void,
  onDone: () => void
) {
  if (!raw) return;

  if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  window.speechSynthesis?.cancel();

  // 1. Cache hit
  const cachedUrl = cache.get(raw);
  if (cachedUrl) {
    const audio = getSharedAudio();
    if (audio) {
      audio.src = cachedUrl;
      audioRef.current = audio;
      audio.play().catch(() => browserTTS(raw));
    }
    return;
  }

  // 2. Fetch
  onLoad();
  const token = ++tokenRef.current;
  const fallback = () => {
    if (token === tokenRef.current) { onDone(); browserTTS(raw); }
  };

  try {
    const url = await Promise.race([
      fetchDictAudio(raw),
      new Promise<string | null>(r => setTimeout(() => r(null), 4000)),
    ]);
    if (token !== tokenRef.current) return;
    if (!url) { fallback(); return; }

    cache.set(raw, url);
    const audio = getSharedAudio();
    if (!audio) return;
    audio.src = url;
    audioRef.current = audio;
    const t = setTimeout(fallback, 4000);

    audio.oncanplaythrough = () => {
      if (token !== tokenRef.current) { clearTimeout(t); audio.pause(); return; }
      clearTimeout(t); onDone();
      audio.play().catch(fallback);
    };
    audio.onerror = () => { clearTimeout(t); fallback(); };
    audio.load();
  } catch { fallback(); }
}
