/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // App Shell — CacheFirst
    {
      urlPattern: ({ url }: { url: URL }) =>
        url.pathname === "/" || url.pathname === "/timeline",
      handler: "CacheFirst",
      options: {
        cacheName: "app-shell",
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // Diary entries API — NetworkFirst
    {
      urlPattern: /\/api\/entries.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "diary-api",
        expiration: { maxAgeSeconds: 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
    // Images (R2) — CacheFirst
    {
      urlPattern: /\/api\/image.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Static assets — StaleWhileRevalidate
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Other API — NetworkOnly
    {
      urlPattern: /\/api\/.*/,
      handler: "NetworkOnly",
    },
    // Fonts — CacheFirst
    {
      urlPattern: /\.(?:woff2?|ttf|otf)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
