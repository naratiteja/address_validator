const pool = require('../db/connection');
const queries = require('../db/queries/address.query');
const logger = require('../utils/logger');

class Address {
  /**
   * Save a validated address to the database
   * @param {Object} addressData 
   * @returns {Promise<number>} Inserted address ID
   */
  static async create(addressData) {
    const {
      userId,
      streetLine1,
      streetLine2,
      city,
      stateProvince,
      postalCode,
      countryCode,
      isValidated,
      validatedBy,
      normalizedAddress,
      validationResponse
    } = addressData;

    try {
      // Normalize validationResponse to string if it is an object
      const valResponseJson = typeof validationResponse === 'object' 
        ? JSON.stringify(validationResponse) 
        : validationResponse;

      const [result] = await pool.execute(queries.INSERT_ADDRESS, [
        userId || 1, // Default user ID is 1
        streetLine1,
        streetLine2 || null,
        city,
        stateProvince,
        postalCode,
        countryCode,
        isValidated ? 1 : 0,
        validatedBy || null,
        normalizedAddress || null,
        valResponseJson || null
      ]);

      return result.insertId;
    } catch (error) {
      logger.error('Database query error in Address.create: ' + error.stack);
      throw error;
    }
  }

  /**
   * Find a active address by its ID
   * @param {number} id 
   * @returns {Promise<Object|null>} Address details or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(queries.GET_ADDRESS_BY_ID, [id]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch (error) {
      logger.error('Database query error in Address.findById: ' + error.stack);
      throw error;
    }
  }

  /**
   * Find all active (non-deleted) addresses
   * @returns {Promise<Array>} Array of active addresses
   */
  static async findAll() {
    try {
      const [rows] = await pool.execute(queries.GET_ALL_ACTIVE_ADDRESSES);
      return rows;
    } catch (error) {
      logger.error('Database query error in Address.findAll: ' + error.stack);
      throw error;
    }
  }

  /**
   * Soft delete an address by ID
   * @param {number} id 
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async softDelete(id) {
    try {
      const [result] = await pool.execute(queries.SOFT_DELETE_ADDRESS, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Database query error in Address.softDelete: ' + error.stack);
      throw error;
    }
  }
}

module.exports = Address;
