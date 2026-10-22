const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common safe productivity document & image types
  const allowedExtensions = /jpeg|jpg|png|gif|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|json/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not supported. Please upload documents, images, or archive files.`));
  }
};

const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 25) * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: maxSizeBytes },
  fileFilter
});

module.exports = upload;
