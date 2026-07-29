const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    return ApiResponse.error(
      res,
      'Too many requests from this IP, please try again after 15 minutes.',
      null,
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }
});

module.exports = apiLimiter;
