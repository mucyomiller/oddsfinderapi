var express = require('express');
var router = express.Router();
var PostController = require('../controllers/PostController.js');

/*
 * GET
 */
router.get('/', PostController.list);

/*
 * GET
 */
router.get('/:id', PostController.show);

/*
 * POST
 */
router.post('/', PostController.create);

/*
 * PUT
 */
router.put('/:id', PostController.update);

/*
 * DELETE
 */
router.delete('/:id', PostController.remove);

module.exports = router;
