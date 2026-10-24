import { useEffect, useRef, useState } from 'react';
import { canRequestAds, type AdConsentStatus } from './adConsent';

const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT?.trim() ?? '';
const SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_GAME?.trim() ?? '';
const ADS_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true';
// This is an owner-configured readiness flag, not a user's consent decision.
const CONSENT_MANAGER_CONFIGURED = import.meta.env.VITE_ADSENSE_CONSENT_READY === 'true';
const PRODUCTION_BUILD = import.meta.env.PROD;

// A real CMP adapter must set this after recording the user's choice and emit
// `ttu:ad-consent-change`. No CMP is bundled/configured in this project today,
// so the status naturally remains `unknown` and advertising stays off.
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, never>>;
    __TTU_AD_CONSENT_STATUS__?: AdConsentStatus;
  }
}

function readConsentStatus(): AdConsentStatus {
  if (typeof window === 'undefined') return 'unknown';
  const status = window.__TTU_AD_CONSENT_STATUS__;
  return status === 'granted' || status === 'denied' ? status : 'unknown';
}

export function AdSlot({ label }: { label: string }) {
  const elementRef = useRef<HTMLElement | null>(null);
  const requestSent = useRef(false);
  const [consentStatus, setConsentStatus] = useState<AdConsentStatus>(readConsentStatus);
  const permitted = canRequestAds({
    production: PRODUCTION_BUILD,
    enabled: ADS_ENABLED,
    consentManagerConfigured: CONSENT_MANAGER_CONFIGURED,
    consentStatus,
    clientId: CLIENT_ID,
    slotId: SLOT_ID,
  });

  useEffect(() => {
    const syncConsent = () => setConsentStatus(readConsentStatus());
    window.addEventListener('ttu:ad-consent-change', syncConsent);
    syncConsent();
    return () => window.removeEventListener('ttu:ad-consent-change', syncConsent);
  }, []);

  useEffect(() => {
    if (!permitted) {
      requestSent.current = false;
      return;
    }
    if (requestSent.current) return;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ttu-adsense="true"]',
    );
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.ttuAdsense = 'true';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
      document.head.appendChild(script);
    }

    const element = elementRef.current;
    if (!element || element.dataset.adsbygoogleStatus) return;
    requestSent.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // An ad-network failure must never interfere with playing the game.
    }
  }, [permitted]);

  if (!permitted) return null;

  return (
    <aside className="ad-slot-region" aria-label={label}>
      <span className="ad-slot-label">{label}</span>
      <ins
        ref={(element) => { elementRef.current = element; }}
        className="adsbygoogle ad-slot"
        style={{ display: 'block', minHeight: 90 }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
