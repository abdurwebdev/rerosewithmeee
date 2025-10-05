const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const compressVideo = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const inputPath = path.join(uploadsDir, `${Date.now()}_${filename}`);
    const outputPath = path.join(uploadsDir, `compressed_${Date.now()}_${filename}`);

    // Write the uploaded video buffer to a temporary file
    fs.writeFileSync(inputPath, buffer);

    ffmpeg(inputPath)
      .outputOptions([
        "-vcodec libx264",     // Video codec
        "-crf 28",             // Quality (lower = better)
        "-preset veryfast",    // Encoding speed
        "-movflags +faststart" // Stream faster online
      ])
      .size("?x720") // downscale if above 720p
      .save(outputPath)
      .on("end", () => {
        console.log("✅ Video compressed:", outputPath);
        fs.unlinkSync(inputPath); // delete original uncompressed video
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Compression failed:", err);
        fs.unlinkSync(inputPath);
        reject(err);
      });
  });
};

module.exports = {compressVideo};
