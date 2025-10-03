import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

const CreatePost = () => {
  const [type, setType] = useState('image')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [media, setMedia] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const axiosAuth = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!type) return toast.error('Select a type')
    if (type !== 'text' && !media) return toast.error('Please select a media file')
    if (type === 'video' && !thumbnail) return toast.error('Please add a thumbnail for video')

    const form = new FormData()
    form.append('type', type)
    if (title) form.append('title', title)
    if (caption) form.append('caption', caption)
    if (tags) form.append('tags', tags)
    if (media) form.append('media', media)
    if (thumbnail) form.append('thumbnail', thumbnail)

    setSubmitting(true)
    setProgress(0)
    const toastId = toast.loading('Uploading...')
    try {
      const res = await axiosAuth.post('/api/user/createpost', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const pct = Math.round((evt.loaded * 100) / evt.total)
          setProgress(pct)
        },
      })
      toast.success('Post created!', { id: toastId })
      setTitle('')
      setCaption('')
      setTags('')
      setMedia(null)
      setThumbnail(null)
      setProgress(0)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create post', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='w-full min-h-screen bg-black text-white px-5 py-6'>
      <h1 className='text-2xl font-bold mb-4'>Create Post</h1>
      <form onSubmit={handleSubmit} className='space-y-4 max-w-xl'>
        <div className='flex gap-3'>
          <label className='flex items-center gap-2'>
            <input type='radio' name='type' value='text' checked={type === 'text'} onChange={(e) => setType(e.target.value)} />
            Text
          </label>
          <label className='flex items-center gap-2'>
            <input type='radio' name='type' value='image' checked={type === 'image'} onChange={(e) => setType(e.target.value)} />
            Image
          </label>
          <label className='flex items-center gap-2'>
            <input type='radio' name='type' value='video' checked={type === 'video'} onChange={(e) => setType(e.target.value)} />
            Video
          </label>
        </div>

        <input
          type='text'
          placeholder='Title (optional)'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full p-2 rounded bg-white text-black  placeholder:text-black'
        />
        <textarea
          placeholder='Caption'
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className='w-full p-2 rounded bg-white text-black placeholder:text-black'
        />
        <input
          type='text'
          placeholder='Tags (comma-separated)'
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className='w-full p-2 rounded bg-white text-black  placeholder:text-black'
        />

        {type !== 'text' && (
          <div className='space-y-2'>
            <input type='file' accept={type === 'image' ? 'image/*' : 'video/*'} onChange={(e) => setMedia(e.target.files?.[0] || null)} />
            {type === 'video' && (
              <input type='file' accept='image/*' onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
            )}
          </div>
        )}

        {submitting && (
          <div className='w-full bg-gray-800 rounded overflow-hidden h-3'>
            <div className='bg-blue-500 h-3' style={{ width: `${progress}%` }} />
          </div>
        )}

        <button disabled={submitting} type='submit' className='px-4 py-2 bg-[#FF6A00] rounded disabled:opacity-60'>
          {submitting ? 'Uploading...' : 'Create Post'}
        </button>
      </form>
    </div>
  )
}

export default CreatePost


