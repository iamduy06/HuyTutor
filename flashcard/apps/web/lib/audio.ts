/**
 * Shared audio utilities — dùng chung cho FlashcardPlayer và Game modes.
 * - fetchDictAudio: lấy URL phát âm từ dictionaryapi.dev (US accent ưu tiên)
 * - browserTTS: phát âm tức thì qua Web Speech API (0ms latency fallback)
 * - Persistent Cache: lưu cache vĩnh viễn trong localStorage
 * - Preload Engine: nạp ngầm file mp3 vào RAM/Disk Cache trình duyệt
 * - Zero-Latency Voice: chuyển thẻ phát ngay, không bao giờ phải chờ im lặng
 */

const CACHE_STORAGE_KEY = 'huytutor_audio_cache_v2';
const NOT_FOUND_TOKEN = '__NONE__';

// In-memory mirror for 0ms synchronous lookups
const memoryCache = new Map<string, string>();
let isCacheHydrated = false;

/** Lấy từ chuẩn hóa để fetch audio (bỏ /, (), ký tự thừa và lowercase) */
export function normalizeWordForAudio(word: string): string {
  if (!word) return '';
  return word
    .split('/')[0]
    .replace(/\(.*?\)/g, '')
    .replace(/[()]/g, '')
    .trim()
    .toLowerCase();
}

function hydrateCache() {
  if (isCacheHydrated || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') memoryCache.set(k, v);
        }
      }
    }
  } catch (err) {
    console.warn('[AudioCache] Failed to hydrate from localStorage', err);
  }
  isCacheHydrated = true;
}

let persistTimeout: any = null;
function schedulePersist() {
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, string> = {};
      const entries = Array.from(memoryCache.entries());
      const trimmed = entries.slice(-1000); // giữ 1000 từ gần nhất
      for (const [k, v] of trimmed) {
        obj[k] = v;
      }
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch (err) {
      console.warn('[AudioCache] Failed to persist to localStorage', err);
    }
  }, 500);
}

export function getCachedAudioUrl(rawWord: string): string | undefined {
  hydrateCache();
  const key = normalizeWordForAudio(rawWord);
  return memoryCache.get(key);
}

export function setCachedAudioUrl(rawWord: string, url: string | null) {
  hydrateCache();
  const key = normalizeWordForAudio(rawWord);
  if (!key) return;
  memoryCache.set(key, url || NOT_FOUND_TOKEN);
  schedulePersist();
}

/** Tải file âm thanh thật vào bộ đệm HTTP của trình duyệt */
const preloadedUrls = new Set<string>();

export function preloadAudioFile(url: string) {
  if (typeof window === 'undefined' || !url || url === NOT_FOUND_TOKEN) return;
  if (preloadedUrls.has(url)) return;
  preloadedUrls.add(url);

  try {
    const a = new Audio();
    a.preload = 'auto';
    a.src = url;
    a.load();
  } catch {}
}

export async function fetchDictAudio(word: string): Promise<string | null> {
  const clean = normalizeWordForAudio(word);
  if (!clean) return null;

  hydrateCache();
  const cached = memoryCache.get(clean);
  if (cached) {
    return cached === NOT_FOUND_TOKEN ? null : cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) {
      setCachedAudioUrl(clean, null);
      return null;
    }

    const data = await res.json();
    let audioUrl: string | null = null;
    for (const entry of data) {
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.includes('us')) {
          audioUrl = ph.audio;
          break;
        }
      }
      if (audioUrl) break;
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.trim()) {
          audioUrl = ph.audio;
          break;
        }
      }
      if (audioUrl) break;
    }

    setCachedAudioUrl(clean, audioUrl);
    if (audioUrl) {
      preloadAudioFile(audioUrl);
    }
    return audioUrl;
  } catch {
    setCachedAudioUrl(clean, null);
    return null;
  }
}

/** Tải trước theo lô (batch) 1/2 danh sách từ vựng tiếp theo với concurrency kiểm soát */
const activePreloadWords = new Set<string>();

export async function preloadAudioBatch(words: string[]) {
  if (typeof window === 'undefined' || !Array.isArray(words) || words.length === 0) return;
  hydrateCache();

  const wordsToFetch: string[] = [];
  for (const w of words) {
    const clean = normalizeWordForAudio(w);
    if (!clean || activePreloadWords.has(clean)) continue;

    const cached = memoryCache.get(clean);
    if (cached) {
      if (cached !== NOT_FOUND_TOKEN) {
        preloadAudioFile(cached);
      }
    } else {
      wordsToFetch.push(clean);
    }
  }

  if (wordsToFetch.length === 0) return;

  // Xử lý song song theo từng đợt 2 từ để không làm nghẽn mạng
  const chunkSize = 2;
  for (let i = 0; i < wordsToFetch.length; i += chunkSize) {
    const chunk = wordsToFetch.slice(i, i + chunkSize);
    chunk.forEach(w => activePreloadWords.add(w));

    await Promise.allSettled(
      chunk.map(async w => {
        try {
          const url = await fetchDictAudio(w);
          if (url) preloadAudioFile(url);
        } finally {
          activePreloadWords.delete(w);
        }
      })
    );

    if (i + chunkSize < wordsToFetch.length) {
      await new Promise(r => setTimeout(r, 60));
    }
  }
}

