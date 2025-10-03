const User = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// ✅ Update Profile
const updateProfile = async (req, res) => {
  const { id } = req.user;
  const { newusername, newemail, newpassword, newbio, newavatar } = req.body;

  try {
    let updatedFields = {
      username: newusername,
      email: newemail,
      bio: newbio,
      avatar: newavatar
    };

    if (newpassword) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(newpassword, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, { new: true }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Updated Successfully!", user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

// ✅ Get Profile
const getProfile = async (req, res) => {
  const { id } = req.user;

  try {
    const userProfile = await User.findById(id).select("-password");

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User Found", user: userProfile });
  } catch (error) {
    console.error("[getProfile] Error:", error);
    return res.status(500).json({ message: "Internal server error!", error: error.message });
  }
};

// ✅ Follow User
const followUser = async (req, res) => {
  const { followUserId } = req.body;
  const currentUserId = req.user.id;

  try {
    if (!followUserId) {
      return res.status(400).json({ message: "followUserId is required" });
    }

    if (followUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const followedUser = await User.findByIdAndUpdate(
      followUserId,
      { $addToSet: { followers: currentUserId } },
      { new: true }
    );

    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: followUserId } },
      { new: true }
    );

    if (!followedUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    return res.status(200).json({ message: "User Followed", user: followedUser, currentUser: updatedCurrentUser });
  } catch (error) {
    console.error("Follow User Error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

// ✅ Unfollow User
const unfollowUser = async (req, res) => {
  const { followUserId } = req.body;
  const currentUserId = req.user.id;

  try {
    const unfollowedUser = await User.findByIdAndUpdate(
      followUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    );

    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: followUserId } },
      { new: true }
    );

    if (!unfollowedUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    return res.status(200).json({ message: "Unfollowed", user: unfollowedUser, currentUser: updatedCurrentUser });
  } catch (error) {
    console.error("Unfollow User Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Search Users
const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(200).json({ users: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    }).select('-password').limit(10).lean();

    return res.status(200).json({ users });
  } catch (error) {
    console.error('[searchUsers] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Suggested Users
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const me = await User.findById(currentUserId).select('following');
    const followingIds = (me?.following || []).map((u) => mongoose.Types.ObjectId(String(u)));

    const suggestions = await User.aggregate([
      { $match: { _id: { $ne: mongoose.Types.ObjectId(currentUserId) } } },
      { $match: { _id: { $nin: followingIds } } },
      { $sample: { size: 8 } },
      { $project: { password: 0 } },
    ]);

    return res.status(200).json({ users: suggestions });
  } catch (error) {
    console.error('[getSuggestedUsers] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Export everything properly
module.exports = {
  updateProfile,
  getProfile,
  followUser,
  unfollowUser,
  searchUsers,
  getSuggestedUsers
};
