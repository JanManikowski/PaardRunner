// ./utils/ImageCacheService.js
import * as FileSystem from 'expo-file-system';

export const cacheImage = async (url, orgId, itemId) => {
  if (!url) return null;

  // Determine the file extension (simple example)
  const extension = url.split('.').pop().split(/\#|\?/)[0];
  const fileName = `${orgId}_${itemId}.${extension}`;
  const localFilePath = `${FileSystem.documentDirectory}${fileName}`;

  // Check if the file already exists
  const fileInfo = await FileSystem.getInfoAsync(localFilePath);
  if (!fileInfo.exists) {
    try {
      // Download the file to the local file path
      const downloadResult = await FileSystem.downloadAsync(url, localFilePath);
      if (downloadResult.status === 200) {
        console.log("Image downloaded to", downloadResult.uri);
      } else {
        console.error("Download failed with status:", downloadResult.status);
      }
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }
  // Return the local URI for use in your Image component
  return localFilePath;
};
