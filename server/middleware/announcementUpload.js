const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for announcement attachments
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Base config
    const params = {
      folder: 'announcements',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      public_id: `announcement-${req.user.id}-${uniqueSuffix}`
    };
    
    // PDFs use 'raw' resource type in Cloudinary
    if (isPDF) {
      params.resource_type = 'raw';
    }
    
    return params;
  }
});

// File filter - images and PDFs only
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
    fileSize: 5 * 1024 * 1024 // 5MB limit (same as your medcert)
  },
  fileFilter: fileFilter
});

module.exports = announcementUpload;