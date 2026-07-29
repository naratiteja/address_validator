const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

function notFound(req, res, next) {
  return ApiResponse.error(
    res, 
    `Resource not found: ${req.method} ${req.originalUrl}`, 
    null, 
    HTTP_STATUS.NOT_FOUND
  );
}

module.exports = notFound;
