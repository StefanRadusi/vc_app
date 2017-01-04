let express = require('express');
let router = express.Router();
let Db = require('../database/db.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('main', { title: 'Vacation Leave' });
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
  
  db.find_user_year(req.query.user, req.query.year).then(function(data) {
    console.log(data);
    res.json({response : data.years[req.query.year]});
  }).then(() => db.connection.close());
  
});

module.exports = router;
