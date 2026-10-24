import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AdSlot } from './AdSlot';
import { canRequestAds } from './adConsent';

describe('AdSlot', () => {
  it('requires actual runtime consent in addition to all configuration flags', () => {
    const configured = {
      production: true,
      enabled: true,
      consentManagerConfigured: true,
      clientId: 'ca-pub-1234567890',
      slotId: '1234567890',
    };
    expect(canRequestAds({ ...configured, consentStatus: 'unknown' })).toBe(false);
    expect(canRequestAds({ ...configured, consentStatus: 'denied' })).toBe(false);
    expect(canRequestAds({ ...configured, consentStatus: 'granted' })).toBe(true);
    expect(canRequestAds({ ...configured, production: false, consentStatus: 'granted' })).toBe(false);
    expect(canRequestAds({ ...configured, enabled: false, consentStatus: 'granted' })).toBe(false);
    expect(canRequestAds({ ...configured, consentManagerConfigured: false, consentStatus: 'granted' })).toBe(false);
    expect(canRequestAds({ ...configured, clientId: 'invalid', consentStatus: 'granted' })).toBe(false);
    expect(canRequestAds({ ...configured, slotId: 'not-a-slot', consentStatus: 'granted' })).toBe(false);
  });

  afterEach(() => {
    document.querySelectorAll('script[data-ttu-adsense="true"]').forEach((script) => script.remove());
  });

  it('does not show an empty ad placeholder or contact an ad network when monetization is disabled', () => {
    render(<AdSlot label="Advertisement" />);

    expect(screen.queryByText('Advertisement')).not.toBeInTheDocument();
    expect(document.querySelector('script[data-ttu-adsense="true"]')).toBeNull();
  });
});
