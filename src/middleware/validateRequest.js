const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../utils/constants');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(
      res,
      'Validation failed',
      errors.array().map(err => ({ field: err.path, message: err.msg })),
      HTTP_STATUS.BAD_REQUEST
    );
  }
  next();
}

module.exports = validateRequest;
