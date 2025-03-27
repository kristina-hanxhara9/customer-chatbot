// utils/analytics.js
const { Analytics, ChatSession } = require('../models');

/**
 * Updates analytics data for a business
 * @param {string} businessId - The business ID
 * @param {Object} params - Parameters for analytics
 * @param {string} params.message - The user's message
 * @param {number} params.responseTime - API response time in ms
 * @param {boolean} params.isNewSession - Whether this is a new session
 * @param {string} params.sessionId - The session ID
 * @param {string} params.source - The traffic source (optional)
 * @param {Object} params.device - Device information (optional)
 */
async function updateAnalytics(businessId, params) {
  try {
    const { 
      message, 
      responseTime = 0, 
      isNewSession = false,
      sessionId,
      source,
      device
    } = params;
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get current hour for time distribution
    const currentHour = new Date().getHours();
    const hourField = `hour${currentHour}`;
    
    // Find or create analytics document for today
    let analytics = await Analytics.findOne({
      businessId,
      date: today
    });
    
    if (!analytics) {
      analytics = new Analytics({
        businessId,
        date: today
      });
    }
    
    // Update metrics
    if (isNewSession) {
      analytics.metrics.totalSessions += 1;
      analytics.metrics.totalUsers += 1;
    }
    
    analytics.metrics.totalMessages += 1;
    
    // Update time distribution
    analytics.timeDistribution[hourField] = (analytics.timeDistribution[hourField] || 0) + 1;
    
    // Update average response time (rolling average)
    if (responseTime > 0) {
      const currentAvg = analytics.metrics.averageResponseTime || 0;
      const currentTotal = analytics.metrics.totalMessages - 1; // Subtract 1 for the current message
      
      if (currentTotal > 0) {
        // Calculate new average
        analytics.metrics.averageResponseTime = 
          (currentAvg * currentTotal + responseTime) / (currentTotal + 1);
      } else {
        analytics.metrics.averageResponseTime = responseTime;
      }
    }
    
    // Update common queries
    if (message && message.length > 2) {
      const normalizedQuery = message.toLowerCase().trim();
      
      let queryExists = false;
      for (let i = 0; i < analytics.commonQueries.length; i++) {
        if (analytics.commonQueries[i].query === normalizedQuery) {
          analytics.commonQueries[i].count += 1;
          queryExists = true;
          break;
        }
      }
      
      if (!queryExists) {
        // Only add if we have fewer than 100 queries or if this is more frequent than the least common one
        if (analytics.commonQueries.length < 100) {
          analytics.commonQueries.push({
            query: normalizedQuery,
            count: 1
          });
        } else {
          // Find the least common query
          let minIndex = 0;
          let minCount = Infinity;
          
          for (let i = 0; i < analytics.commonQueries.length; i++) {
            if (analytics.commonQueries[i].count < minCount) {
              minCount = analytics.commonQueries[i].count;
              minIndex = i;
            }
          }
          
          // Replace it if count is only 1
          if (minCount === 1) {
            analytics.commonQueries[minIndex] = {
              query: normalizedQuery,
              count: 1
            };
          }
        }
      }
      
      // Sort by count (most common first)
      analytics.commonQueries.sort((a, b) => b.count - a.count);
    }
    
    // Update source tracking if provided
    if (source) {
      let sourceExists = false;
      for (let i = 0; i < analytics.sources.length; i++) {
        if (analytics.sources[i].name === source) {
          analytics.sources[i].count += 1;
          sourceExists = true;
          break;
        }
      }
      
      if (!sourceExists) {
        analytics.sources.push({
          name: source,
          count: 1
        });
      }
    }
    
    // Update device statistics if provided
    if (device) {
      if (device.type === 'desktop') {
        analytics.devices.desktop += 1;
      } else if (device.type === 'mobile') {
        analytics.devices.mobile += 1;
      } else if (device.type === 'tablet') {
        analytics.devices.tablet += 1;
      }
      
      if (device.browser === 'chrome') {
        analytics.browsers.chrome += 1;
      } else if (device.browser === 'firefox') {
        analytics.browsers.firefox += 1;
      } else if (device.browser === 'safari') {
        analytics.browsers.safari += 1;
      } else if (device.browser === 'edge') {
        analytics.browsers.edge += 1;
      } else {
        analytics.browsers.other += 1;
      }
    }
    
    // Calculate average messages per session
    if (analytics.metrics.totalSessions > 0) {
      analytics.metrics.averageMessagesPerSession = 
        analytics.metrics.totalMessages / analytics.metrics.totalSessions;
    }
    
    // Save analytics
    await analytics.save();
    
  } catch (error) {
    console.error('Error updating analytics:', error);
    // Don't throw the error to prevent it from affecting the chat flow
  }
}

/**
 * Updates conversion analytics
 * @param {string} businessId - The business ID
 * @param {string} sessionId - The session ID
 * @param {string} conversionType - Type of conversion
 */
async function trackConversion(businessId, sessionId, conversionType) {
  try {
    // Update session
    const session = await ChatSession.findOne({ sessionId });
    
    if (session) {
      session.isConverted = true;
      session.conversionType = conversionType;
      await session.save();
    }
    
    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analytics = await Analytics.findOne({
      businessId,
      date: today
    });
    
    if (analytics) {
      analytics.metrics.convertedSessions += 1;
      
      // Calculate conversion rate
      if (analytics.metrics.totalSessions > 0) {
        analytics.metrics.conversionRate = 
          (analytics.metrics.convertedSessions / analytics.metrics.totalSessions) * 100;
      }
      
      await analytics.save();
    }
    
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

module.exports = {
  updateAnalytics,
  trackConversion
};