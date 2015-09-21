let _ = require('lodash'),
  express = require('express');

const PROFILE_PARAMS = ['fullname', 'location', 'company'];

let router = express.Router();

router
.route('/')
.get((req, res, next) => {
  req.user.getProfile().then(profile => {
    res.serialize({ profile: profile });
  }).catch(next);
})
.patch((req, res, next) => {
  req.user.getProfile().then(profile => {
    return profile.update(_.pick(req.body, PROFILE_PARAMS));
  }).then(profile => {
    res.serialize({ profile: profile });
  }).catch(next);
});

module.exports = router;
