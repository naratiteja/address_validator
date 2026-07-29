module.exports = {
  INSERT_ADDRESS: `
    INSERT INTO addresses (
      user_id, street_line1, street_line2, city, state_province, 
      postal_code, country_code, is_validated, validated_by, 
      normalized_address, validation_response
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  GET_ADDRESS_BY_ID: `
    SELECT 
      id, user_id, street_line1, street_line2, city, state_province, 
      postal_code, country_code, is_validated, validated_by, 
      normalized_address, validation_response, created_at, updated_at
    FROM addresses 
    WHERE id = ? AND is_deleted = FALSE
  `,

  GET_ALL_ACTIVE_ADDRESSES: `
    SELECT 
      id, user_id, street_line1, street_line2, city, state_province, 
      postal_code, country_code, is_validated, validated_by, 
      normalized_address, validation_response, created_at, updated_at
    FROM addresses 
    WHERE is_deleted = FALSE
    ORDER BY created_at DESC
  `,

  SOFT_DELETE_ADDRESS: `
    UPDATE addresses 
    SET is_deleted = TRUE 
    WHERE id = ? AND is_deleted = FALSE
  `
};
