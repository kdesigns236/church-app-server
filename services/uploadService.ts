// File upload service for handling media uploads to the server

interface UploadResponse {
  success: boolean;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

class UploadService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  // Upload a file to the server
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken') || 'admin-token';

      const response = await fetch(`${this.apiUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: UploadResponse = await response.json();
      console.log('[Upload] File uploaded successfully:', data.filename);
      
      return data.url;
    } catch (error) {
      console.error('[Upload] Error uploading file:', error);
      throw error;
    }
  }

  // Delete a file from the server
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('authToken') || 'admin-token';

      const response = await fetch(`${this.apiUrl}/upload/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      console.log('[Upload] File deleted successfully:', filename);
      return true;
    } catch (error) {
      console.error('[Upload] Error deleting file:', error);
      return false;
    }
  }

  // Extract filename from URL
  getFilenameFromUrl(url: string): string {
    return url.split('/').pop() || '';
  }
}

// Create singleton instance
const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
export const uploadService = new UploadService(apiUrl);
