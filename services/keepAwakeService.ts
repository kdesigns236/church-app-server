// Simple Wake Lock manager with reference counting
// Uses the Screen Wake Lock API when available. No-op if unsupported.

class KeepAwakeService {
  private lock: any | null = null;
  private refCount = 0;
  private onVisibilityChange = () => {
    // Re-acquire the lock if page becomes visible and we still need it
    if (document.visibilityState === 'visible' && this.refCount > 0) {
      this.request('visibility').catch(() => {});
    }
  };

  async request(_label?: string): Promise<void> {
    try {
      const api = (navigator as any).wakeLock;
      if (typeof api === 'undefined') {
        return; // Do not change refCount if unsupported
      }
      this.refCount++;
      if (this.lock) {
        return;
      }
      this.lock = await api.request('screen');
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    } catch (err) {
      // Ignore if not supported or permission denied
    }
  }

  async release(_label?: string): Promise<void> {
    try {
      this.refCount = Math.max(0, this.refCount - 1);
      if (this.refCount === 0 && this.lock) {
        await this.lock.release().catch(() => {});
        this.lock = null;
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
      }
    } catch {}
  }

  async releaseAll(): Promise<void> {
    try {
      this.refCount = 0;
      if (this.lock) {
        await this.lock.release().catch(() => {});
        this.lock = null;
      }
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    } catch {}
  }
}

export const keepAwakeService = new KeepAwakeService();
