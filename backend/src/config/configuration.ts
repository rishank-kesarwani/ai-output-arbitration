export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_arbitration_key_32_characters_minimum',
  serviceApiKey: process.env.SERVICE_API_KEY || 'placeholder_arbitration_service_key_here',

  aiPlatform: {
    url: process.env.AI_PLATFORM_URL || 'http://localhost:4001',
    apiKey: process.env.AI_PLATFORM_API_KEY || '',
    timeoutMs: parseInt(process.env.AI_PLATFORM_TIMEOUT_MS || '5000', 10),
  },

  notificationService: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4002',
    apiKey: process.env.NOTIFICATION_SERVICE_API_KEY || '',
    timeoutMs: parseInt(process.env.NOTIFICATION_SERVICE_TIMEOUT_MS || '5000', 10),
  },

  modelRegressionService: {
    url: process.env.MODEL_REGRESSION_SERVICE_URL || 'http://localhost:4003',
    apiKey: process.env.MODEL_REGRESSION_SERVICE_API_KEY || '',
    timeoutMs: parseInt(process.env.MODEL_REGRESSION_SERVICE_TIMEOUT_MS || '5000', 10),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
