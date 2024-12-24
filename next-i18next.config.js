//next-i18next.config.js
// @ts-check

/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  // https://www.i18next.com/overview/configuration-options#logging
  //debug: process.env.NODE_ENV === 'development',
  i18n: {
    defaultLocale: 'cn',
    locales: ['cn', 'en'],
    localeDetection: true,
  },
  /** To avoid issues when deploying to some paas (vercel...) */
  localePath:
    typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',
  //reloadOnPrerender: process.env.NODE_ENV === 'development',
  serializeConfig: false,

  /**
   * @link https://github.com/i18next/next-i18next#6-advanced-configuration
   */
  // saveMissing: false,
  // strictMode: true,
  // serializeConfig: false,
  // react: { useSuspense: false }
}
