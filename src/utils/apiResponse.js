const { HTTP_STATUS } = require('./constants');

class ApiResponse {
  static success(res, message = 'Success', data = {}, statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...data
    });
  }

  static error(res, message = 'An error occurred', errors = null, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    const response = {
      success: false,
      message
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
