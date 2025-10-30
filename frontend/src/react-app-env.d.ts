/// <reference types="react-scripts" />

// Provide typings for CRA-style env vars
declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_GOOGLE_MAPS_API_KEY?: string;
    readonly REACT_APP_API_URL?: string;
  }
}
