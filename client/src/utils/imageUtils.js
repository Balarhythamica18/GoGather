import { API_BASE_URL } from "../config";

/**
 * Resolves an image URL from the backend.
 * Handles legacy hardcoded localhost URLs and new relative paths.
 * 
 * @param {string} path - The image path from the database
 * @returns {string} - The full resolved URL
 */
export const getImageUrl = (path) => {
    if (!path) return "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800"; // Fallback placeholder

    // If it's already a full external URL (like Unsplash or Cloudinary), return as is
    if (path.startsWith("http") && !path.includes("localhost")) {
        return path;
    }

    // Handle legacy hardcoded localhost URLs or relative paths
    let relativePath = path;

    if (path.includes("localhost:5000")) {
        // Extract only the /uploads/... part
        relativePath = path.split("localhost:5000")[1];
    }

    // Handle backslashes (common on Windows)
    relativePath = relativePath.replace(/\\/g, "/");

    // Ensure it starts with /
    if (!relativePath.startsWith("/") && !relativePath.startsWith("http")) {
        relativePath = "/" + relativePath;
    }

    // Prefix with API_BASE_URL if it's a relative path
    const fullUrl = relativePath.startsWith("http") ? relativePath : `${API_BASE_URL}${relativePath}`;

    // Debug log in development to trace image resolution issues
    if (window.location.hostname === "localhost") {
        console.log(`[ImageUtils] Path: "${path}" -> Resolved: "${fullUrl}"`);
    }

    return fullUrl;
};
