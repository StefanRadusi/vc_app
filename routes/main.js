let express = require('express');
let router = express.Router();
let Db = require('../database/db.js');
let moment = require('moment');

/* GET home page. */
router.get('/', function(req, res) {
  let monkdb = require('monk')('localhost/vc_app');
  let db = new Db(monkdb);

  let year = moment().format('YYYY');
  let month = moment().format('MMMM');
  console.log(year);
  let user_name = req.query && req.query.user;
  console.log(user_name);
  db.get_profile_data(user_name).then(function(data){
    console.log(data);
    let total_days = data && data.profile && data.profile['Total nr of vacation days'];
    return res.render('main', { title: 'Vacation Leave - calendar', year : year, month : month, user_name : user_name, total_days : total_days || 0 });
  });

});

//test
router.post('/update', function(req, res) {
  let monkdb = require('monk')('localhost/vc_app');
  let db = new Db(monkdb);
  
  console.log(req.body);
  db.update_user_year(req.body).then(function(data) {
    console.log(data);
    res.json({response : data});
  }, (err) => console.error(err)).then(() => db.connection.close(), (err) => console.error(err));
  
});

router.get('/check_data', function(req, res) {
  let monkdb = require('monk')('localhost/vc_app');
  let db = new Db(monkdb);
  
  console.log(req.query);
  
  let total_days
  
  db.find_user_year(req.query.user, req.query.year).then(function(data) {
    console.log(data);
    res.json({
      response : (data && data.years[req.query.year]) || {}
    });
  }).then(() => db.connection.close());
  
});

router.get('/profile', function(req, res) {
  let user = req.query && req.query.user;
  console.log(user);
  if (!user) {
    return res.redirect('/');
  }
  
  let monkdb = require('monk')('localhost/vc_app');
  let db = new Db(monkdb);

  db.get_profile_data(user).then(function(data) {
    console.log(data);
    res.render('profile', { title: 'Vacation Leave - profile', profile : data&&data.profile, user_name : data && data.user});
  }, (err) => console.error(err)).then(() => db.connection.close(), (err) => console.error(err));

  
});

router.post('/update_user_data', function(req, res) {
  console.log(req.body);
  let monkdb = require('monk')('localhost/vc_app');
  let db = new Db(monkdb);

  db.update_user_profile(req.body).then(function(data) {
    console.log(data);
    res.json({response : data});
  }, (err) => console.error(err)).then(() => db.connection.close(), (err) => console.error(err));

});

module.exports = router;
