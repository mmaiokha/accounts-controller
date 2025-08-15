export default {
  routes: [
    {
      method: 'POST',
      path: '/purchased-accounts/bulk-import',
      handler: 'api::purchased-account.purchased-account.bulkImport',
    }
  ]
}