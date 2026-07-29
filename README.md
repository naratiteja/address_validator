# Global Address Validation Service

A complete, production-ready address validation and normalization service supporting the United States, Canada, and India. Built using Node.js, Express.js, MySQL, and a responsive Bootstrap 5 Glassmorphism UI.

## Features

- **USPS Address Verification**: Validates and normalizes US addresses using the USPS Web Tools XML API.
- **Canada Post AddressComplete Verification**: Performs interactive lookup and detailed retrieval of Canadian addresses.
- **India Address Validation**: Utilizes OpenStreetMap Nominatim API for structural search and verification.
- **Unified Address Model**: Normalizes responses from all validation engines into a standard format.
- **Secure Storage**: Saves validated addresses inside a local MySQL database with prepared statements and soft-deletes.
- **Input Validation**: Uses `express-validator` to sanitize and validate input fields inline.
- **Rate Limiting**: Protects validate and save endpoints from API abuse with `express-rate-limit`.
- **Global Error Handling**: Centrally logs stack traces to files/consoles and returns clean, uniform JSON errors.
- **Responsive Web Dashboard**: Beautiful, custom-designed Bootstrap 5 dashboard utilizing HSL colors, Outfit typography, glassmorphism cards, and interactive hover effects.

---

## Folder Structure

```text
address-validator/
├── server.js               # Application entry point
├── package.json            # Node.js dependencies and scripts
├── .env                    # System configuration details
├── .env.example            # Environment variables template
├── .gitignore              # Files excluded from git
├── README.md               # Setup and API documentation
│
├── public/                 # Static assets for the frontend
│   ├── index.html          # Web layout
│   ├── style.css           # Custom glassmorphism stylesheet
│   └── script.js           # AJAX integration and UI binding
│
└── src/
    ├── controllers/
    │   └── address.controller.js  # Business logic controllers
    ├── db/
    │   ├── connection.js          # MySQL connection pool configuration
    │   ├── migrations/
    │   │   └── create_tables.sql  # SQL schema migrations file
    │   └── queries/
    │       └── address.query.js   # Parameterized SQL query strings
    ├── middleware/
    │   ├── errorHandler.js        # Global error catcher
    │   ├── notFound.js            # 404 unmapped route handler
    │   ├── rateLimiter.js         # API rate limiter configuration
    │   └── validateRequest.js     # Input schema validation checker
    ├── models/
    │   └── address.model.js       # Address database interface model
    ├── routes/
    │   └── address.routes.js      # REST API route mappings
    └── utils/
        ├── apiResponse.js         # Formatted API JSON output helper
        ├── constants.js           # Shared app constant definitions
        └── logger.js              # Centralized Winston logging
```

---

## Installation & Setup

### 1. Clone the repository
Extract or open the workspace folder `address-validator`.

### 2. Install dependencies
Run:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```ini
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=address_validator
USPS_USER_ID=your_usps_user_id
CANADA_POST_API_KEY=your_canada_post_api_key
USER_AGENT=GlobalAddressValidator/1.0 (contact@example.com)
```

### 4. Database Setup & Migrations
Ensure your MySQL server is running. Log into your MySQL console and execute the SQL file:
```sql
SOURCE src/db/migrations/create_tables.sql;
```
Or run it from the command line:
```bash
mysql -u root -p < src/db/migrations/create_tables.sql
```
This script will:
- Create the database `address_validator` if it doesn't exist.
- Build the `users` and `addresses` tables.
- Add performance indices and foreign keys.
- Seed a default test user with `id = 1`.

---

## Running the Application

To run the application in production mode:
```bash
npm start
```
To run the application in development mode with auto-reloads (requires nodemon):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## API Documentation

### 1. Validate Address
- **URL**: `/api/address/validate`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "countryCode": "US",
    "streetLine1": "1600 Amphitheatre Pkwy",
    "streetLine2": "",
    "city": "Mountain View",
    "stateProvince": "CA",
    "postalCode": "94043"
  }
  ```
- **Success Response (Valid Address)**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "valid": true,
      "normalizedAddress": "1600 Amphitheatre Pkwy, Mountain View, CA, 94043, USA",
      "validatedBy": "USPS",
      "rawResponse": {}
    }
    ```
- **Success Response (Invalid Address)**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "valid": false,
      "message": "Address not found."
    }
    ```

### 2. Save Address
- **URL**: `/api/address/save`
- **Method**: `POST`
- **Request Body**: (Same format as validation request. Address must be valid)
- **Success Response**:
  - **Status Code**: `201 Created`
  - **Body**:
    ```json
    {
      "success": true,
      "id": 1,
      "message": "Address Saved Successfully"
    }
    ```

### 3. List Addresses
- **URL**: `/api/address/list`
- **Method**: `GET`
- **Success Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Addresses retrieved successfully",
      "addresses": [
        {
          "id": 1,
          "userId": 1,
          "streetLine1": "...",
          "streetLine2": "...",
          ...
        }
      ]
    }
    ```

### 4. Get Address details
- **URL**: `/api/address/:id`
- **Method**: `GET`
- **Success Response**:
  - **Status Code**: `200 OK`

### 5. Soft Delete Address
- **URL**: `/api/address/:id`
- **Method**: `DELETE`
- **Success Response**:
  - **Status Code**: `200 OK`

---

## Future Enhancements
1. **Batch Validation**: Allow upload of CSV files containing multiple addresses for bulk processing.
2. **Autocomplete API integration**: Implement frontend search-as-you-type to suggestions using Canada Post or Google Places.
3. **Multi-User Authentication**: Integrate real JWT-based user signup/signin.
