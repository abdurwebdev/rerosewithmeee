const express = require('express');
const router = express.Router();
const {updateProfile,getProfile, followUser, unfollowUser, searchUsers, getSuggestedUsers} = require('../controllers/userController');
const {checkToken} = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { createPost,getPosts,getPostsByUser, likePost, dislikePost, commentPost, readComment, editComment, deleteComment, savePost, unsavePost, getPostById, deletePost } = require('../controllers/postController');


router.post("/api/user/updateprofile",checkToken,updateProfile);
router.post("/api/user/getprofile",checkToken,getProfile);
router.post("/api/user/followuser",checkToken,followUser);
router.post("/api/user/unfollowuser",checkToken,unfollowUser);
router.get("/api/user/search", checkToken, searchUsers);
router.get("/api/user/suggested", checkToken, getSuggestedUsers);
router.post("/api/user/createpost",checkToken,upload.fields([{ name: "media", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),createPost)
router.get("/api/user/posts",getPosts);
router.get("/api/user/post/:postId", checkToken, getPostById);
router.get("/api/user/posts/:userId",getPostsByUser)
router.post("/api/user/like/:id",checkToken,likePost);
router.post("/api/user/dislike/:id",checkToken,dislikePost);
router.post("/api/user/comment/:postId",checkToken,commentPost);
router.get("/api/user/readcomment/:postId",readComment);
router.put("/api/user/editcomment/:commentId",checkToken,editComment)
router.delete("/api/user/deletecomment/:commentId",checkToken,deleteComment)
router.post("/api/user/save/:postId",checkToken,savePost);
router.delete("/api/user/unsavepost/:postId",checkToken,unsavePost)
router.delete("/api/user/post/:postId", checkToken, deletePost)


module.exports = router;