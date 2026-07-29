const axios = require('axios');
const logger = require('../../utils/logger');
const { VALIDATORS } = require('../../utils/constants');

/**
 * Extract the content inside an XML tag.
 * @param {string} xml 
 * @param {string} tag 
 * @returns {string}
 */
function extractXmlTag(xml, tag) {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : '';
}

/**
 * USPS Address Validator
 * @param {Object} address 
 * @returns {Promise<Object>}
 */
async function validateUSPS(address) {
  const userId = process.env.USPS_USER_ID;

  if (!userId || userId === 'your_usps_user_id') {
    logger.warn('USPS_USER_ID is not configured or is using default value. Returning configuration error.');
    return {
      success: false,
      valid: false,
      message: 'USPS Address Validation API credentials are not configured.',
      validatedBy: VALIDATORS.USPS,
      rawResponse: { error: 'Missing USPS_USER_ID env variable' }
    };
  }

  const { streetLine1, streetLine2, city, stateProvince, postalCode } = address;

  // USPS uses Address2 for street address and Address1 for secondary (apt, suite, unit)
  const xmlRequest = `<AddressValidateRequest USERID="${userId}">` +
    `<Revision>1</Revision>` +
    `<Address ID="0">` +
      `<Address1>${streetLine2 || ''}</Address1>` +
      `<Address2>${streetLine1}</Address2>` +
      `<City>${city}</City>` +
      `<State>${stateProvince}</State>` +
      `<Zip5>${postalCode}</Zip5>` +
      `<Zip4></Zip4>` +
    `</Address>` +
  `</AddressValidateRequest>`;

  try {
    const url = 'https://secure.shippingapis.com/ShippingAPI.dll';
    
    logger.info(`Calling USPS Web Tools API for address: ${streetLine1}, ${city}, ${stateProvince}`);
    const response = await axios.get(url, {
      params: {
        API: 'Verify',
        XML: xmlRequest
      },
      timeout: 10000 // 10 second timeout
    });

    const responseXml = response.data;
    logger.debug(`USPS raw XML response: ${responseXml}`);

    // Check for global error
    if (responseXml.includes('<Error>') && !responseXml.includes('<Address ID="0">')) {
      const desc = extractXmlTag(responseXml, 'Description');
      return {
        success: false,
        valid: false,
        message: desc || 'USPS API returned a global error.',
        validatedBy: VALIDATORS.USPS,
        rawResponse: { xml: responseXml }
      };
    }

    // Check for address level error
    const addressXml = responseXml.includes('<Address ID="0">') 
      ? responseXml.substring(responseXml.indexOf('<Address ID="0">')) 
      : responseXml;

    if (addressXml.includes('<Error>')) {
      const desc = extractXmlTag(addressXml, 'Description');
      return {
        success: true, // API call was successful
        valid: false,  // Address is invalid
        message: desc || 'Address not valid according to USPS.',
        validatedBy: VALIDATORS.USPS,
        rawResponse: { xml: responseXml }
      };
    }

    // Success validation
    const line1Val = extractXmlTag(addressXml, 'Address2');
    const line2Val = extractXmlTag(addressXml, 'Address1');
    const cityVal = extractXmlTag(addressXml, 'City');
    const stateVal = extractXmlTag(addressXml, 'State');
    const zip5Val = extractXmlTag(addressXml, 'Zip5');
    const zip4Val = extractXmlTag(addressXml, 'Zip4');

    const formattedAddressParts = [line1Val];
    if (line2Val) formattedAddressParts.push(line2Val);
    formattedAddressParts.push(cityVal, stateVal, zip4Val ? `${zip5Val}-${zip4Val}` : zip5Val, 'USA');
    
    const normalizedAddress = formattedAddressParts.join(', ');

    return {
      success: true,
      valid: true,
      normalizedAddress,
      validatedBy: VALIDATORS.USPS,
      rawResponse: {
        Address1: line2Val,
        Address2: line1Val,
        City: cityVal,
        State: stateVal,
        Zip5: zip5Val,
        Zip4: zip4Val
      }
    };
  } catch (error) {
    logger.error(`USPS API network/timeout failure: ${error.message}`);
    return {
      success: false,
      valid: false,
      message: `USPS API Connection failed: ${error.message}`,
      validatedBy: VALIDATORS.USPS,
      rawResponse: { error: error.message }
    };
  }
}

module.exports = validateUSPS;
