// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  css: [
    '~/assets/styles/main.css',
  ],

  runtimeConfig: {
    public: {
      partyurl: process.env.NUXT_PUBLIC_PARTYURL || '',
    },
  },
  
  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorMode',
    classSuffix: '',
    classPrefix: '',
    storage: 'localStorage',
    storageKey: 'nuxt-color-mode',
  },
})