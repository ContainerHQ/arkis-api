/* Must be swapped between environment dev / staging / production */

/* rename dockerFactory ? */

function rand() {
  return Math.random().toString(36).substr(2);
}

let machine = module.exports = {};

/* this must be moved in support as fakeMachine */
machine.createToken = function() {
  return new Promise(resolve => {
    resolve(rand() + rand());
  });
};
