export const COMMON_MESSAGES = {
  HELLO_API: 'Hello API',
  USER_NOT_FOUND_IN_CONTEXT: 'User not found in request context',
  MERCHANT_ID_REQUIRED: 'Merchant ID is required',
  INVALID_MERCHANT_ID: 'Invalid Merchant ID',
  INVALID_MERCHANT_ID_FORMAT: 'Invalid Merchant ID format',
};

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCESS_DENIED: 'Access Denied',
  INVALID_REFRESH_TOKEN: 'Invalid Refresh Token',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  OTP_VERIFIED_SUCCESSFULLY: 'OTP verified successfully',
  OTP_SENT_SUCCESSFULLY: 'OTP sent successfully',
  INVALID_OR_EXPIRED_VERIFICATION_TOKEN:
    'Invalid or expired verification token',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  PHONE_NUMBER_MISMATCH: 'Phone number does not match the verified token',
  LOGGED_OUT_SUCCESSFULLY: 'Logged out successfully',
};

export const PRODUCT_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Product not found',
  PERMISSION_DENIED_MODIFICATION:
    'You do not have permission to modify this product',
  PERMISSION_DENIED_CREATION:
    'You do not have permission to create products for this merchant',
};

export const CATEGORY_MESSAGES = {
  NOT_FOUND: 'Category not found',
};

export const RESOURCE_MESSAGES = {
  NOT_FOUND: (target: string) => `${target} not found`,
  OPERATION_DENIED: (target: string, status: string) =>
    `Operation denied. ${target} status is ${status}. Please contact support.`,
};
