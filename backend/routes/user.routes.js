const express = require('express');
const router = express.Router();
const {updateProfile,getProfile, followUser, unfollowUser, searchUsers, getSuggestedUsers} = require('../controllers/userController');
const {checkToken} = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { createPost,getPosts,getPostsByUser, likePost, dislikePost, commentPost, readComment, editComment, deleteComment, savePost, unsavePost, getPostById, deletePost } = require('../controllers/postController');


router.post("/updateprofile",checkToken,updateProfile);
router.post("/getprofile",checkToken,getProfile);
router.post("/followuser",checkToken,followUser);
router.post("/unfollowuser",checkToken,unfollowUser);
router.get("/search", checkToken, searchUsers);
router.get("/suggested", checkToken, getSuggestedUsers);
router.post("/createpost",checkToken,upload.fields([{ name: "media", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),createPost)
router.get("/posts",getPosts);
router.get("/post/:postId", getPostById);
router.get("/posts/:userId",getPostsByUser)
router.post("/like/:id",checkToken,likePost);
router.post("/dislike/:id",checkToken,dislikePost);
router.post("/comment/:postId",checkToken,commentPost);
router.get("/readcomment/:postId",readComment);
router.put("/editcomment/:commentId",checkToken,editComment)
router.delete("/deletecomment/:commentId",checkToken,deleteComment)
router.post("/save/:postId",checkToken,savePost);
router.delete("/unsavepost/:postId",checkToken,unsavePost)
router.delete("/post/:postId", checkToken, deletePost)


module.exports = router;