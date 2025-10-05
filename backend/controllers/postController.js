const Post = require('../models/Post');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const fs = require("fs");
const { compressVideo } = require("../utils/compressVideo");
const User = require('../models/User');
const Comment = require('../models/Comment');
const Save = require('../models/Save');
const createPost = async (req, res) => {
  try {
    const { type, title, caption, tags } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: "Post type is required" });
    }

    let mediaUrl = null;
    let thumbnailUrl = null;
    let mediaPublicId = null;
    let thumbnailPublicId = null;

    // --- 1️⃣ Handle image / video uploads ---
    if (type !== "text") {
      if (!req.files || !req.files.media) {
        return res.status(400).json({ success: false, message: "Media file is required for image/video post" });
      }

      // 🟢 IMAGE upload
      if (type === "image") {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image", folder: "posts_mern" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          streamifier.createReadStream(req.files.media[0].buffer).pipe(stream);
        });

        mediaUrl = uploadResult.secure_url;
        mediaPublicId = uploadResult.public_id;
      }

      // 🎥 VIDEO upload with compression
      if (type === "video") {
        // Step 1 — Compress video
        const compressedPath = await compressVideo(req.files.media[0].buffer, req.files.media[0].originalname);

        // Step 2 — Upload compressed video to Cloudinary
        const videoUpload = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            compressedPath,
            { resource_type: "video", folder: "posts_mern" },
            (error, result) => {
              fs.unlinkSync(compressedPath); // cleanup local compressed file
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        mediaUrl = videoUpload.secure_url;
        mediaPublicId = videoUpload.public_id;

        // Step 3 — Upload thumbnail
        if (!req.files.thumbnail) {
          return res.status(400).json({ success: false, message: "Thumbnail is required for video post" });
        }

        const thumbUpload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image", folder: "posts_mern/thumbnails" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          streamifier.createReadStream(req.files.thumbnail[0].buffer).pipe(stream);
        });

        thumbnailUrl = thumbUpload.secure_url;
        thumbnailPublicId = thumbUpload.public_id;
      }
    }

    // --- 2️⃣ Save Post in MongoDB ---
    const newPost = await Post.create({
      user: req.user.id,
      type,
      title,
      caption,
      mediaUrl,
      mediaPublicId,
      thumbnailUrl,
      thumbnailPublicId,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    });

    // --- 3️⃣ Response ---
    return res.status(201).json({
      success: true,
      message: "Post created successfully (with compression if video)",
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating post",
      error: error.message,
    });
  }
};


const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("user", "username avatar followers") // Include followers for count and follow state
      .populate({
        path: "comments",
        populate: { path: "user", select: "username avatar" }, // Deep-populate user for each comment
      });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found!" });
    }

    // Debug log
    console.log("[getPostById] post:", {
      id: post._id,
      user: post.user,
      commentsCount: post.comments?.length,
      firstCommentUser: post.comments?.[0]?.user,
    });

    res.status(200).json({ success: true, post, currentUserId: req.user?.id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
    .populate('user', 'username avatar') // ✅ Get username & avatar
    .sort({ createdAt: -1 }); // newest first

    if (!posts || posts.length === 0) {
      return res.status(404).json({ success: false, message: "No posts found!" });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Posts retrieved successfully", 
      posts 
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId });

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No posts found for this user",
        posts: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "Posts by user fetched successfully",
      posts
    });

  } catch (error) {
    console.error("Error fetching posts by user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    // Remove user from dislikes first
    await Post.findByIdAndUpdate(id, {
      $pull: { dislikes: { user: userId } }
    });

    // If already liked, remove like
    const post = await Post.findOneAndUpdate(
      { _id: id, "likes.user": userId },
      { $pull: { likes: { user: userId } } },
      { new: true }
    ).populate("user", "username");

    if (post) {
      return res.status(200).json({
        message: "Like removed",
        likesCount: post.likes.length,
        dislikesCount: post.dislikes.length,
        post
      });
    }

    // Otherwise, add like
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { likes: { user: userId } } },
      { new: true }
    ).populate("user", "username");

    return res.status(200).json({
      message: "Post liked",
      likesCount: updatedPost.likes.length,
      dislikesCount: updatedPost.dislikes.length,
      post: updatedPost
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

const dislikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    // Remove user from likes first
    await Post.findByIdAndUpdate(id, {
      $pull: { likes: { user: userId } }
    });

    // If already disliked, remove dislike
    const post = await Post.findOneAndUpdate(
      { _id: id, "dislikes.user": userId },
      { $pull: { dislikes: { user: userId } } },
      { new: true }
    ).populate("user", "name");

    if (post) {
      return res.status(200).json({
        message: "Dislike removed",
        likesCount: post.likes.length,
        dislikesCount: post.dislikes.length,
        post
      });
    }

    // Otherwise, add dislike
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { dislikes: { user: userId } } },
      { new: true }
    ).populate("user", "name");

    return res.status(200).json({
      message: "Post disliked",
      likesCount: updatedPost.likes.length,
      dislikesCount: updatedPost.dislikes.length,
      post: updatedPost
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

const commentPost = async (req, res) => {
  try {
    const id = req.user.id; // ✅ Correct destructuring
    const { postId } = req.params;
    const { content } = req.body;

    // 1. Find user (only select safe fields)
    const currentUser = await User.findById(id).select("name email _id");

    // 2. Create comment
    const createdComment = await Comment.create({
      content,
      post: postId,
      user: id // Link comment to user
    });

    // 3. Push comment into post's comments array
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: createdComment._id }
    });

    // 4. Populate user's public fields for immediate frontend use
    const populatedComment = await Comment.findById(createdComment._id)
      .populate({ path: 'user', select: 'username avatar' });

    // Debug log
    console.log("[commentPost] created:", populatedComment);

    // 5. Return response
    res.status(201).json({
      success: true,
      message: "Comment Created!",
      user: currentUser,
      comment: populatedComment
    });

  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};


