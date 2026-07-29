const express = require('express');
const { body, param } = require('express-validator');
const AddressController = require('../controllers/address.controller');
const validateRequest = require('../middleware/validateRequest');
const apiLimiter = require('../middleware/rateLimiter');
const { COUNTRIES } = require('../utils/constants');

const router = express.Router();

// Supported countries list for validation check
const supportedCountries = Object.values(COUNTRIES);

// Common Address validation schema
const addressValidationSchema = [
  body('streetLine1')
    .trim()
    .notEmpty().withMessage('Street Line 1 is required')
    .isLength({ max: 255 }).withMessage('Street Line 1 cannot exceed 255 characters'),
  body('streetLine2')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Street Line 2 cannot exceed 255 characters'),
  body('city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('stateProvince')
    .trim()
    .notEmpty().withMessage('State / Province is required')
    .isLength({ max: 100 }).withMessage('State / Province cannot exceed 100 characters'),
  body('postalCode')
    .trim()
    .notEmpty().withMessage('Postal Code is required')
    .isLength({ max: 20 }).withMessage('Postal Code cannot exceed 20 characters'),
  body('countryCode')
    .trim()
    .notEmpty().withMessage('Country Code is required')
    .toUpperCase()
    .isLength({ min: 2, max: 2 }).withMessage('Country Code must be a 2-letter ISO code')
    .isIn(supportedCountries).withMessage(`Unsupported country. Supported: ${supportedCountries.join(', ')}`)
];

// Routes

/**
 * @route POST /api/address/validate
 * @desc Validate address structure against external API
 */
router.post(
  '/validate',
  apiLimiter,
  addressValidationSchema,
  validateRequest,
  AddressController.validateAddress
);

/**
 * @route POST /api/address/save
 * @desc Validate and save address to MySQL database
 */
router.post(
  '/save',
  apiLimiter,
  addressValidationSchema,
  validateRequest,
  AddressController.saveAddress
);

/**
 * @route GET /api/address/list
 * @desc Retrieve all saved active addresses
 */
router.get(
  '/list',
  AddressController.listAddresses
);

/**
 * @route GET /api/address/:id
 * @desc Retrieve details of a single saved address
 */
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
  ],
  validateRequest,
  AddressController.getAddressById
);

/**
 * @route DELETE /api/address/:id
 * @desc Soft-delete a saved address
 */
router.delete(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
  ],
  validateRequest,
  AddressController.deleteAddress
);

module.exports = router;
