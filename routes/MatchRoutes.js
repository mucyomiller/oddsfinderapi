var express = require('express');
var router = express.Router();
var MatchController = require('../controllers/MatchController.js');

/*
 * GET
 */
router.get('/', MatchController.list);

/*
 * GET
 */
router.get('/top-leagues', MatchController.topLeagues);

/*
 * GET
 */
router.get('/league/:league', MatchController.getMatchesByLeague);

/*
 * GET
 */
router.get('/:id', MatchController.show);

/*
 * POST
 */
router.post('/', MatchController.create);

/*
 * PUT
 */
router.put('/:id', MatchController.update);

/*
 * DELETE
 */
router.delete('/:id', MatchController.remove);

module.exports = router;
