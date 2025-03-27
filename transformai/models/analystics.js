// models/analytics.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Metrics schema (embedded in Analytics)
const MetricsSchema = new Schema({
  totalSessions: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  averageMessagesPerSession: {
    type: Number,
    default: 0
  },
  convertedSessions: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number, // in milliseconds
    default: 0
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  newUsers: {
    type: Number,
    default: 0
  },
  returningUsers: {
    type: Number,
    default: 0
  }
});

// Query data schema (embedded in Analytics)
const QuerySchema = new Schema({
  query: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  // Optional: track which queries lead to conversions
  conversionCount: {
    type: Number,
    default: 0
  }
});

// Source tracking schema (embedded in Analytics)
const SourceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  conversionCount: {
    type: Number,
    default: 0
  }
});

// Time distribution schema (embedded in Analytics)
const TimeDistributionSchema = new Schema({
  hour0: { type: Number, default: 0 },
  hour1: { type: Number, default: 0 },
  hour2: { type: Number, default: 0 },
  hour3: { type: Number, default: 0 },
  hour4: { type: Number, default: 0 },
  hour5: { type: Number, default: 0 },
  hour6: { type: Number, default: 0 },
  hour7: { type: Number, default: 0 },
  hour8: { type: Number, default: 0 },
  hour9: { type: Number, default: 0 },
  hour10: { type: Number, default: 0 },
  hour11: { type: Number, default: 0 },
  hour12: { type: Number, default: 0 },
  hour13: { type: Number, default: 0 },
  hour14: { type: Number, default: 0 },
  hour15: { type: Number, default: 0 },
  hour16: { type: Number, default: 0 },
  hour17: { type: Number, default: 0 },
  hour18: { type: Number, default: 0 },
  hour19: { type: Number, default: 0 },
  hour20: { type: Number, default: 0 },
  hour21: { type: Number, default: 0 },
  hour22: { type: Number, default: 0 },
  hour23: { type: Number, default: 0 }
});

const AnalyticsSchema = new Schema({
  businessId: {
    type: String,
    required: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    type: MetricsSchema,
    default: () => ({})
  },
  commonQueries: [QuerySchema],
  sources: [SourceSchema],
  timeDistribution: {
    type: TimeDistributionSchema,
    default: () => ({})
  },
  // For storing device/browser/OS stats
  devices: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 }
  },
  browsers: {
    chrome: { type: Number, default: 0 },
    firefox: { type: Number, default: 0 },
    safari: { type: Number, default: 0 },
    edge: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  // For storing location data if available
  locations: [{
    country: String,
    region: String,
    city: String,
    count: Number
  }]
});

// Create a compound index for business and date
AnalyticsSchema.index({ businessId: 1, date: 1 }, { unique: true });
// For date range queries
AnalyticsSchema.index({ businessId: 1, date: -1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);