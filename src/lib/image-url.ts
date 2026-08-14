/**
 * Normalizes image URLs so that any Google Drive image URL (lh5, thumbnail, uc, file/d, or query-based proxy)
 * is served through the path-based /api/drive-image/[id] route without Next.js localPatterns query string errors.
 */
export function getOptimizedImageUrl(url: string): string {
  if (!url) return "";

  // Convert old query-based proxy `/api/drive-image?id=FILE_ID` to path-based `/api/drive-image/FILE_ID`
  const queryProxyMatch = url.match(/\/api\/drive-image\?id=([a-zA-Z0-9_-]+)/);
  if (queryProxyMatch && queryProxyMatch[1]) {
    return `/api/drive-image/${queryProxyMatch[1]}`;
  }

  // Already using path-based `/api/drive-image/FILE_ID`
  if (url.startsWith("/api/drive-image/")) {
    return url;
  }

  // Match: https://lh3.googleusercontent.com/d/FILE_ID or lh5...
  const lhMatch = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lhMatch && lhMatch[1]) {
    return `/api/drive-image/${lhMatch[1]}`;
  }

  // Match: https://drive.google.com/thumbnail?id=FILE_ID or /uc?id=FILE_ID
  const driveParamMatch = url.match(/drive\.google\.com\/(?:thumbnail|uc|open)\?.*id=([a-zA-Z0-9_-]+)/);
  if (driveParamMatch && driveParamMatch[1]) {
    return `/api/drive-image/${driveParamMatch[1]}`;
  }

  // Match: https://drive.google.com/file/d/FILE_ID
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `/api/drive-image/${driveFileMatch[1]}`;
  }

  return url;
}
