const validateUSPS = require('./validators/usps');
const validateCanadaPost = require('./validators/canadaPost');
const validateIndia = require('./validators/india');
const { COUNTRIES } = require('../utils/constants');

/**
 * Route validation requests to the correct country-specific validator
 * @param {Object} address 
 * @returns {Promise<Object>} Unified validation response
 */
async function routeValidation(address) {
  const countryCode = (address.countryCode || '').toUpperCase().trim();

  switch (countryCode) {
    case COUNTRIES.US:
      return await validateUSPS(address);
    case COUNTRIES.CA:
      return await validateCanadaPost(address);
    case COUNTRIES.IN:
      return await validateIndia(address);
    default:
      return {
        success: false,
        valid: false,
        message: `Validation for country code "${countryCode}" is not supported. Supported: US, CA, IN.`
      };
  }
}

module.exports = {
  routeValidation
};
