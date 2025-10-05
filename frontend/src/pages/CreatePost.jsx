import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

// Lazy FFmpeg setup (fixes Vite ESM import issue)
let ffmpegInstance = null;
let fetchFile = null;
let createFFmpeg = null;

const CreatePost = () => {
  const [type, setType] = useState("image");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sizeInfo, setSizeInfo] = useState(null);

  const axiosAuth = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  });

  // ✅ Compress video before upload
  const compressVideo = async (file) => {
    if (!file || !file.type.startsWith("video/")) return { compressedFile: file };

    try {
      // Dynamic import to avoid Vite ESM error
      if (!createFFmpeg) {
        const ffmpegModule = await import("@ffmpeg/ffmpeg");
        createFFmpeg = ffmpegModule.createFFmpeg;
        fetchFile = ffmpegModule.fetchFile;
      }

      if (!ffmpegInstance) {
        ffmpegInstance = createFFmpeg({
          log: true,
          corePath: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js",
        });
      }

      if (!ffmpegInstance.isLoaded()) await ffmpegInstance.load();

      const inputName = "input.mp4";
      const outputName = "output.mp4";
      ffmpegInstance.FS("writeFile", inputName, await fetchFile(file));

      // Compress the video
      await ffmpegInstance.run(
        "-i",
        inputName,
        "-vcodec",
        "libx264",
        "-crf",
        "28",
        "-preset",
        "veryfast",
        outputName
      );

      const data = ffmpegInstance.FS("readFile", outputName);
      const compressedFile = new File([data.buffer], file.name, {
        type: "video/mp4",
      });

      const before = (file.size / 1024 / 1024).toFixed(2);
      const after = (compressedFile.size / 1024 / 1024).toFixed(2);
      setSizeInfo({ before, after });

      return { compressedFile };
    } catch (err) {
      console.error("Compression failed:", err);
      return { compressedFile: file };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type) return toast.error("Select a type");
    if (type !== "text" && !media) return toast.error("Please select a media file");
    if (type === "video" && !thumbnail)
      return toast.error("Please add a thumbnail for video");

    setSubmitting(true);
    setProgress(0);
    setSizeInfo(null);
    const toastId = toast.loading("Uploading...");

    try {
      let uploadFile = media;
      if (type === "video") {
        const { compressedFile } = await compressVideo(media);
        uploadFile = compressedFile;
      }

      const form = new FormData();
      form.append("type", type);
      if (title) form.append("title", title);
      if (caption) form.append("caption", caption);
      if (tags) form.append("tags", tags);
      if (uploadFile) form.append("media", uploadFile);
      if (thumbnail) form.append("thumbnail", thumbnail);

      const res = await axiosAuth.post("/api/user/createpost", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setProgress(pct);
        },
      });

      toast.success("Post created!", { id: toastId });
      setTitle("");
      setCaption("");
      setTags("");
      setMedia(null);
      setThumbnail(null);
      setProgress(0);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to create post", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-5 py-6">
      <h1 className="text-2xl font-bold mb-4">Create Post with compression</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {/* Post Type */}
        <div className="flex gap-3">
          {["text", "image", "video"].map((t) => (
            <label key={t} className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={(e) => setType(e.target.value)}
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>

        {/* Text Inputs */}
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-white text-black placeholder:text-black"
        />
        <textarea
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 rounded bg-white text-black placeholder:text-black"
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full p-2 rounded bg-white text-black placeholder:text-black"
        />

        {/* Media Upload */}
        {type !== "text" && (
          <div className="space-y-2">
            <input
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              onChange={(e) => setMedia(e.target.files?.[0] || null)}
            />
            {type === "video" && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              />
            )}
          </div>
        )}

        {/* Compression Info */}
        {sizeInfo && (
          <div className="text-sm text-gray-300">
            <p>Original size: {sizeInfo.before} MB</p>
            <p>Compressed size: {sizeInfo.after} MB</p>
          </div>
        )}

        {/* Upload Progress */}
        {submitting && (
          <div className="w-full bg-gray-800 rounded overflow-hidden h-3">
            <div
              className="bg-blue-500 h-3"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          disabled={submitting}
          type="submit"
          className="px-4 py-2 bg-[#FF6A00] rounded disabled:opacity-60"
        >
          {submitting ? "Uploading..." : "Create Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
