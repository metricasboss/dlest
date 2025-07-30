/**
 * Data Layer Spy
 * 
 * Injected into browser to intercept and capture dataLayer events
 * Maintains compatibility with existing dataLayer implementations
 */

function createDataLayerSpy(variableName = 'dataLayer') {
  // Store original dataLayer if it exists
  const originalDataLayer = window[variableName] || [];
  window.__dlest_original_dataLayer = originalDataLayer;
  
  // Initialize events storage
  window.__dlest_events = [];
  
  // Store original push method
  const originalPush = originalDataLayer.push || Array.prototype.push;
  
  // Create intercepting push function
  function interceptPush(...args) {
    // Store events for DLest
    args.forEach(event => {
      if (event && typeof event === 'object') {
        window.__dlest_events.push({
          ...event,
          __dlest_timestamp: Date.now(),
          __dlest_index: window.__dlest_events.length
        });
      }
    });
    
    // Call original implementation to maintain functionality
    return originalPush.apply(window[variableName], args);
  }
  
  // Replace dataLayer with spy version
  if (!window[variableName]) {
    window[variableName] = [];
  }
  
  // Override the push method
  window[variableName].push = interceptPush;
  
  // Process any existing events in the dataLayer
  if (originalDataLayer.length > 0) {
    originalDataLayer.forEach((event, index) => {
      if (event && typeof event === 'object') {
        window.__dlest_events.push({
          ...event,
          __dlest_timestamp: Date.now(),
          __dlest_index: index,
          __dlest_existing: true
        });
      }
    });
  }
  
  // Helper functions for DLest
  window.__dlest_helpers = {
    // Get all captured events
    getEvents: () => window.__dlest_events,
    
    // Get events by name
    getEventsByName: (eventName) => 
      window.__dlest_events.filter(event => 
        event.event === eventName || 
        event.eventName === eventName ||
        event.name === eventName
      ),
    
    // Get events count
    getEventCount: (eventName) => {
      if (!eventName) return window.__dlest_events.length;
      return window.__dlest_helpers.getEventsByName(eventName).length;
    },
    
    // Clear captured events (for testing)
    clearEvents: () => {
      window.__dlest_events = [];
    },
    
    // Check if event exists
    hasEvent: (eventName, eventData) => {
      const events = window.__dlest_helpers.getEventsByName(eventName);
      if (events.length === 0) return false;
      
      if (!eventData) return true;
      
      return events.some(event => {
        return Object.keys(eventData).every(key => {
          if (typeof eventData[key] === 'object' && eventData[key] !== null) {
            // Deep comparison for objects
            return JSON.stringify(event[key]) === JSON.stringify(eventData[key]);
          }
          return event[key] === eventData[key];
        });
      });
    },
    
    // Wait for event (returns Promise)
    waitForEvent: (eventName, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkEvent = () => {
          const events = window.__dlest_helpers.getEventsByName(eventName);
          if (events.length > 0) {
            resolve(events[events.length - 1]); // Return latest event
            return;
          }
          
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Event '${eventName}' not found within ${timeout}ms`));
            return;
          }
          
          setTimeout(checkEvent, 50); // Check every 50ms
        };
        
        checkEvent();
      });
    }
  };
  
  return window.__dlest_events;
}

// Export for Node.js usage (test runner will stringify and inject this)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDataLayerSpy };
}

// Also make available globally when injected
if (typeof window !== 'undefined') {
  window.__dlest_createDataLayerSpy = createDataLayerSpy;
}