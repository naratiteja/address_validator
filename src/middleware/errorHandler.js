const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

// Express error handling middleware must have 4 parameters (err, req, res, next)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error(`Error encountered: ${err.message}\nStack: ${err.stack}`);

  // Check if it's an Axios/network-related error
  if (err.isAxiosError) {
    const status = err.response ? err.response.status : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.response && err.response.data 
      ? JSON.stringify(err.response.data) 
      : `External API error: ${err.message}`;
    return ApiResponse.error(res, `Address validation service connectivity issue. Details: ${message}`, null, status);
  }

  // Handle standard errors
  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  return ApiResponse.error(
    res, 
    process.env.NODE_ENV === 'production' ? 'Internal server error occurred.' : message, 
    null, 
    statusCode
  );
}

module.exports = errorHandler;
