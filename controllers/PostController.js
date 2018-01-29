var PostModel = require('../models/PostModel.js');

/**
 * PostController.js
 *
 * @description :: Server-side logic for managing Posts.
 */
module.exports = {

    /**
     * PostController.list()
     */
    list: function (req, res) {
        PostModel.find(function (err, Postes) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Post.',
                    error: err
                });
            }
            return res.json(Postes);
        });
    },

    /**
     * PostController.show()
     */
    show: function (req, res) {
        var id = req.params.id;
        PostModel.findOne({_id: id}, function (err, Post) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Post.',
                    error: err
                });
            }
            if (!Post) {
                return res.status(404).json({
                    message: 'No such Post'
                });
            }
            return res.json(Post);
        });
    },

    /**
     * PostController.create()
     */
    create: function (req, res) {
        var Post = new PostModel({
          author : req.body.author,
          date : req.body.date,
          excerpt : req.body.excerpt,
          title : req.body.title,
          content : req.body.content,
          published : req.body.published,
          categories: req.body.categories
        });

        Post.save(function (err, Post) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating Post',
                    error: err
                });
            }
            return res.status(201).json(Post);
        });
    },

    /**
     * PostController.update()
     */
    update: function (req, res) {
        var id = req.params.id;
        PostModel.findOne({_id: id}, function (err, Post) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Post',
                    error: err
                });
            }
            if (!Post) {
                return res.status(404).json({
                    message: 'No such Post'
                });
            }

            Post.author = req.body.author ? req.body.author : Post.author;
            Post.date = req.body.date ? req.body.date : Post.date;
            Post.excerpt = req.body.excerpt ? req.body.excerpt : Post.excerpt;
            Post.title = req.body.title ? req.body.title : Post.title;
            Post.content = req.body.content ? req.body.content : Post.content;
            Post.published = req.body.published ? req.body.published : Post.published;
            Post.categories = req.body.categories ? req.body.categories : Post.categories;
			
            Post.save(function (err, Post) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating Post.',
                        error: err
                    });
                }

                return res.json(Post);
            });
        });
    },

    /**
     * PostController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;
        PostModel.findByIdAndRemove(id, function (err, Post) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the Post.',
                    error: err
                });
            }
            return res.status(204).json();
        });
    }
};
