/**
 * fb-account controller
 */

import { factories } from '@strapi/strapi';
import fs from 'fs/promises';

export default factories.createCoreController(
  'api::fb-account.fb-account',
  ({ strapi }) => ({
    async findUserForActivity(ctx) {
      const randomAccount = await strapi
        .service('api::fb-account.fb-account')
        .findUserForActivity();

        if (!randomAccount) {
          return ctx.notFound('No active Facebook accounts found for activity.');
        }

      return randomAccount;
    },

    async createVisionProfile(ctx) {
      const { id } = ctx.params;

      if (!id) {
        return ctx.badRequest('Account ID is required.');
      }

      const profile = await strapi
        .service('api::fb-account.fb-account')
        .createVisionProfile(id);

      if (!profile) {
        return ctx.internalServerError('Failed to create vision profile.');
      }

      return profile;
    },

    async syncVisionProfile(ctx)  {
      const { id } = ctx.params;

      if (!id) {
        return ctx.badRequest('Account ID is required.');
      }

      const profile = await strapi
        .service('api::fb-account.fb-account')
        .syncVisionProfile(id);

      if (!profile) {
        return ctx.internalServerError('Failed to sync vision profile.');
      }

      return profile;
    },

    async syncVisionProfileAndDelete(ctx)  {
      const { id } = ctx.params;

      if (!id) {
        return ctx.badRequest('Account ID is required.');
      }

      const result = await strapi
        .service('api::fb-account.fb-account')
        .syncVisionProfileAndDelete(id);

      if (!result) {
        return ctx.internalServerError('Failed to sync and delete vision profile.');
      }

      return result;
    },

    async bulkImport(ctx) {
        try {
          const { separator, fieldsMapping } = ctx.request.body;
          const file = ctx.request.files?.file as any;
          
          console.log(fieldsMapping)
    
          if (!file) {
            return ctx.badRequest('No file uploaded');
          }
    
          if (!separator) {
            return ctx.badRequest('Separator is required');
          }
    
          if (!fieldsMapping) {
            return ctx.badRequest('Field mapping is required');
          }
    
          // Parse fieldsMapping if it's a string
          let parsedFieldsMapping;
          try {
            parsedFieldsMapping = typeof fieldsMapping === 'string' 
              ? JSON.parse(fieldsMapping) 
              : fieldsMapping;
          } catch (error) {
            return ctx.badRequest('Invalid field mapping format');
          }
    
          const filePath = file.filepath;
          const fileContent = await fs.readFile(filePath, 'utf-8');
    
          const result = await strapi.service('api::fb-account.fb-account').bulkImport({
            fileContent,
            fieldsMapping: parsedFieldsMapping,
            separator,
          });
    
          if (result.success) {
            ctx.send(result);
          } else {
            ctx.badRequest(result.message, result);
          }
    
        } catch (error) {
          strapi.log.error('Error in bulkImport controller:', error);
          ctx.internalServerError('An error occurred during import');
        }
      },
  })
);
