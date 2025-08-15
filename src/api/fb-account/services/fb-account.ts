/**
 * fb-account service
 */

import { factories } from '@strapi/strapi';
import { faker, vi } from '@faker-js/faker';
import axios from 'axios';

const folderId = '9948309f-9b50-4a1b-9345-c1102562d53b';

export default factories.createCoreService('api::fb-account.fb-account', ({ strapi }) => ({
  async findUserForActivity() {
    // Get all active Facebook accounts that have not been active for more than 24 hours
    const data = await strapi.db.query('api::fb-account.fb-account').findMany({
      where: {
        accountStatus: 'active',
        lastActivityAt: {
          $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // More than 24 hours ago
        },
      },
    });

    if (data.length === 0) {
      return null;
    }

    return faker.helpers.arrayElement(data);
  },

  getChromeVersion(userAgent?: string) {
    const match = userAgent?.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : faker.number.int({ min: 120, max: 138 });
  },

  async createVisionProfile(id) {
    // Create a vision profile for the Facebook account with the given ID
    const keys = await strapi.db.query(`api::api-key.api-key`).findOne();
    const visionHeaders = { 'x-token': keys.visionKey || '' };
    const fbAccount = await strapi.db.query('api::fb-account.fb-account').findOne({
      where: { documentId: id },
    });

    const dataToUpdate: any = {};

    if (fbAccount.visionProfileId) {
      return { visionProfile: fbAccount.visionProfileId };
    }

    let fingerprint = fbAccount.visionFingerprint;
    if (!fingerprint) {
      // const fingerprint = fbAccount.useragent?.

      fingerprint = await axios
        .get<{ data: { fingerprint: any } }>(
          `https://v1.empr.cloud/api/v1/fingerprints/windows/${this.getChromeVersion(fbAccount.useragent)}`,
          {
            headers: { 'x-token': keys.visionKey || '' },
          },
        )
        .then((response) => response.data.data.fingerprint);

      const kyivGeoLocations = [
        { latitude: 50.4491, longitude: 30.5234 }, // Центр (Площадь Льва Толстого)
        { latitude: 50.4567, longitude: 30.515 }, // Шевченковский (КПИ)
        { latitude: 50.4653, longitude: 30.501 }, // Соломенка (Железнодорожный вокзал)
        { latitude: 50.4755, longitude: 30.5542 }, // Дарница (Левобережная)
        { latitude: 50.4179, longitude: 30.5371 }, // Печерск (м. Дружбы Народов)
        { latitude: 50.4322, longitude: 30.6231 }, // Позняки
        { latitude: 50.4549, longitude: 30.6043 }, // Березняки
        { latitude: 50.4967, longitude: 30.6021 }, // Троещина
        { latitude: 50.5141, longitude: 30.4669 }, // Оболонь
        { latitude: 50.4975, longitude: 30.4794 }, // Минский массив
        { latitude: 50.3914, longitude: 30.4907 }, // Теремки
        { latitude: 50.3702, longitude: 30.5191 }, // Голосеево
        { latitude: 50.4385, longitude: 30.3931 }, // Борщаговка
        { latitude: 50.4672, longitude: 30.3753 }, // Академгородок
        { latitude: 50.4011, longitude: 30.6334 }, // Осокорки
        { latitude: 50.507, longitude: 30.5745 }, // Воскресенка
        { latitude: 50.4503, longitude: 30.5229 }, // Майдан Незалежности
        { latitude: 50.4264, longitude: 30.5312 }, // Олимпийская
        { latitude: 50.4439, longitude: 30.5206 }, // Золотые ворота
        { latitude: 50.4205, longitude: 30.5078 }, // Лыбидская
      ];

      fingerprint.navigator.timezone = 'Europe/Kyiv';
      fingerprint.navigator.languages = []; // TODO: make it random
      fingerprint.navigator.language = 'auto'; // TODO: make it random
      fingerprint.webrtc_pref = 'auto';
      fingerprint.canvas_pref = 'real';
      fingerprint.webgl_pref = 'real';
      fingerprint.ports_protection = [];
      fingerprint.geolocation = {
        ...faker.helpers.arrayElement(kyivGeoLocations),
        accuracy: Math.floor(Math.random() * 30) + 30, // от 30 до 60
      };

      dataToUpdate.visionFingerprint = fingerprint;
    }

    const data = {
      profile_name: `cms-created-${fbAccount.login}`,
      profile_notes: `Created via API`,
      profile_tags: [],
      new_profile_tags: [],
      profile_status: null,
      proxy_id: '321f36e7-2a6d-4142-a559-3e32f282eafd',
      platform: `Windows`,
      browser: `Chrome`,
      fingerprint,
    };

    console.log('Creating vision profile with data:', JSON.stringify(data, null, 2));
    const profile = await axios
      .post<any>(`https://v1.empr.cloud/api/v1/folders/${folderId}/profiles`, data, {
        headers: visionHeaders,
      })
      .then((res) => res.data.data)
      .catch((error) => {
        console.error('Failed to create vision profile:', error);
        throw new Error('Failed to create vision profile');
      });
    dataToUpdate.visionProfileId = profile.id;

    console.log(`Created vision profile: ${profile.id}`);
    await axios
      .post(
        `https://v1.empr.cloud/api/v1/cookies/import/${folderId}/${profile.id}`,
        { cookies: fbAccount.cookie || [] },
        { headers: visionHeaders },
      )
      .catch((error) => {
        console.log('Failed to import cookies to vision profile:', error);
      });

    console.log(`Imported cookies to vision profile: ${profile.id}`);
    await this.update(id, {
      data: dataToUpdate,
    });

    console.log(`Updated Facebook account ${id} with vision profile ID: ${profile.id}`);
    return {
      visionProfile: profile,
    };
  },

  async syncVisionProfile(id) {
    const keys = await strapi.db.query(`api::api-key.api-key`).findOne();
    const visionHeaders = { 'x-token': keys.visionKey || '' };
    const fbAccount = await strapi.db.query('api::fb-account.fb-account').findOne({
      where: { documentId: id },
    });

    if (!fbAccount.visionProfileId) {
      return null;
    }

    console.log(`Syncing vision profile for account ID: ${id}`);
    const profile = await axios
      .get<any>(`https://v1.empr.cloud/api/v1/folders/${folderId}/profiles/${fbAccount.visionProfileId}`, {
        headers: visionHeaders,
      })
      .then((res) => res.data.data)
      .catch((error) => {
        console.error('Failed to sync vision profile:', error);
        throw new Error('Failed to sync vision profile');
      });

    console.log(`Fetched vision profile: ${profile.id}`);
    const cookies = await axios
      .get<{
        data: any[];
      }>(`https://v1.empr.cloud/api/v1/cookies/${folderId}/${profile.id}`, {
        headers: visionHeaders,
      })
      .then((response) => response.data);

    console.log(`Fetched cookies for vision profile: ${profile.id}`, cookies.data);

    await this.update(id, {
      data: {
        cookie: cookies.data,
      },
    });

    return profile;
  },

  async syncVisionProfileAndDelete(id) {
    const keys = await strapi.db.query(`api::api-key.api-key`).findOne();

    await this.syncVisionProfile(id);
    const fbAccount = await strapi.db.query('api::fb-account.fb-account').findOne({
      where: { documentId: id },
    });
    if (!fbAccount.visionProfileId) {
      return null;
    }
    console.log(`Deleting vision profile for account ID: ${id}`);
    await axios.delete(`https://v1.empr.cloud/api/v1/folders/${folderId}/profiles/${fbAccount.visionProfileId}`, {
      headers: { 'x-token': keys.visionKey || '' },
    });
    console.log(`Deleted vision profile for account ID: ${id}`);
    await this.update(id, {
      data: {
        visionProfileId: null,
      },
    });
  },

  async bulkImport({ fileContent, fieldsMapping, separator }) {
    try {
      const lines = fileContent.split('\n').filter((line: string) => line.trim());

      const accounts = lines
        .map((line: string) => this.parseAccountLine(line, separator, fieldsMapping))
        .filter((account: any) => account !== null);

      if (accounts.length === 0) {
        return {
          success: false,
          message: 'No valid accounts found to import',
          imported: 0,
          failed: 0,
        };
      }

      // Import accounts
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        if (!account) {
          failCount++;
          continue;
        }

        const existingAccount = await strapi.db.query('api::fb-account.fb-account').findOne({
          where: { login: account.login },
        });
        if (existingAccount) {
          failCount++;
          continue;
        }

        try {
          await this.create({
            data: account,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to import account ${account.email || account.login}:`, JSON.stringify(error));
          failCount++;
        }
      }

      return {
        success: true,
        message: `Import completed: ${successCount} successful, ${failCount} failed`,
        imported: successCount,
        failed: failCount,
      };
    } catch (error) {
      strapi.log.error('Error during bulk import:', error);
      return {
        success: false,
        message: error.message || 'Failed to process the file content',
        imported: 0,
        failed: 0,
      };
    }
  },

  parseAccountLine(
    line: string,
    separator: string,
    fieldsMapping: Array<{ fieldName: string; position: number; transform?: (value: string) => any }>,
  ) {
    const defaults = {
      geo: 'UA',
      gender: 'unknown',
      accountStatus: 'purchased',
    };
    if (!line.trim()) return null;

    const fields = line.split(separator);
    const account = {
      login: '',
      plainPassword: '',
    };

    // Apply field mappings
    fieldsMapping.forEach((mapping) => {
      const value = fields[mapping.position];
      if (value && value.trim()) {
        if (mapping.fieldName === 'cookie') {
          try {
            account[mapping.fieldName] = JSON.parse(value);
            console.log('Parsed cookie successfully');
          } catch (error) {
            console.warn('Failed to parse cookie JSON:', error);
            account[mapping.fieldName] = null;
          }
        } else {
          (account as any)[mapping.fieldName] = value.trim();
        }
      }
    });

    // Apply defaults
    Object.assign(account, defaults);

    // Validate required fields
    if (!account.login || !account.plainPassword) {
      console.warn('Skipping account with missing required fields:', {
        login: account.login,
        plainPassword: !!account.plainPassword,
      });
      return null;
    }

    return account;
  },
}));
