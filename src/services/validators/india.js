const axios = require('axios');
const logger = require('../../utils/logger');
const { VALIDATORS } = require('../../utils/constants');

/**
 * India Address Validator (OpenStreetMap Nominatim)
 * @param {Object} address 
 * @returns {Promise<Object>}
 */
async function validateIndia(address) {
  const userAgent = process.env.USER_AGENT || 'GlobalAddressValidationTool/1.2 (teja.addrval@gmail.com)';
  const { streetLine1, streetLine2, city, stateProvince, postalCode } = address;

  // Build the search query
  const queryParts = [streetLine1];
  if (streetLine2) queryParts.push(streetLine2);
  if (city) queryParts.push(city);
  if (stateProvince) queryParts.push(stateProvince);
  if (postalCode) queryParts.push(postalCode);
  queryParts.push('India');

  const query = queryParts.join(', ');

  try {
    logger.info(`Calling OpenStreetMap Nominatim API for query: "${query}"`);

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'in'
      },
      headers: {
        'User-Agent': userAgent
      },
      timeout: 10000
    });

    const results = response.data;
    logger.debug(`OSM Nominatim raw response: ${JSON.stringify(results)}`);

    if (!results || results.length === 0) {
      return {
        success: true,
        valid: false,
        message: 'No address matches found in Nominatim.',
        validatedBy: VALIDATORS.OSM_NOMINATIM,
        rawResponse: results
      };
    }

    const matchedAddress = results[0];
    const addressDetails = matchedAddress.address;

    // Standardize normalizedAddress from OSM display_name
    const normalizedAddress = matchedAddress.display_name;

    return {
      success: true,
      valid: true,
      normalizedAddress,
      validatedBy: VALIDATORS.OSM_NOMINATIM,
      rawResponse: {
        place_id: matchedAddress.place_id,
        licence: matchedAddress.licence,
        osm_type: matchedAddress.osm_type,
        osm_id: matchedAddress.osm_id,
        lat: matchedAddress.lat,
        lon: matchedAddress.lon,
        display_name: matchedAddress.display_name,
        address: addressDetails
      }
    };
  } catch (error) {
    logger.error(`India OSM Nominatim API network/timeout failure: ${error.message}`);
    return {
      success: false,
      valid: false,
      message: `OpenStreetMap API Connection failed: ${error.message}`,
      validatedBy: VALIDATORS.OSM_NOMINATIM,
      rawResponse: { error: error.message }
    };
  }
}

module.exports = validateIndia;
