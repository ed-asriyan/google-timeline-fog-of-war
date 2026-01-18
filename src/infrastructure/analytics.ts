// Infrastructure Layer: Analytics service

import * as amplitude from '@amplitude/unified';

class AnalyticsService {
  private initialized = false;

  init() {
    const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
    
    if (!apiKey) {
      console.warn('Amplitude API key not found. Analytics disabled.');
      return;
    }

    const client = amplitude.createInstance();
    client.init(apiKey, {
      autocapture: {
        attribution: true,
        pageViews: true,
        sessions: true,
        formInteractions: false,
        fileDownloads: false,
      },
    });

    this.initialized = true;
    this.client = client;
  }

  private client?: ReturnType<typeof amplitude.createInstance>;

  track(eventName: string, eventProperties?: Record<string, any>) {
    if (!this.initialized || !this.client) return;
    this.client.track(eventName, eventProperties);
  }

  setUserId(userId: string) {
    if (!this.initialized || !this.client) return;
    this.client.setUserId(userId);
  }
}

export const analytics = new AnalyticsService();
