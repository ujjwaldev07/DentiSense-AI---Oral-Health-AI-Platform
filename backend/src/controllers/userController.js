import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';

export const getAllUsers = async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (role && role !== 'all') {
    filter.role = role;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter)
  ]);

  return sendPaginated(res, 'Users retrieved', users, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  });
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive, role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid user ID', null, 400);
  }

  const updates = {};
  if (isActive !== undefined) updates.isActive = Boolean(isActive);
  if (role && ['user', 'admin'].includes(role)) updates.role = role;

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
  if (!user) {
    return sendError(res, 'User not found', null, 404);
  }

  return sendSuccess(res, 'User updated successfully', user);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid user ID', null, 400);
  }

  // Prevent self-deletion
  if (String(id) === String(req.user._id)) {
    return sendError(res, 'You cannot delete your own admin account.', null, 400);
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return sendError(res, 'User not found', null, 404);
  }

  return sendSuccess(res, 'User deleted successfully');
};
