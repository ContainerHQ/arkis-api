'use strict';

let _ = require('lodash'),
  concerns = require('./concerns'),
  config = require('../../config'),
  support = require('../support'),
  Cert = require('../connectors').Cert,
  is = require('./validators');

const CONCERNS = {
  serializable: {
    omit:  ['cert', 'encrypted_cert', 'last_state', 'user_id'],
    links: ['nodes']
  },
  state: {
    attribute: {
      name: 'last_state',
      default: 'empty',
      values: ['empty', 'deploying', 'upgrading', 'updating', 'running']
    },
    expiration: {
      when: 'running',
      mustBe: 'unreachable',
      constraint: {
        name: 'last_seen'
      },
      after: config.agent.heartbeat,
    }
  }
};

module.exports = function(sequelize, DataTypes) {
  let { attributes, options } = concerns.extend({
    attributes: {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV1,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: _.merge({ len: [1, 64] },
          is.subdomainable,
          is.unique({ attribute: 'name', scope: 'user' })
        )
      },
      encrypted_cert: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      strategy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'spread',
        validate: {
          isIn: {
            args: [['spread', 'binpack', 'random']],
            msg: 'Must be spread, binpack or random'
          }
        }
      },
      docker_version: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: config.latestVersions.docker,
      },
      swarm_version: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: config.latestVersions.swarm,
      },
    },
    options: {
      defaultScope: { order: [['id', 'ASC']] },
      scopes: {
        user: function(id) {
          return { where: { user_id: id } };
        },
        filtered: function(filters) {
          let criterias = _.pick(filters, ['name', 'strategy']);

          return { where: criterias };
        }
      },
      getterMethods: {
        state_message: function() {
          let state = this.get('state');

          switch (state) {
            case 'empty':
              return 'Create at least one node to work with this cluster';
            case 'unreachable':
              return 'Master node is unreachable';
            case 'deploying':
              return 'One or more node(s) are beeing deployed';
            case 'upgrading':
              return 'One or more node(s) are beeing upgraded';
            case 'updating':
              return 'One or more node(s) are beeing updated';
            case 'running':
              return 'Cluster is running and reachable';
          }
        },
        cert: function() {
          let encryptedCert = this.get('encrypted_cert'),
            cert = new support.Encryption('aes').decrypt(encryptedCert);

          return JSON.parse(cert);
        }
      },
      hooks: {
        beforeCreate: function(cluster) {
          return Cert.generate().then(cert => {
            return new support.Encryption('aes').encrypt(JSON.stringify(cert));
          }).then(encrypted => {
            cluster.encrypted_cert = encrypted;
          });
        }
      },
      instanceMethods: {
        _lastStateFromNodes: function({ ignore, options }) {
          let criterias = {
            scope: 'nonRunningNorUnreachable',
            where: { id: { $ne: ignore.id } },
            attributes: ['last_state'],
            order: [['updated_at', 'DESC']],
            limit: 1
          };
          return this.getNodes(criterias, options).then(_.first).then(node => {
            return !node ? 'running' : node.last_state;
          });
        },
        adaptStateTo: function({ action, node, options, masterSwitch }) {
          let getLastState;

          switch (action) {
            case 'destroyed':
              if (this.nodes_count <= 1) {
                return this.update(
                  { last_state: 'empty', last_seen: null }, options
                );
              }
              getLastState = this._lastStateFromNodes({
                ignore:  node,
                options: options,
              });
              break;
            case 'notify':
              getLastState = this._lastStateFromNodes({
                ignore:  node,
                options: options,
              });
              break;
            default:
              getLastState = Promise.resolve(node.last_state);
          }
          return getLastState.then(lastState => {
            let changes = { last_state: lastState };

            if (
              (action === 'destroyed' && node.master) ||
              (masterSwitch && !node.master)
            ) {
              changes.last_seen = null;
            }
            if (masterSwitch && node.master) {
              changes.last_seen = node.last_seen;
            }
            return this.update(changes, options);
          });
        }
      },
      classMethods: {
        associate: function(models) {
          this.hasMany(models.Node, { counterCache: { as: 'nodes_count' } });
        }
      }
    }
  }, CONCERNS, { DataTypes: DataTypes });

  return sequelize.define('Cluster', attributes, options);
};
