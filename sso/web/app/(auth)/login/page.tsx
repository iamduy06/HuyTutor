import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  const flashcardUrl = process.env.FLASHCARD_URL ? process.env.FLASHCARD_URL : '';
  const shopUrl = process.env.SHOP_URL ? process.env.SHOP_URL : '';

  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-8 flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      }
    >
      <LoginClient defaultFlashcardUrl={flashcardUrl} defaultShopUrl={shopUrl} />
    </Suspense>
  );
}
