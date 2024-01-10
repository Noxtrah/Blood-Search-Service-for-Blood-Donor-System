// bloodSearchRoutes.js
import express from 'express';
const router = express.Router();
import * as bloodSearchController from '../Controllers/bloodSearchController.js';

router.get('/purge-queue', bloodSearchController.purgeQueue);
// API endpoint for searching blood
router.get('/search-blood', bloodSearchController.searchBlood);
// API endpoint for resuming blood search
// router.post('/resume-search', bloodSearchController.resumeSearch);

export default router;
