/// <reference path="../.astro/types.d.ts" />
declare global {
  interface Window {
    __turnstileScriptLoaded?: boolean;
  }
}

export {};
