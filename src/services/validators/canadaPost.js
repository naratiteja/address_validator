const axios = require('axios');
const logger = require('../../utils/logger');
const { VALIDATORS } = require('../../utils/constants');

/**
 * Canada Post Address Validator
 * Uses Canada Post AddressComplete Interactive REST API (Find + Retrieve)
 * @param {Object} address 
 * @returns {Promise<Object>}
 */
async function validateCanadaPost(address) {
  const apiKey = process.env.CANADA_POST_API_KEY;

  if (!apiKey || apiKey === 'your_canada_post_api_key') {
    logger.warn('CANADA_POST_API_KEY is not configured or is using default value. Returning configuration error.');
    return {
      success: false,
      valid: false,
      message: 'Canada Post API credentials are not configured.',
      validatedBy: VALIDATORS.CANADA_POST,
      rawResponse: { error: 'Missing CANADA_POST_API_KEY env variable' }
    };
  }

  const { streetLine1, streetLine2, city, stateProvince, postalCode } = address;
  const searchTerm = `${streetLine1} ${streetLine2 || ''} ${city} ${stateProvince} ${postalCode}`.trim();

  try {
    logger.info(`Calling Canada Post Find API for search term: ${searchTerm}`);
    
    // Step 1: Find matching address suggestion
    let findResponse = await axios.get('https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws', {
      params: {
        Key: apiKey,
        SearchTerm: searchTerm,
        Country: 'CAN'
      },
      timeout: 10000
    });

    let items = findResponse.data.Items;

    if (!items || items.length === 0) {
      return {
        success: true,
        valid: false,
        message: 'No address matches found.',
        validatedBy: VALIDATORS.CANADA_POST,
        rawResponse: findResponse.data
      };
    }

    if (items[0].Error) {
      return {
        success: false,
        valid: false,
        message: items[0].Description || 'Canada Post API Find error.',
        validatedBy: VALIDATORS.CANADA_POST,
        rawResponse: findResponse.data
      };
    }

    // Step 2: Handle drilling down if the item requires further 'Find' steps (Next === 'Find')
    let currentItems = items;
    let attempts = 0;
    
    while (currentItems && currentItems.length > 0 && currentItems[0].Next === 'Find' && attempts < 3) {
      const parentId = currentItems[0].Id;
      logger.info(`Drilling down Canada Post address search using LastId: ${parentId}`);
      
      const nextResponse = await axios.get('https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws', {
        params: {
          Key: apiKey,
          LastId: parentId,
          Country: 'CAN'
        },
        timeout: 10000
      });

      currentItems = nextResponse.data.Items;
      attempts++;
    }

    if (!currentItems || currentItems.length === 0 || currentItems[0].Error) {
      return {
        success: true,
        valid: false,
        message: 'Address resolution failed during drilldown.',
        validatedBy: VALIDATORS.CANADA_POST,
        rawResponse: { items: currentItems }
      };
    }

    // Step 3: Retrieve full details using the final ID
    const targetId = currentItems[0].Id;
    logger.info(`Retrieving full address details from Canada Post for ID: ${targetId}`);

    const retrieveResponse = await axios.get('https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.10/json3.ws', {
      params: {
        Key: apiKey,
        Id: targetId
      },
      timeout: 10000
    });

    const details = retrieveResponse.data.Items;

    if (!details || details.length === 0) {
      return {
        success: true,
        valid: false,
        message: 'Could not retrieve address details.',
        validatedBy: VALIDATORS.CANADA_POST,
        rawResponse: retrieveResponse.data
      };
    }

    if (details[0].Error) {
      return {
        success: false,
        valid: false,
        message: details[0].Description || 'Canada Post API Retrieve error.',
        validatedBy: VALIDATORS.CANADA_POST,
        rawResponse: retrieveResponse.data
      };
    }

    const addressDetail = details[0];

    // Standard normalized address formatting
    const formattedAddressParts = [addressDetail.Line1];
    if (addressDetail.Line2) formattedAddressParts.push(addressDetail.Line2);
    formattedAddressParts.push(addressDetail.City, addressDetail.ProvinceCode, addressDetail.PostalCode, 'Canada');

    const normalizedAddress = formattedAddressParts.join(', ');

    return {
      success: true,
      valid: true,
      normalizedAddress,
      validatedBy: VALIDATORS.CANADA_POST,
      rawResponse: addressDetail
    };
  } catch (error) {
    logger.error(`Canada Post API network/timeout failure: ${error.message}`);
    return {
      success: false,
      valid: false,
      message: `Canada Post API Connection failed: ${error.message}`,
      validatedBy: VALIDATORS.CANADA_POST,
      rawResponse: { error: error.message }
    };
  }
}

module.exports = validateCanadaPost;
