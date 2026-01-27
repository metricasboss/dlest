const NetworkSpy = require('../../src/core/network-spy');

describe('NetworkSpy', () => {
  let networkSpy;

  beforeEach(() => {
    networkSpy = new NetworkSpy();
  });

  describe('GA4 Request Detection', () => {
    test('identifies GA4 collect endpoints', () => {
      const ga4Urls = [
        'https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123',
        'https://analytics.google.com/g/collect?v=2&tid=G-XYZ789',
        'https://stats.g.doubleclick.net/g/collect?v=2'
      ];

      ga4Urls.forEach(url => {
        expect(networkSpy.isGA4Request(url)).toBe(true);
      });
    });

    test('identifies Universal Analytics endpoints', () => {
      const uaUrls = [
        'https://www.google-analytics.com/j/collect?v=1&tid=UA-123456-1',
        'https://www.google-analytics.com/collect?v=1&tid=UA-789012-3'
      ];

      uaUrls.forEach(url => {
        expect(networkSpy.isGA4Request(url)).toBe(true);
      });
    });

    test('excludes gtag.js and analytics.js script loads', () => {
      const scriptUrls = [
        'https://www.googletagmanager.com/gtag/js?id=G-ABC123',
        'https://www.google-analytics.com/analytics.js',
        'https://www.googletagmanager.com/gtm.js?id=GTM-ABC123'
      ];

      scriptUrls.forEach(url => {
        expect(networkSpy.isGA4Request(url)).toBe(false);
      });
    });
  });

  describe('Event Parsing', () => {
    test('parses GA4 event from URL', () => {
      const url = 'https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123&en=purchase&ep.transaction_id=123';
      const event = networkSpy.parseGA4Event(url);

      expect(event.measurementId).toBe('G-ABC123');
      expect(event.eventName).toBe('purchase');
      expect(event.parameters.transaction_id).toBe('123');
    });

    test('parses multiple parameters correctly', () => {
      const url = 'https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123&en=add_to_cart' +
        '&ep.currency=USD&epn.value=99.99&ep.item_id=SKU123';

      const event = networkSpy.parseGA4Event(url);

      expect(event.parameters).toEqual({
        currency: 'USD',
        value: 99.99,
        item_id: 'SKU123'
      });
    });

    test('handles URL encoded values', () => {
      const url = 'https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123&en=page_view' +
        '&ep.page_title=' + encodeURIComponent('Products & Services') +
        '&ep.page_location=' + encodeURIComponent('https://example.com/page?query=1');

      const event = networkSpy.parseGA4Event(url);

      expect(event.parameters.page_title).toBe('Products & Services');
      expect(event.parameters.page_location).toBe('https://example.com/page?query=1');
    });

    test('parses Universal Analytics format', () => {
      const url = 'https://www.google-analytics.com/j/collect?v=1&tid=UA-123456-1&t=pageview&dp=/home';
      const event = networkSpy.parseGA4Event(url);

      expect(event.measurementId).toBe('UA-123456-1');
      expect(event.eventName).toBe('pageview');
    });
  });

  describe('Event Storage and Retrieval', () => {
    test('stores and retrieves events', () => {
      const event1 = {
        eventName: 'page_view',
        measurementId: 'G-ABC123',
        parameters: {}
      };

      const event2 = {
        eventName: 'purchase',
        measurementId: 'G-ABC123',
        parameters: { value: 100 }
      };

      networkSpy.events.push(event1);
      networkSpy.events.push(event2);

      expect(networkSpy.getGA4Events()).toHaveLength(2);
      expect(networkSpy.getGA4Events()[0]).toEqual(event1);
      expect(networkSpy.getGA4Events()[1]).toEqual(event2);
    });

    test('filters events by name', () => {
      networkSpy.events = [
        { eventName: 'page_view', measurementId: 'G-ABC123', parameters: {} },
        { eventName: 'purchase', measurementId: 'G-ABC123', parameters: {} },
        { eventName: 'page_view', measurementId: 'G-XYZ789', parameters: {} }
      ];

      const pageViews = networkSpy.getGA4EventsByName('page_view');
      expect(pageViews).toHaveLength(2);
      expect(pageViews.every(e => e.eventName === 'page_view')).toBe(true);

      const purchases = networkSpy.getGA4EventsByName('purchase');
      expect(purchases).toHaveLength(1);
      expect(purchases[0].eventName).toBe('purchase');
    });

    test('clears events', () => {
      networkSpy.events = [
        { eventName: 'page_view', measurementId: 'G-ABC123', parameters: {} },
        { eventName: 'purchase', measurementId: 'G-ABC123', parameters: {} }
      ];

      expect(networkSpy.getGA4Events()).toHaveLength(2);

      networkSpy.clear();

      expect(networkSpy.getGA4Events()).toHaveLength(0);
    });
  });

  describe('Request Interception', () => {
    test('captures request from fetch response', async () => {
      const mockRequest = {
        url: () => 'https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123&en=page_view',
        method: () => 'POST'
      };

      const mockRoute = {
        continue: jest.fn()
      };

      await networkSpy.intercept(mockRequest, mockRoute);

      expect(networkSpy.getGA4Events()).toHaveLength(1);
      expect(networkSpy.getGA4Events()[0].eventName).toBe('page_view');
      expect(mockRoute.continue).toHaveBeenCalled();
    });

    test('ignores non-GA4 requests', async () => {
      const mockRequest = {
        url: () => 'https://api.example.com/data',
        method: () => 'POST'
      };

      const mockRoute = {
        continue: jest.fn()
      };

      await networkSpy.intercept(mockRequest, mockRoute);

      expect(networkSpy.getGA4Events()).toHaveLength(0);
      expect(mockRoute.continue).toHaveBeenCalled();
    });
  });
});