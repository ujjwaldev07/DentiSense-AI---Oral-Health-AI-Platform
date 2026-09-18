import { ROLES } from '../config/constants.js';
import { sendError } from '../utils/apiResponse.js';

export const requireRole = (allowedRoles = [ROLES.ADMIN]) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', null, 401);
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission to perform this action.', null, 403);
    }

    next();
  };
};

export const requireAdmin = requireRole([ROLES.ADMIN]);
