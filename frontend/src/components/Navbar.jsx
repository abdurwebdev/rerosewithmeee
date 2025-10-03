import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const axiosAuth = useMemo(() => axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true }), [])

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      const q = query.trim()
      if (!q) {
        setResults([])
        return
      }
      try {
        const res = await axiosAuth.get(`/api/user/search`, { params: { q }, signal: controller.signal })
        setResults(res.data.users || [])
        setOpen(true)
      } catch (err) {
        if (axios.isCancel(err)) return
        console.error('[search] error', err?.response?.data || err.message)
      }
    }
    const id = setTimeout(run, 300)
    return () => {
      clearTimeout(id)
      controller.abort()
    }
  }, [query, axiosAuth])

  return (
    <div className='w-full bg-black text-white  font-[gilroy]  flex px-5 py-6 items-center  justify-between'>
      <Link to='/home'>Rerose</Link>
      <div className='relative' ref={containerRef}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          type="text"
          placeholder='Search users...'
          className='px-3 py-1 rounded-3xl w-80 sm:w-96 border border-black bg-white text-black outline-0'
        />
        {open && results.length > 0 && (
          <div className='absolute mt-2 w-full bg-white text-black rounded-xl shadow-lg z-50 max-h-80 overflow-auto'>
            {results.map((u) => (
              <div key={u._id} className='px-3 py-2 flex items-center gap-2 border-b border-zinc-100 last:border-0'>
                <img src={u.avatar || 'https://i.pravatar.cc/40'} alt={u.username} className='w-7 h-7 rounded-full object-cover' />
                <div className='flex flex-col'>
                  <span className='font-semibold'>{u.username}</span>
                  <span className='text-xs text-gray-500'>{u.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className='flex items-center gap-4'>
        <Link to='/createpost' className='px-3 py-1 rounded bg-[#FF6A00]'>Create Post</Link>
        <Link to='/profile'>Profile</Link>
      </div>
    </div>
  )
}

export default Navbar