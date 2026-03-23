/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
    };
  }
}

export {};
