export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const resolve = (k: string): string | null => {
  try {
    const w: any = typeof window !== 'undefined' ? window : {};
    const fromWin = w.__APP_RUNTIME_CONFIG__?.[k];
    const fromEnv = (import.meta as any).env?.[k];
    const fromLs = (typeof localStorage !== 'undefined') ? localStorage.getItem(k) : null;
    const v = (fromLs || fromWin || fromEnv) as string | null;
    return v && String(v).trim() ? String(v).trim() : null;
  } catch { return null; }
};

const buildTransformedMp4Url = (secureUrl: string): string => {
  try {
    const idx = secureUrl.indexOf('/upload/');
    if (idx === -1) return secureUrl;
    const prefix = secureUrl.slice(0, idx + 8);
    const suffix = secureUrl.slice(idx + 8);
    const mp4Suffix = suffix.replace(/\.[a-z0-9]+$/i, '.mp4');
    return `${prefix}f_mp4,vc_h264,q_auto:good/${mp4Suffix}`;
  } catch { return secureUrl; }
};

export async function uploadStoryVideoToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  try {
    const cloudName = resolve('VITE_CLOUDINARY_CLOUD_NAME');
    const preset = resolve('VITE_CLOUDINARY_UNSIGNED_VIDEO_PRESET');
    if (!cloudName || !preset) return { success: false, error: 'Cloudinary not configured' };

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', preset);

    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const data: any = await res.json();
    const secureUrl: string = data?.secure_url || data?.url || '';
    if (!secureUrl) return { success: false, error: 'No URL' };

    const mp4Url = buildTransformedMp4Url(secureUrl);
    return { success: true, url: mp4Url };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Upload failed' };
  }
}
