const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    return {
      folder: 'announcements',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      public_id: `announcement-${req.user.id}-${uniqueSuffix}`,
      // ✅ KEY FIX: Always use 'image' — Cloudinary serves PDFs correctly with this
      resource_type: 'image'
    };
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, WEBP, and PDF files are allowed'), false);
  }
};

const announcementUpload = multer({
  storage: storage,
  limits: {
    fileSize: 4 * 1024 * 1024 // 4MB for Vercel
  },
  fileFilter: fileFilter
});

module.exports = announcementUpload;