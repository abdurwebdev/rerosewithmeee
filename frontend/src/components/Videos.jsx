import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Videos = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/posts`);
        setPosts(res.data.posts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };
    fetchPosts();
  }, []);
  useEffect(() => {
    console.log(posts);
  

  }, [posts])
  
  return (
    <div className="grid bg-black text-white grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {posts.map((item) => (
        <Link key={item._id} to={`/videopage/${item._id}`}>
          <div className="flex flex-col bg-[#FF6B00] p-1 shadow-md rounded-xl hover:scale-105 transition">

            {/* Thumbnail */}
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-48 object-cover rounded-lg"
            />

            {/* Author Info + Title */}
            <div className="flex items-center gap-2 p-2">
              <img
                src={item.user?.avatar || '/default-avatar.png'}
                alt={item.user?.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <p className="font-semibold">{item.caption}</p>
                <p className="text-sm text-gray-200">
                  {item.user?.username} • {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Videos;
