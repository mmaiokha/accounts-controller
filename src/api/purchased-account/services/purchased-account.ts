/**
 * purchased-account service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::purchased-account.purchased-account', ({ strapi }) => ({
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
        if (!account) continue;

        console.log(`[${i + 1}/${accounts.length}] Importing: ${account.email || account.login}`);

        try {
          await strapi.entityService.create('api::purchased-account.purchased-account', {
            data: account,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to import account ${account.email || account.login}:`, error);
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
      geolocation: 'UA' as const,
      uploadedAt: new Date().toISOString(),
      gender: null,
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
