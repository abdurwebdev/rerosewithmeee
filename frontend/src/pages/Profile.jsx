import React, { useEffect, useState } from 'react'
import axios from 'axios'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '', avatar: '' })
  const [saving, setSaving] = useState(false)

  const axiosAuth = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })

  const timeAgo = (date) => {
    if (!date) return 'just now'
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return 'just now'
    const now = new Date()
    const secondsPast = Math.max(0, (now.getTime() - parsed.getTime()) / 1000)
    if (secondsPast < 60) return `${Math.floor(secondsPast)} seconds ago`
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)} minutes ago`
    if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)} hours ago`
    if (secondsPast < 604800) return `${Math.floor(secondsPast / 86400)} days ago`
    if (secondsPast < 31536000) return `${Math.floor(secondsPast / 604800)} weeks ago`
    return `${Math.floor(secondsPast / 31536000)} years ago`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axiosAuth.post('/api/user/getprofile')
        console.log('[Profile] getprofile response:', profileRes.data)
        setUser(profileRes.data.user)
        setForm({
          username: profileRes.data.user?.username || '',
          bio: profileRes.data.user?.bio || '',
          avatar: profileRes.data.user?.avatar || ''
        })

        if (profileRes.data.user?._id) {
          try {
            const postsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/posts/${profileRes.data.user._id}`)
            console.log('[Profile] posts response:', postsRes.data)
            setPosts(postsRes.data.posts || [])
          } catch (postsErr) {
            if (postsErr?.response?.status === 404) {
              console.warn('[Profile] no posts for user, treating as empty list')
              setPosts([])
            } else {
              throw postsErr
            }
          }
        }
      } catch (err) {
        console.error('[Profile] error:', err?.response?.data || err.message)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className='text-white p-5'>Loading...</div>
  if (error) return <div className='text-red-400 p-5'>{error}</div>
  if (!user) return <div className='text-white p-5'>No user</div>

  return (
    <div className='w-full font-[gilroy] min-h-screen bg-black text-white px-5 py-6'>
      <div className='flex items-center gap-4 mb-6'>
        <img
          src={user.avatar || 'https://i.pravatar.cc/100'}
          alt={user.username || 'User'}
          className='w-20 h-20 rounded-full object-cover'
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = 'https://i.pravatar.cc/100'
          }}
        />
        <div>
          <h1 className='text-2xl font-bold'>{user.username}</h1>
          <p className='text-sm text-gray-400'>Joined {timeAgo(user.createdAt)}</p>
          {user.bio && <p className='text-white'>{user.bio}</p>}
        </div>
        <button
          onClick={() => setEditing(true)}
          className='ml-auto px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700'
        >
          Edit Profile
        </button>
      </div>

      <h2 className='text-xl font-semibold mb-3'>Posts</h2>
      {posts.length === 0 ? (
        <p className='text-white'>No posts yet.</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {posts.map((p) => (
            <a key={p._id} href={`/videopage/${p._id}`} className='block bg-zinc-900 px-3 py-2 text-white rounded-lg overflow-hidden'>
              {p.thumbnailUrl ? (
                <img src={p.thumbnailUrl} alt={p.title} className='w-full h-40 object-cover' />
              ) : (
                <div className='w-full h-40  flex items-center justify-center'>
                  <span className='text-gray-400'>No thumbnail</span>
                </div>
              )}
              <div className='p-3 text-white'>
                <p className='font-semibold truncate'>{p.caption || p.title || 'Untitled'}</p>
                <div className='flex items-center gap-2 mt-1'>
                  <img className='w-6 h-6 rounded-full object-cover' src={user.avatar || 'https://i.pravatar.cc/60'} alt={user.username} />
                  <h1>{user.username}</h1>
                  <span className='text-xs text-gray-400'>{timeAgo(p.createdAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {editing && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
          <div className='bg-zinc-900 text-white rounded-xl w-[90%] max-w-md p-5'>
            <h3 className='text-xl font-semibold mb-4'>Edit Profile</h3>
            <div className='flex flex-col gap-3'>
              <label className='text-sm text-gray-300'>Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                className='px-3 py-2 rounded bg-white text-black outline-0'
                placeholder='Username'
              />
              <label className='text-sm text-gray-300'>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
                className='px-3 py-2 rounded bg-white text-black outline-0'
                placeholder='Bio'
                rows='3'
              />
              <label className='text-sm text-gray-300'>Avatar URL</label>
              <input
                value={form.avatar}
                onChange={(e) => setForm((s) => ({ ...s, avatar: e.target.value }))}
                className='px-3 py-2 rounded bg-white text-black outline-0'
                placeholder='https://...'
              />
            </div>
            <div className='flex justify-end gap-3 mt-5'>
              <button
                onClick={() => setEditing(false)}
                className='px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700'
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSaving(true)
                  try {
                    const payload = {
                      newusername: form.username,
                      newbio: form.bio,
                      newavatar: form.avatar
                    }
                    const res = await axiosAuth.post('/api/user/updateprofile', payload)
                    setUser(res.data.user)
                    setEditing(false)
                  } catch (err) {
                    console.error('[edit profile] error', err?.response?.data || err.message)
                  } finally {
                    setSaving(false)
                  }
                }}
                className='px-3 py-2 rounded bg-[#FF6A00] disabled:opacity-60'
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile


