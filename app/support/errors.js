'use strict';

let sequelize = require('sequelize');

let error = module.exports = {};

const MISMATCH_TYPE = 'mismatchViolation';

error.MismatchError = class extends sequelize.ValidationError {
  constructor(key, value=null) {
    super();

    let message = `${key} doesn't match`;

    this.message = `${MISMATCH_TYPE}: ${message}.`;
    this.errors = [{
      message: message,
      type: MISMATCH_TYPE,
      path: key,
      value: value
    }];
  }
};

error.PaginationError = class extends Error {
  constructor({ attribute, value, range }) {
    super();

    let messageEnd = !!range.end ? ` and < ${range.end}.` : '.';

    this.name = 'PaginationError';
    this.message = `Invalid ${attribute} '${value}' provided`;
    this.message = `${this.message}: must be > ${range.start}${messageEnd}`;
  }
};

error.StateError = class extends Error {
  constructor(action, state) {
    super();

    this.name = 'StateError';
    this.message = `Can't perform ${action} in ${state} state.`;
  }
};

error.AlreadyUpgradedError = class extends Error {
  constructor() {
    super();

    this.name = 'AlreadyUpgradedError';
    this.message = `The resource already has the latest available versions.`;
  }
};

error.NotMasterError = class extends Error {
  constructor() {
    super();

    this.name = 'NotMasterError';
    this.message = 'Action not allowed for slave nodes.';
  }
};

error.DeletionError = class extends Error {
  constructor(errors) {
    super();

    this.name = 'DeletionError';
    this.message = "Deleting this resource conflicts with other resources.";
    this.errors = errors;
  }
};

error.MachineCredentialsError = class extends Error {
  constructor() {
    super();

    this.name = 'MachineCredentialsError';
    this.message = 'Invalid machine credentials.';
  }
};

error.MachineNotFoundError = class extends Error {
  constructor() {
    super();

    this.name = 'MachineNotFoundError';
    this.message = 'Machine not found.';
  }
};

error.MachineUnprocessableError = class extends Error {
  constructor(message) {
    super();

    this.name = 'MachineUnprocessableError';
    this.message = message;
  }
};

error.AgentUnreachableError = class extends Error {
  constructor() {
    super();

    this.name = 'AgentUnreachableError';
    this.message = "Node agent doesn't respond.";
  }
};

error.AgentLockedError = class extends Error {
  constructor() {
    super();

    this.name = 'AgentLockedError';
    this.message = 'Node agent is currently locked. Please try again later.';
  }
};
