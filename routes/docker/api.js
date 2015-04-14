module.exports.get = [
  '/images/json',
  '/images/viz',
  '/images/search',
  '/images/get',
  '/images/:id/get',
  '/images/:id/history',
  '/images/:id/json',
  '/exec/:id/json',
];

module.exports.post = [
  '/commit',
  '/images/create',
  '/images/load',
  '/images/:id/push',
  '/images/:id/tag',
  '/containers/:id/attach',
  '/containers/:id/copy',
  '/containers/:id/exec',
  '/exec/:id/start',
  '/exec/:id/resize',
];

module.exports.delete = [
  '/images/:id',
];