export function browserTTS(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const clean = normalizeWordForAudio(text) || text;
  if (!clean) return;

  try {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US';
      u.rate = 0.88;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const usVoice = voices.find(
          v =>
            v.lang === 'en-US' &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('US') ||
              v.default)
        );
        if (usVoice) u.voice = usVoice;
      }

      window.speechSynthesis.speak(u);
    }, 20);
  } catch {}
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
    audio.src =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audio
      .play()
      .then(() => {
        audio.pause();
        isUnlocked = true;
      })
      .catch(() => {});
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
 * Phát âm thông minh tức thì (Zero-Latency Instant Voice):
 * 1. Nếu có file MP3 trong cache: phát ngay 0ms bằng studio audio.
 * 2. Nếu là từ không có MP3 (__NONE__): phát ngay 0ms bằng Web Speech API.
 * 3. Nếu chưa cache: Chờ tối đa 200ms cho API. Quá 200ms -> phát ngay Web Speech API để người dùng nghe liền!
 *    Đồng thời ngầm tải & cache MP3 để sẵn sàng cho lần sau.
 */
export async function smartPlayWord(
  word: string,
  audioRef: { current: HTMLAudioElement | null },
  tokenRef: { current: number },
  onLoad?: () => void,
  onDone?: () => void
) {
  const clean = normalizeWordForAudio(word);
  if (!clean) return;

  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  hydrateCache();
  const token = ++tokenRef.current;
  const cached = memoryCache.get(clean);

  // 1. Trường hợp đã biết từ này không có audio từ điển -> phát ngay TTS 0ms
  if (cached === NOT_FOUND_TOKEN) {
    onDone?.();
    browserTTS(clean);
    return;
  }

  // 2. Trường hợp đã có link MP3 trong cache -> phát ngay tức thì
  if (cached) {
    const audio = getSharedAudio();
    if (audio) {
      audio.src = cached;
      audioRef.current = audio;
      audio.play().catch(() => {
        if (token === tokenRef.current) {
          onDone?.();
          browserTTS(clean);
        }
      });
      onDone?.();
      return;
    }
  }

  // 3. Chưa có trong cache: Phát âm tức thì không để người dùng chờ
  onLoad?.();

  let hasSpokenFallback = false;
  const fastTimer = setTimeout(() => {
    if (token === tokenRef.current) {
      hasSpokenFallback = true;
      onDone?.();
      browserTTS(clean);
    }
  }, 220); // Nếu mạng chậm hơn 220ms, lập tức đọc bằng TTS để không delay

  try {
    const url = await fetchDictAudio(clean);
    clearTimeout(fastTimer);
    if (token !== tokenRef.current) return;

    if (!url) {
      if (!hasSpokenFallback) {
        onDone?.();
        browserTTS(clean);
      }
      return;
    }

    // Nếu đã lỡ đọc TTS rồi thì không ngắt giữa chừng, chỉ preload mp3 cho lần sau
    if (hasSpokenFallback) {
      preloadAudioFile(url);
      return;
    }

    const audio = getSharedAudio();
    if (!audio) {
      onDone?.();
      browserTTS(clean);
      return;
    }

    audio.src = url;
    audioRef.current = audio;

    const playTimer = setTimeout(() => {
      if (token === tokenRef.current) {
        onDone?.();
        browserTTS(clean);
      }
    }, 1800);

    audio.oncanplaythrough = () => {
      clearTimeout(playTimer);
      if (token !== tokenRef.current) return;
      onDone?.();
      audio.play().catch(() => browserTTS(clean));
    };

    audio.onerror = () => {
      clearTimeout(playTimer);
      if (token === tokenRef.current) {
        onDone?.();
        browserTTS(clean);
      }
    };

    audio.load();
  } catch {
    clearTimeout(fastTimer);
    if (token === tokenRef.current && !hasSpokenFallback) {
      onDone?.();
      browserTTS(clean);
    }
  }
}

/** Legacy wrapper cho các component cũ cần tương thích */
export async function speakWordWithCache(
  raw: string,
  _cache: Map<string, string>,
  audioRef: { current: HTMLAudioElement | null },
  tokenRef: { current: number },
  onLoad: () => void,
  onDone: () => void
) {
  return smartPlayWord(raw, audioRef, tokenRef, onLoad, onDone);
}
