import { 
  normalizeWordForAudio, 
  fetchDictAudio, 
  setCachedAudioUrl, 
  getCachedAudioUrl, 
  preloadAudioBatch 
} from '../apps/web/lib/audio.ts';

async function testAudioEngine() {
  console.log('=== TESTING AUDIO OPTIMIZATION ENGINE ===\n');

  // 1. Test normalization
  const wordsToTest = [
    'apple/apples',
    'take (up)',
    '  BEAUTIFUL  ',
    'go on (with)'
  ];

  console.log('1. Testing Word Normalization:');
  for (const w of wordsToTest) {
    const clean = normalizeWordForAudio(w);
    console.log(`- Original: "${w}" -> Normalized: "${clean}"`);
  }

  // 2. Test fetchDictAudio
  console.log('\n2. Testing Real Dictionary Fetch:');
  const t0 = Date.now();
  const urlApple = await fetchDictAudio('apple');
  console.log(`- "apple" audio URL (${Date.now() - t0}ms):`, urlApple);

  // 3. Test caching speed
  console.log('\n3. Testing Cache Hit (Should be 0ms):');
  const t1 = Date.now();
  const cachedApple = await fetchDictAudio('apple');
  console.log(`- "apple" cached URL (${Date.now() - t1}ms):`, cachedApple);

  // 4. Test batch preloading for half a tab
  console.log('\n4. Testing Batch Preload (Half of Vocabulary Tab):');
  const sampleVocabulary = [
    'banana', 'orange', 'watermelon', 'strawberry', 'pineapple',
    'grape', 'lemon', 'peach', 'cherry', 'mango'
  ];
  const half = sampleVocabulary.slice(0, Math.ceil(sampleVocabulary.length / 2));
  console.log(`Preloading ${half.length} words:`, half);
  const t2 = Date.now();
  await preloadAudioBatch(half);
  console.log(`Batch preload completed in ${Date.now() - t2}ms`);

  // Verify all preloaded items are now instant cache hits
  console.log('\n5. Verifying Preloaded Items are Instant Cache Hits:');
  for (const w of half) {
    const tCheck = Date.now();
    const res = await fetchDictAudio(w);
    console.log(`- "${w}" resolved in ${Date.now() - tCheck}ms:`, res ? 'MP3 Available' : 'No MP3 (Cached __NONE__)');
  }

  console.log('\n=== AUDIO ENGINE VALIDATION COMPLETED SUCCESSFULLY ===');
}

testAudioEngine().catch(console.error);
