const multer = require('multer');
// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images");
  },
  filename: function (req, file, cb) {
    const currentDate = new Date().toISOString().slice(0, 10);
    const randomNumber = Math.random().toString().substring(2, 8);
    const fileExtension = file.originalname.split('.').pop();
    const userId = req.userId;
    const newFilename = `${userId}_expense_${currentDate}_${randomNumber}.${fileExtension}`;
    cb(null, newFilename);
  },
});

const uploadMiddleware = multer({ storage: storage });

module.exports = uploadMiddleware;