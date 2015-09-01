'use strict';

let _ = require('lodash'),
  Action = require('../models').Action;

const SCOPES = ['defaultScope', 'date'];

class ActionManager {
  constructor(model) {
    this.model = model;
  }
  add(type) {
    return Action.create(
      _.merge({ type: type }, this._resourceInfos)
    );
  }
  list(opts={}) {
    let scopes = [{ method:['filtered', opts.filters] }];

    scopes = scopes.concat(SCOPES);

    return Action.scope(scopes).findAndCount(
      _.merge(opts, { where: this._resourceInfos, group: ['id'] } )
    );
  }
  getLatest(){
    return Action.findOne({ where: this._resourceInfos, scope: SCOPES });
  }
  getById(id) {
    let opts = _.merge({ id: id }, this._resourceInfos);

    return Action.findOne({ where: opts });
  }
  get _resourceInfos() {
    return {
      resource:    this.model.__options.name.singular,
      resource_id: this.model.id
    };
  }
}

module.exports = ActionManager;
