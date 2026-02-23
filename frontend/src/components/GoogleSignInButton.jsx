import { useEffect, useRef, useState } from 'react';

let googleScriptPromise;

function loadGoogleIdentityScript() {
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity script'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export default function GoogleSignInButton({ onCredential, text = 'continue_with' }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('idle');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return;
    }

    let cancelled = false;

    setStatus('loading');
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) {
          return;
        }

        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity is not available');
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response?.credential;
            if (credential) {
              onCredential?.(credential);
            }
          }
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text
        });

        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, text]);

  if (!clientId) {
    return null;
  }

  return (
    <div>
      <div ref={containerRef} className="w-full" />
      {status === 'error' && (
        <p className="mt-2 text-xs text-slate-600">Google sign-in is unavailable right now.</p>
      )}
    </div>
  );
}
