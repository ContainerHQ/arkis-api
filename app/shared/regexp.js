/*
 *  Returns a route formated with a RegExp to be able
 *  to resolve paths like:
 *
 *    /images/foliea/ubuntu/json
 *    /images/ubuntu/json
 *    /images/
 *
 *  with routes parameters like:
 *
 *    /images/:name/json
 *
 *  Allowing the targeted identifier to be either:
 *
 *    foliea/ubuntu
 *    ubuntu
 *    fhiu89hui
 *    grounds.io/foliea/ubuntu
 *
 */
module.exports.imageName = function(route='') {
  return `/:name(([^\\\\]+\/?)+)${route}`;
};