const readComment = async (req,res) =>{
   try {
     const {postId} = req.params;
     let particularPost = await Post.findById(postId).populate('comments');
     res.status(200).json(
      {
        success:true,
        message:"Comment Fetched Successfully!",
        postComments:particularPost  
      }
    ) 
   } catch (error) {
    return res.status(500).json(
      {
        success:false,
        message:"Internal Server Error!",
      }
    )
   }
}

const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found!"
      });
    }

    // ✅ Check if user field exists before calling .toString()
    if (!comment.user) {
      return res.status(400).json({
        success: false,
        message: "Comment has no user linked, cannot verify ownership!"
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this comment!"
      });
    }

    comment.content = content;
    const updatedComment = await comment.save();
    const populatedUpdated = await Comment.findById(updatedComment._id)
      .populate({ path: 'user', select: 'username avatar' });

    res.status(200).json({
      success: true,
      message: "Comment updated successfully!",
      comment: populatedUpdated
    });

  } catch (error) {
    console.error("Error editing comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



const deleteComment = async (req,res) =>{
      try {
        const {commentId} = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) {
          return res.status(404).json({ success: false, message: "Comment not found" });
        }

        // ownership check
        if (comment.user?.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: "You are not allowed to delete this comment" });
        }

        // remove reference from post.comments
        await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
          success: true,
          message: "Comment deleted successfully",
          commentId
        });
      } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json(
          {
            success:false,
            message:"Internal Server Error!"
          }
        )
      }
}

const savePost = async (req, res) => {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized! User not found" });
    }

    const { postId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $addToSet: { savedPosts: postId } }, // ✅ field name matches schema
      { new: true }
    ).populate("savedPosts"); // optional: populate with post details

    res.status(201).json({
      success: true,
      message: "Post Saved Successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const unsavePost = async (req, res) => {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized! User not found" });
    }

    const { postId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $pull: { savedPosts: postId } },
      { new: true }
    ).populate("savedPosts");

    res.status(201).json({
      success: true,
      message: "Post Unsaved Successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error unsaving post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



// ✅ Delete Post (owner only) and clean up cloudinary assets
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.user.toString() !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to delete this post' });
    }

    // Best-effort cloudinary cleanup
    try {
      if (post.mediaPublicId) {
        await cloudinary.uploader.destroy(post.mediaPublicId, { resource_type: post.type === 'video' ? 'video' : 'image' });
      }
      if (post.thumbnailPublicId) {
        await cloudinary.uploader.destroy(post.thumbnailPublicId, { resource_type: 'image' });
      }
    } catch (e) {
      console.warn('[deletePost] cloudinary cleanup failed:', e?.message);
    }

    await Post.findByIdAndDelete(postId);

    // Also remove from users' savedPosts
    await User.updateMany({}, { $pull: { savedPosts: postId } });

    return res.status(200).json({ success: true, message: 'Post deleted', postId });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { createPost ,getPosts,getPostsByUser,likePost,dislikePost,commentPost,readComment,editComment,deleteComment ,savePost,unsavePost,getPostById, deletePost};
