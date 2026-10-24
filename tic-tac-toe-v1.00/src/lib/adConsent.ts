/**
 * Small, fail-closed gate for advertising requests.
 *
 * The project does not ship a consent-management platform (CMP). The environment
 * flag only indicates that an owner has configured a real manager; it is not a
 * user's consent. Until that manager sets the runtime status after obtaining a
 * valid choice, consent remains `unknown` and no ad request is allowed.
 */
export type AdConsentStatus = 'unknown' | 'granted' | 'denied';

export type AdRequestGate = {
  production: boolean;
  enabled: boolean;
  consentManagerConfigured: boolean;
  consentStatus: AdConsentStatus;
  clientId: string;
  slotId: string;
};

export function canRequestAds(config: AdRequestGate): boolean {
  return config.production
    && config.enabled
    && config.consentManagerConfigured
    && config.consentStatus === 'granted'
    && /^ca-pub-\d+$/.test(config.clientId.trim())
    && /^\d+$/.test(config.slotId.trim());
}
