'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (errorCode?: any) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileRef {
  reset: () => void;
}

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: (error?: any) => void;
  onExpire?: () => void;
  action?: string;
  className?: string;
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ onSuccess, onError, onExpire, action = 'sso_auth', className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Lưu các callback vào ref để tránh re-render / re-mount vô tận widget khi state cha thay đổi
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    // Lấy Site Key chuẩn hóa từ biến môi trường (Next.js nạp qua next.config.js env)
    const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (e) {
            console.warn('[TURNSTILE_RESET_WARN]', e);
          }
        }
      },
    }));

    // 1. Tải script Cloudflare Turnstile an toàn khi có siteKey
    useEffect(() => {
      if (typeof window === 'undefined' || !siteKey) return;

      if (window.turnstile) {
        setScriptLoaded(true);
        return;
      }

      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = (e) => {
          console.error('[TURNSTILE_SCRIPT_ERROR] Failed loading Cloudflare Turnstile script', e);
          onErrorRef.current?.(e);
        };
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', () => setScriptLoaded(true));
      }
    }, [siteKey]);

    // 2. Render Widget khi script và container đã sẵn sàng (chỉ render 1 lần, không re-mount khi gõ phím hoặc có token)
    useEffect(() => {
      if (!siteKey || !scriptLoaded || !containerRef.current || typeof window === 'undefined' || !window.turnstile) {
        return;
      }

      // Xóa widget cũ nếu đã tồn tại
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          action,
          callback: (token: string) => {
            onSuccessRef.current?.(token);
          },
          'error-callback': (err?: any) => {
            console.warn('[TURNSTILE_ERROR]', err);
            onErrorRef.current?.(err);
          },
          'expired-callback': () => {
            console.log('[TURNSTILE_EXPIRED]');
            onExpireRef.current?.();
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error('[TURNSTILE_RENDER_ERROR]', err);
      }

      return () => {
        if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }, [scriptLoaded, siteKey, action]);

    if (!siteKey) {
      return null;
    }

    return (
      <div className={`flex justify-center my-2 min-h-[65px] ${className}`}>
        <div ref={containerRef} />
      </div>
    );
  }
);

Turnstile.displayName = 'Turnstile';
