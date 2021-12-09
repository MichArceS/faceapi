var express = require('express');
var router = express.Router();
var faceA = require('../controllers/faceAna.controller');
const multer = require('multer');
const upload = multer({ dest: '../uploads/' })

router.post('/sendVideo',
    upload.single('file'),
    faceA.recieveVideo)

module.exports = router;
