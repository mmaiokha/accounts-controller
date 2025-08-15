export default {
  routes: [
    {
      method: 'GET',
      path: '/fb-accounts/for-activity',
      handler: 'api::fb-account.fb-account.findUserForActivity',
    },
    {
      method: 'POST',
      path: '/fb-accounts/:id/create-vision-profile',
      handler: 'api::fb-account.fb-account.createVisionProfile',
    },
    {
      method: 'POST',
      path: '/fb-accounts/:id/vision-profile-sync',
      handler: 'api::fb-account.fb-account.syncVisionProfile',
    },
    {
      method: 'DELETE',
      path: '/fb-accounts/:id/vision-profile-sync-and-delete',
      handler: 'api::fb-account.fb-account.syncVisionProfileAndDelete',
    },

    {
      method: 'POST',
      path: '/fb-accounts/bulk-import',
      handler: 'api::fb-account.fb-account.bulkImport',
    },
  ],
};
