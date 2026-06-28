/// <reference types="react-scripts" />

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_BASE_URL?: string;
  }
}

export {};
