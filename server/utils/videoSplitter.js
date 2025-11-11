// Video Splitter Utility
// Splits long videos into 10-minute segments for easier upload and streaming

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Get video duration using FFprobe
 * @param {string} videoPath - Path to video file
 * @returns {Promise<number>} Duration in seconds
 */
async function getVideoDuration(videoPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('[VideoSplitter] Error getting duration:', error);
    throw new Error('Failed to get video duration');
  }
}

/**
 * Split video into segments
 * @param {string} inputPath - Path to input video
 * @param {number} segmentDuration - Duration of each segment in seconds (default: 600 = 10 minutes)
 * @returns {Promise<string[]>} Array of output file paths
 */
async function splitVideo(inputPath, segmentDuration = 600) {
  try {
    console.log('[VideoSplitter] Starting video split:', inputPath);
    
    // Get video duration
    const duration = await getVideoDuration(inputPath);
    console.log(`[VideoSplitter] Video duration: ${duration} seconds (${(duration / 60).toFixed(1)} minutes)`);
    
    // If video is shorter than segment duration, no need to split
    if (duration <= segmentDuration) {
      console.log('[VideoSplitter] Video is short enough, no splitting needed');
      return [inputPath];
    }
    
    // Calculate number of segments
    const numSegments = Math.ceil(duration / segmentDuration);
    console.log(`[VideoSplitter] Will create ${numSegments} segments`);
    
    // Create output directory
    const outputDir = path.join(path.dirname(inputPath), 'segments');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFiles = [];
    const baseName = path.basename(inputPath, path.extname(inputPath));
    
    // Split video into segments
    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration;
      const outputPath = path.join(outputDir, `${baseName}_part${i + 1}.mp4`);
      
      console.log(`[VideoSplitter] Creating segment ${i + 1}/${numSegments}...`);
      
      // Use FFmpeg to extract segment
      // -ss: start time, -t: duration, -c copy: copy codec (fast, no re-encoding)
      const command = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${segmentDuration} -c copy -avoid_negative_ts 1 "${outputPath}"`;
      
      try {
        await execAsync(command);
        outputFiles.push(outputPath);
        console.log(`[VideoSplitter] ✅ Segment ${i + 1} created: ${outputPath}`);
      } catch (error) {
        console.error(`[VideoSplitter] ❌ Failed to create segment ${i + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`[VideoSplitter] ✅ Successfully split video into ${outputFiles.length} segments`);
    return outputFiles;
    
  } catch (error) {
    console.error('[VideoSplitter] Error splitting video:', error);
    throw error;
  }
}

/**
 * Clean up temporary segment files
 * @param {string[]} filePaths - Array of file paths to delete
 */
function cleanupSegments(filePaths) {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[VideoSplitter] Cleaned up: ${filePath}`);
      }
    } catch (error) {
      console.error(`[VideoSplitter] Failed to cleanup ${filePath}:`, error);
    }
  });
}

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
  getVideoDuration,
  splitVideo,
  cleanupSegments,
  formatDuration
};
