const JWT_SECRET = process.env.JWT_SECRET || "123123";

// Error handling exports
export * from './errors.js';
export * from './logger.js';
export * from './errorHandler.js';

// module.exports = { JWT_SECRET }; // CommonJS export
export { JWT_SECRET }; // ES module export