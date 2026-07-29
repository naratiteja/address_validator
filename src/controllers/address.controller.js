const Address = require('../models/address.model');
const { routeValidation } = require('../services/validationRouter');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS, DEFAULT_USER_ID } = require('../utils/constants');
const logger = require('../utils/logger');

class AddressController {
  /**
   * Validate Address Endpoint
   * POST /api/address/validate
   */
  static async validateAddress(req, res, next) {
    try {
      const address = {
        streetLine1: req.body.streetLine1,
        streetLine2: req.body.streetLine2,
        city: req.body.city,
        stateProvince: req.body.stateProvince,
        postalCode: req.body.postalCode,
        countryCode: req.body.countryCode
      };

      logger.info(`Address validation requested for country: ${address.countryCode}`);
      const result = await routeValidation(address);

      if (!result.success) {
        // Return 400 for structural invalid address or internal API error depending on situation.
        // The standard response format for failure is: { success: false, valid: false, message: "..." }
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          valid: false,
          message: result.message || 'Address validation failed.'
        });
      }

      if (!result.valid) {
        return res.status(HTTP_STATUS.OK).json({
          success: true, // API executed correctly, but address is structurally invalid
          valid: false,
          message: result.message || 'Invalid Address'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        valid: true,
        normalizedAddress: result.normalizedAddress,
        validatedBy: result.validatedBy,
        rawResponse: result.rawResponse
      });
    } catch (error) {
      logger.error(`Error in AddressController.validateAddress: ${error.stack}`);
      next(error);
    }
  }

  /**
   * Save Address Endpoint
   * POST /api/address/save
   */
  static async saveAddress(req, res, next) {
    try {
      const address = {
        streetLine1: req.body.streetLine1,
        streetLine2: req.body.streetLine2,
        city: req.body.city,
        stateProvince: req.body.stateProvince,
        postalCode: req.body.postalCode,
        countryCode: req.body.countryCode
      };

      logger.info(`Address save requested. Running validation first...`);
      const validationResult = await routeValidation(address);

      if (!validationResult.success || !validationResult.valid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          valid: false,
          message: validationResult.message || 'Cannot save address: address is invalid.'
        });
      }

      // Save Address to Database
      const addressData = {
        userId: req.body.userId || DEFAULT_USER_ID,
        streetLine1: address.streetLine1,
        streetLine2: address.streetLine2,
        city: address.city,
        stateProvince: address.stateProvince,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
        isValidated: true,
        validatedBy: validationResult.validatedBy,
        normalizedAddress: validationResult.normalizedAddress,
        validationResponse: validationResult.rawResponse
      };

      const savedId = await Address.create(addressData);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        id: savedId,
        message: 'Address Saved Successfully'
      });
    } catch (error) {
      logger.error(`Error in AddressController.saveAddress: ${error.stack}`);
      next(error);
    }
  }

  /**
   * List Addresses Endpoint
   * GET /api/address/list
   */
  static async listAddresses(req, res, next) {
    try {
      logger.info('Listing all active addresses.');
      const addresses = await Address.findAll();
      
      // Parse validationResponse from JSON string to object if necessary
      const formattedAddresses = addresses.map(addr => {
        let valResp = addr.validation_response;
        if (typeof valResp === 'string') {
          try {
            valResp = JSON.parse(valResp);
          } catch (e) {
            // keep as is
          }
        }
        return {
          id: addr.id,
          userId: addr.user_id,
          streetLine1: addr.street_line1,
          streetLine2: addr.street_line2,
          city: addr.city,
          stateProvince: addr.state_province,
          postalCode: addr.postal_code,
          countryCode: addr.country_code,
          isValidated: !!addr.is_validated,
          validatedBy: addr.validated_by,
          normalizedAddress: addr.normalized_address,
          validationResponse: valResp,
          createdAt: addr.created_at,
          updatedAt: addr.updated_at
        };
      });

      return ApiResponse.success(res, 'Addresses retrieved successfully', { addresses: formattedAddresses });
    } catch (error) {
      logger.error(`Error in AddressController.listAddresses: ${error.stack}`);
      next(error);
    }
  }

  /**
   * Get Single Address Endpoint
   * GET /api/address/:id
   */
  static async getAddressById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return ApiResponse.error(res, 'Invalid address ID format', null, HTTP_STATUS.BAD_REQUEST);
      }

      logger.info(`Retrieving address by ID: ${id}`);
      const addr = await Address.findById(id);

      if (!addr) {
        return ApiResponse.error(res, 'Address not found', null, HTTP_STATUS.NOT_FOUND);
      }

      let valResp = addr.validation_response;
      if (typeof valResp === 'string') {
        try {
          valResp = JSON.parse(valResp);
        } catch (e) {
          // keep as is
        }
      }

      const formattedAddress = {
        id: addr.id,
        userId: addr.user_id,
        streetLine1: addr.street_line1,
        streetLine2: addr.street_line2,
        city: addr.city,
        stateProvince: addr.state_province,
        postalCode: addr.postal_code,
        countryCode: addr.country_code,
        isValidated: !!addr.is_validated,
        validatedBy: addr.validated_by,
        normalizedAddress: addr.normalized_address,
        validationResponse: valResp,
        createdAt: addr.created_at,
        updatedAt: addr.updated_at
      };

      return ApiResponse.success(res, 'Address retrieved successfully', { address: formattedAddress });
    } catch (error) {
      logger.error(`Error in AddressController.getAddressById: ${error.stack}`);
      next(error);
    }
  }

  /**
   * Delete Address Endpoint
   * DELETE /api/address/:id
   */
  static async deleteAddress(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return ApiResponse.error(res, 'Invalid address ID format', null, HTTP_STATUS.BAD_REQUEST);
      }

      logger.info(`Soft deleting address by ID: ${id}`);
      const isDeleted = await Address.softDelete(id);

      if (!isDeleted) {
        return ApiResponse.error(res, 'Address not found or already deleted', null, HTTP_STATUS.NOT_FOUND);
      }

      return ApiResponse.success(res, 'Address deleted successfully', { id });
    } catch (error) {
      logger.error(`Error in AddressController.deleteAddress: ${error.stack}`);
      next(error);
    }
  }
}

module.exports = AddressController;
