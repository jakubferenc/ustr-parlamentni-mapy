import apiFactory from './factories';
import projectConfig from './project.config';

const dev = process.env.NODE_ENV !== 'production';
const config = { dev, ...projectConfig };

// data

export default {
  target: 'static', // default is 'server'
  ssr: true,
  components: false,
  server: {
    port: 8000, // default: 3000
    host: 'localhost', // default: localhost
  },
  router: {
    trailingSlash: true,
    middleware: ['custom-router'],
  },
  publicRuntimeConfig: {
    ...config,
  },
  env: {
    baseUrl: process.env.BASE_URL || 'https://localhost:8000',
  },
  sitemap: {
    hostname: !dev ? config.baseURL.production : config.baseURL.development,
    trailingSlash: true,
  },
  render: {
    static: {
      // Add CORS header to static files.
      setHeaders(res) {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept'
        );
      },
    },
  },
  generate: {
    exclude: [
      /^\/poslanec/, // path starts with /poslanec
    ],
    crawler: true,
    async routes() {
      const strankyRes = await apiFactory.getAllStrankyFactory(
        config.wordpressAPIURLWebsite
      );
      const strankyRoutes = strankyRes.map((item) => {
        return {
          route: `/stranka/${item.slug}/`,
          payload: item, // thanks to the payload, we are caching results for the subpage here
        };
      });

      const mediaRes = await apiFactory.getAllMediaFactory(
        config.wordpressAPIURLWebsite,
        config.databazePoslancuURL,
        100
      );
      const mediaRoutes = mediaRes.map((item) => {
        return {
          route: `/media/${item.id}/`,
          payload: item, // thanks to the payload, we are caching results for the subpage here
        };
      });

      const slovnikRes = await apiFactory.getSlovnikovaHeslaFactory(
        config.wordpressAPIURLWebsite
      );
      const slovnikRoutes = slovnikRes.map((item) => {
        return {
          route: `/slovnikove-heslo/${item.slug}/`,
          payload: item, // thanks to the payload, we are caching results for the subpage here
        };
      });

      const snemovniObdobiWordpressArrRes =
        await apiFactory.getAllSnemovniObdobiWordpressFactory(
          config.wordpressAPIURLWebsite
        );

      const snemovniObdobiWordpressArrResDatabaseIds =
        snemovniObdobiWordpressArrRes.map((item) => item.databaze_id);

      const snemovniObdobiObjsRes = await Promise.all(
        snemovniObdobiWordpressArrResDatabaseIds.map(
          async (snemovniObdobiId) => {
            const snemovniObdobiObj =
              await apiFactory.getSnemovniObdobiDetailFactory(
                config.wordpressAPIURLWebsite,
                config.databazePoslancuURL,
                snemovniObdobiId
              );
            return snemovniObdobiObj;
          }
        )
      );

      const snemovniObdobiRoutes = snemovniObdobiObjsRes.map((item) => {
        return {
          route: `/snemovni-obdobi/${item.Id}/`, // :TODO: careful about the "Id" vs "id"
          payload: item, // thanks to the payload, we are caching results for the subpage here
        };
      });

      return [
        ...strankyRoutes,
        ...mediaRoutes,
        ...slovnikRoutes,
        ...snemovniObdobiRoutes,
      ];
    },
    fallback: true,
  },
  build: {
    loaders: {
      sass: { sourceMap: false },
      scss: { sourceMap: false },
      vue: { cacheBusting: false },
    },
  },
  buildModules: [
    [
      '@nuxtjs/style-resources',
      {
        // your settings here
        sass: ['~assets/scss/defs/_all.sass'],
        scss: [],
        hoistUseStatements: true, // Hoists the "@use" imports. Applies only to "sass", "scss" and "less". Default: false.
      },
    ],
    '@nuxtjs/svg',
    [
      '@nuxt/image',
      {
        // The screen sizes predefined by `@nuxt/image`:
        screens: config.responsive.breakpoints,
        domains: [config.wordpressURLWebsite, config.netlifyURL],
      },
    ],
  ],
  modules: [
    [
      '@nuxtjs/proxy',
      {
        '/Api/snemovny/seznam': `${config.databazePoslancuURL}`,
        '/Api/snemovny/': `${config.databazePoslancuURL}`,
        '/Api/osoby': `${config.databazePoslancuURL}`,
        '/Api/soubory': `${config.databazePoslancuURL}`,
        '/wp/v2/slovnik': `${config.wordpressAPIURLWebsite}`,
        '/wp/v2/pages': `${config.wordpressAPIURLWebsite}`,
        '/wp/v2/casova_osa': `${config.wordpressAPIURLWebsite}`,
      },
    ],
    [
      '@nuxtjs/sentry',
      {
        dsn: 'https://9b271b2be5df44b9b13ace36c73dbfbe@o621712.ingest.sentry.io/5752198', // Enter your project's DSN here
        // Additional Module Options go here
        // https://sentry.nuxtjs.org/sentry/options
        config: {
          // Add native Sentry config here
          // https://docs.sentry.io/platforms/javascript/guides/vue/configuration/options/
          environment: process.env.NODE_ENV,
          debug: dev ? true : false,
        },
      },
    ],
    [
      '@nuxtjs/i18n',
      {
        locales: [{ code: 'cs', iso: 'cs-CZ', file: 'cs-CZ.js', dir: 'ltr' }],
        lazy: true,
        langDir: '~lang/',
        defaultLocale: 'cs',
        vueI18n: {
          fallbackLocale: 'cs',
        },
      },
    ],
    [
      '@nuxtjs/axios',
      {
        proxy: true,
      },
    ],
  ],
  css: [
    '~assets/scss/main.sass',
    { src: 'leaflet.markercluster/dist/MarkerCluster.css', lang: 'css' },
    {
      src: 'leaflet.markercluster/dist/MarkerCluster.Default.css',
      lang: 'css',
    },
  ],
  plugins: [{ src: '~plugins/vue-leaflet.js', ssr: false }],
  head: {
    title: config.globalTitle,
    htmlAttrs: {
      lang: 'cs',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'my website description',
      },
    ],
    link: [
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
    ],
    link: [
      {
        rel: 'icon',
        sizes: '32x32',
        type: 'image/x-icon',
        href: '/favicon-32x32.png',
      },
    ],
    link: [{ rel: 'manifest', href: '/site.webmanifest' }],
  },
};
