export const storageService = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Handle storage errors gracefully
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle storage errors gracefully
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Handle storage errors gracefully
    }
  }
};
