const UserModel = require('../models/UserModel.js');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

/**
 * UserController.js
 *
 * @description :: Server-side logic for managing Users.
 */
module.exports = {

    /**
     * UserController.list()
     */
    list: function (req, res) {
        UserModel.find(function (err, Users) {
            if (err) {
                return res.json({
                    message: 'Error when getting User.',
                    error: err
                });
            }
            return res.json(Users);
        });
    },

    /**
     * UserController.show()
     */
    show: function (req, res) {
        var id = req.params.id;
        UserModel.findOne({_id: id})
        .exec(function (err, User) {
            if (err) {
                return res.json({
                    message: 'Error when getting User.',
                    error: err
                });
            }
            if (!User) {
                return res.status(404).json({
                    message: 'No such User'
                });
            }
            return res.json(User);
        });
    },

    /**
     * UserController.login()
     */
    login: function (req, res) {
        console.log('LOGIN: ', req.body);
        var email = req.body.email;
        UserModel.findOne({email: email})
        .exec(function (err, User) {
          if (err) {
              console.log('LOGIN ERROR: ', err)
              return res.json({
                  message: 'Login failed.',
                  error: 'Login failed.'
              });
          }
          if (!User) {
              console.log('LOGIN NO USER')
              return res.json({
                  message: 'Login failed.',
                  error: 'Login failed.'
              });
          }

          if (User) {
              if(bcrypt.compareSync(req.body.password, User.password)) {
                  return res.json(User);
              } else {
                  console.log('LOGIN BCRYPT FAIL')
                  return res.json({
                      message: 'Login failed.',
                      error: 'Login failed.'
                  });
              }
          }
            
        });
    },

    /**
     * UserController.loginAdmin()
     */
    loginAdmin: function (req, res) {
        var email = req.body.email;
        UserModel.findOne({email: email})
        .exec(function (err, User) {
          if (err) {
              console.log('LOGIN ERROR: ', err)
              return res.json({
                  message: 'Login failed.',
                  error: 'Login failed.'
              });
          }
          if (!User) {
              console.log('LOGIN NO USER')
              return res.json({
                  message: 'Login failed.',
                  error: 'Login failed.'
              });
          }

          if (User) {
              if(bcrypt.compareSync(req.body.password, User.password) && User.member_type === 'admin') {
                  return res.json(User);
              } else {
                  console.log('LOGIN BCRYPT FAIL')
                  return res.json({
                      message: 'Login failed.',
                      error: 'Login failed.'
                  });
              }
          }
            
        });
    },

    /**
     * UserController.create()
     */
    create: function (req, res) {
        console.log('CREATE: ', req.body)
        var email = req.body.email;
        UserModel.findOne({email: email}, function (err, User) {
            if (err) {
                return res.json({
                    message: 'Error creating User.',
                    error: err
                });
            }

            if (User) {
                return res.json({
                    message: 'Error creating User.',
                    error: 'Error creating User.'
                });
            }

            if (!User) {
                var User = new UserModel({
                    mobile_number : req.body.mobile_number,
                    football_team : req.body.football_team,
                    email : req.body.email,
                    member_type : req.body.member_type,
                    password : req.body.password,
                    location: req.body.location,
                    country: req.body.country
                });
                console.log('PASSWORD: ', User.password);
                User.password = bcrypt.hashSync(User.password, salt);

                User.save(function (err, User) {
                    if (err) {
                        return res.json({
                            message: 'Error creating User.',
                            error: err
                        });
                    }
                    return res.json(User);
                });
            }
        });
    },

    /**
     * UserController.update()
     */
    update: function (req, res) {
        console.log(req.body)
        var id = req.params.id;
        UserModel.findOne({_id: id}, function (err, User) {
            if (err) {
                return res.json({
                    message: 'Error when getting User',
                    error: err
                });
            }
            if (!User) {
                return res.json({
                    message: 'No such User'
                });
            }
            console.log('USER: ', User)
            User.mobile_number = req.body.mobile_number ? req.body.mobile_number : User.mobile_number;
            User.football_team = req.body.football_team ? req.body.football_team : User.football_team;
            User.email = req.body.email ? req.body.email : User.email;
            User.member_type = req.body.member_type ? req.body.member_type : User.member_type;
            User.password = req.body.password ? req.body.password : User.password;
            User.location = req.body.location ? req.body.location : User.location;
            User.country = req.body.country ? req.body.country : User.country;
			
            User.save(function (err, User) {
                if (err) {
                    return res.json({
                        message: 'Error when updating User.',
                        error: err
                    });
                }

                return res.json(User);
            });
        });
    },

    /**
     * UserController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;
        UserModel.findByIdAndRemove(id, function (err, User) {
            if (err) {
                return res.json({
                    message: 'Error when deleting the User.',
                    error: err
                });
            }
            return res.json();
        });
    }
};
