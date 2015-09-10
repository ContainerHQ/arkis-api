'use strict';

let _ = require('lodash'),
  path = require('path');

module.exports = function({ omit, merge, links, specifics}) {
  return {
    options: {
      instanceMethods: {
        serialize: function({ baseUrl }) {
          let serialized = _.omit(this.toJSON(), omit);

          if (!_.isEmpty(links)) {
            let serializedLinks = {};

            links.forEach(link => {
              serializedLinks[link] = path.join(baseUrl, this.id, link);
            });
            _.merge(serialized, { links: serializedLinks });
          }
          /*
           * Allow some specificities depending of the context of the object
           * to serialize.
           *
           * e.g: { byon: { merge: { agent_cmd: null } } }
           *
           * Will remove agent_cmd if byon is true.
           */
          _.keys(specifics).forEach(attribute => {
            if (this[attribute]) {
              _.keys(specifics[attribute]).forEach(method => {
                serialized = _[method](serialized, specifics[attribute][method]);
              });
            }
          });
          return serialized;
        }
      }
    }
  };
};
