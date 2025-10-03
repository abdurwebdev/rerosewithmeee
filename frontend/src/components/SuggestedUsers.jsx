import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const SuggestedUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const axiosAuth = useMemo(() => axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true }), [])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axiosAuth.get('/api/user/suggested')
        setUsers(res.data.users || [])
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load suggestions')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [axiosAuth])

  const follow = async (userId) => {
    try {
      await axiosAuth.post('/api/user/followuser', { followUserId: userId })
      setUsers((prev) => prev.filter((u) => u._id !== userId))
    } catch (err) {
      console.error('[follow] error', err?.response?.data || err.message)
    }
  }

  if (loading) return null
  if (error) return null
  if (!users.length) return null

  return (
    <div className='pt-6 px-5 bg-black'>
      <h3 className='text-white text-lg font-semibold mb-3'>Suggested for you</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {users.map((u) => (
          <div key={u._id} className='bg-zinc-900 rounded-xl p-3 flex items-center gap-3'>
            <img src={u.avatar || 'https://i.pravatar.cc/60'} alt={u.username} className='w-10 h-10 rounded-full object-cover' />
            <div className='flex-1'>
              <p className='text-white font-semibold'>{u.username}</p>
              <p className='text-xs text-gray-400'>{u.email}</p>
            </div>
            <button onClick={() => follow(u._id)} className='px-3 py-1 rounded bg-[#FF6A00] text-white'>Follow</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SuggestedUsers


