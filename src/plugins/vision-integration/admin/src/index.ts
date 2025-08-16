import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { Panel } from './components/Panel';
import type { StrapiApp } from '@strapi/admin/strapi-admin';

export default {
  bootstrap(app: StrapiApp) {
    const apis = app.getPlugin('content-manager').apis as any;
    apis.addEditViewSidePanel([Panel]);
  },

  register(app: any) {
    app
      .registerPlugin({
        id: PLUGIN_ID,
        initializer: Initializer,
        isReady: false,
        name: PLUGIN_ID,
      })
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
