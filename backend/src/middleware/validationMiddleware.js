import { sendError } from '../utils/apiResponse.js';

export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return sendError(res, 'Validation failed. Please check input parameters.', formattedErrors, 400);
      }
      return sendError(res, 'Invalid request data', error.message, 400);
    }
  };
};
