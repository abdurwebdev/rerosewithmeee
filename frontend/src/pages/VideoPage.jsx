import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import 'remixicon/fonts/remixicon.css'
const VideoPage = () => {
  const PLACEHOLDER_AVATAR = "https://i.pravatar.cc/80";
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null); // Track comment being edited
  const [editCommentContent, setEditCommentContent] = useState(""); // Track edit content
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingDislike, setLoadingDislike] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Axios instance with cookies
  const axiosAuth = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  });

  // Fetch post & recommended videos
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/post/${postId}`,
          { withCredentials: true }
        );
        // console.log("[VideoPage] fetched post:", res.data.post);
        // console.log("[VideoPage] currentUserId:", res.data.currentUserId);
        setPost(res.data.post);
        setCurrentUserId(res.data.currentUserId || null);
        setFollowersCount(res.data.post.user.followers?.length || 0);
        const myId = res.data.currentUserId;
        if (res.data.post.user.followers?.includes(myId)) {
          setIsFollowing(true);
        }
        if (res.data.post?.savedBy) {
          setIsSaved(res.data.post.savedBy.includes(myId));
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      }
    };

    const fetchRecommended = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/posts`);
        setRecommended(res.data.posts.filter((p) => p._id !== postId));
      } catch (error) {
        console.error("Failed to fetch recommended posts:", error);
      }
    };

    fetchPost();
    fetchRecommended();
  }, [postId]);
  useEffect(() => {
    console.log(recommended);

  }, [recommended])

  // Like Post
  const handleLike = async () => {
    if (loadingLike) return;
    setLoadingLike(true);
    try {
      const res = await axiosAuth.post(`/api/user/like/${post._id}`);
      console.log("[VideoPage] like response counts:", {
        likes: res.data.post?.likes?.length,
        dislikes: res.data.post?.dislikes?.length,
      });
      // Only update reactions to avoid clobbering populated comments
      setPost((prev) => ({
        ...prev,
        likes: res.data.post?.likes || prev.likes,
        dislikes: res.data.post?.dislikes || prev.dislikes,
      }));
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setLoadingLike(false);
    }
  };

  // Dislike Post
  const handleDislike = async () => {
    if (loadingDislike) return;
    setLoadingDislike(true);
    try {
      const res = await axiosAuth.post(`/api/user/dislike/${post._id}`);
      console.log("[VideoPage] dislike response counts:", {
        likes: res.data.post?.likes?.length,
        dislikes: res.data.post?.dislikes?.length,
      });
      // Only update reactions to avoid clobbering populated comments
      setPost((prev) => ({
        ...prev,
        likes: res.data.post?.likes || prev.likes,
        dislikes: res.data.post?.dislikes || prev.dislikes,
      }));
    } catch (error) {
      console.error("Failed to dislike post:", error);
    } finally {
      setLoadingDislike(false);
    }
  };

  // Save / Unsave Post
  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await axiosAuth.delete(`/api/user/unsavepost/${post._id}`);
        setIsSaved(false);
      } else {
        await axiosAuth.post(`/api/user/save/${post._id}`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Failed to save/unsave post:", error);
    }
  };

  // Delete Post
  const canDelete = post && currentUserId && post.user?._id === currentUserId;
  const handleDelete = async () => {
    try {
      await axiosAuth.delete(`/api/user/post/${post._id}`);
      window.location.href = '/home';
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Follow / Unfollow User
  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await axiosAuth.post(`/api/user/unfollowuser`, {
          followUserId: post.user._id,
        });
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(prev - 1, 0));
      } else {
        await axiosAuth.post(`/api/user/followuser`, {
          followUserId: post.user._id,
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to follow/unfollow:", error);
    }
  };

  // Comment Submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axiosAuth.post(`/api/user/comment/${post._id}`, {
        content: newComment,
      });
      console.log("[VideoPage] create comment response:", res.data);
      setPost((prev) => ({
        ...prev,
        comments: [...prev.comments, res.data.comment],
      }));

      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  // Edit Comment
  const handleEditComment = async (commentId) => {
    if (!editCommentContent.trim()) return;

    try {
      const res = await axiosAuth.put(`/api/user/editcomment/${commentId}`, {
        content: editCommentContent,
      });
      console.log("[VideoPage] edit comment response:", res.data);
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === commentId ? res.data.comment : c
        ),
      }));

      setEditingCommentId(null);
      setEditCommentContent("");
    } catch (error) {
      console.error("Failed to edit comment:", error);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await axiosAuth.delete(`/api/user/deletecomment/${commentId}`);
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c._id !== commentId),
      }));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  function timeAgo(date) {
    if (!date) return "just now";
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "just now";
    const now = new Date();
    const secondsPast = Math.max(0, (now.getTime() - parsed.getTime()) / 1000);

    if (secondsPast < 60) {
      return `${Math.floor(secondsPast)} seconds ago`;
    }
    if (secondsPast < 3600) {
      return `${Math.floor(secondsPast / 60)} minutes ago`;
    }
    if (secondsPast < 86400) {
      return `${Math.floor(secondsPast / 3600)} hours ago`;
    }
    if (secondsPast < 604800) {
      return `${Math.floor(secondsPast / 86400)} days ago`;
    }
    if (secondsPast < 31536000) {
      return `${Math.floor(secondsPast / 604800)} weeks ago`;
    }
    return `${Math.floor(secondsPast / 31536000)} years ago`;
  }


  if (!post) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="w-full bg-black text-white font-[gilroy] flex flex-col xl:flex-row xl:gap-x-10 px-5">
      {/* LEFT SIDE: VIDEO */}
      <div className="flex-1 bg-black rounded-lg overflow-hidden">
        <video
          className="w-full h-[400px] xl:h-[500px] object-contain"
          src={post.mediaUrl}
          controls
          autoPlay
        ></video>

        <div className="p-3">
          {/* Post Info with Avatar */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={post.user?.avatar || PLACEHOLDER_AVATAR}
              alt={post.user?.username || "User"}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_AVATAR;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{post.title}</h2>
              </div>
              <p className="text-white">{post.caption}</p>
              <p className="text-sm text-gray-400">
                <span className="font-semibold">{post.user?.username || "Anonymous"}</span>
                <span className="mx-1">•</span>
                <span>{timeAgo(post.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mt-3 items-center">
            <button
              onClick={handleFollowToggle}
              className="px-6 py-2 bg-[#FF6A00] text-white rounded-xl hover:opacity-90"
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            <span className="text-white">
              {followersCount} Followers
            </span>

            <button
              onClick={handleLike}
              disabled={loadingLike}
              className="py-2 cursor-pointer text-[#FF6A00] rounded-xl disabled:opacity-50 hover:opacity-90"
            >

              <i className="ri-heart-line text-xl"></i> {post.likes?.length || 0}
            </button>
            <button
              onClick={handleDislike}
              disabled={loadingDislike}
              className="cursor-pointer py-2 text-white rounded-xl disabled:opacity-50 hover:opacity-90"
            >
              <i className="ri-dislike-line text-xl"></i> {post.dislikes?.length || 0}
            </button>
            <button
              onClick={handleSaveToggle}
              className="px-4 py-2 bg-[#FF6A00] text-white rounded-xl hover:opacity-90"
            >
              {isSaved ? "Unsave" : "Save"}
            </button>
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:opacity-90"
              >
                Delete
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-5">
            <h3 className="font-semibold text-lg mb-2">
              Comments ({post.comments?.length || 0})
            </h3>
            <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg p-2 text-black bg-white outline-0 placeholder:text-black border-0"
              />
              <button
                type="submit"
                className="px-4 bg-[#FF6A00] text-white rounded-lg hover:opacity-90"
              >
                Post
              </button>
            </form>

            {post.comments?.length > 0 ? (
              [...post.comments]
                .reverse()
                .map((c) => (
                  <div
                    key={c._id}
                    className="border-b border-[#FF6A00] pb-2 mb-2 text-sm text-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={c.user?.avatar || PLACEHOLDER_AVATAR}
                        alt={c.user?.username || "Anonymous"}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER_AVATAR;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{c.user?.username || "Anonymous"}</p>
                          <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                        </div>
                        {editingCommentId === c._id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleEditComment(c._id);
                            }}
                            className="flex gap-2 mt-1"
                          >
                            <input
                              type="text"
                              value={editCommentContent}
                              onChange={(e) =>
                                setEditCommentContent(e.target.value)
                              }
                              className="flex-1 border rounded-lg bg-white placeholder:text-black p-1 text-black"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1 bg-[#FF6A00] text-white rounded-lg hover:opacity-90"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 bg-zinc-700 text-white rounded-lg hover:opacity-90"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <p className="text-white">{c.content}</p>
                        )}
                      </div>
                    </div>
                    {/* Edit/Delete Buttons for Comment Owner */}
                    {(() => { console.log('[VideoPage] comment owner vs me', { cUser: c.user?._id, me: currentUserId, can: c.user?._id === currentUserId }); return c.user?._id === currentUserId; })() && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => {
                            setEditingCommentId(c._id);
                            setEditCommentContent(c.content);
                          }}
                          className="text-[#FF6A00] hover:opacity-90 text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-[#FF6A00] hover:opacity-90 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: RECOMMENDED VIDEOS */}
      <div className="xl:w-[300px] space-y-4">
        <h3 className="text-lg font-semibold">Recommended Videos</h3>
        {recommended.map((item) => (
          <a
            key={item._id}
            href={`/videopage/${item._id}`}
            className="block bg-zinc-900 shadow-md rounded-xl p-2 hover:scale-105 transition"
          >
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-32 object-cover rounded-lg"
            />
            <p className="mt-1 text-sm font-semibold">{item.caption}</p>
            <div className="flex gap-x-3 items-center">
              <img className="w-10 h-10 rounded-full bg-amber-300" src={item.user.avatar} alt="" />
              <div>
                <p className="mt-1 text-sm font-semibold">{item.user.username}</p>
                <p className="mt-1 text-sm font-semibold">{timeAgo(item.createdAt)}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 text-white rounded-xl w-[90%] max-w-md p-5">
            <h3 className="text-xl font-semibold mb-2">Delete this post?</h3>
            <p className="text-sm text-gray-300">This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-2 rounded bg-zinc-700">Cancel</button>
              <button onClick={handleDelete} className="px-3 py-2 rounded bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPage;