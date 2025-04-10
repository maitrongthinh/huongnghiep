require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ các file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, '../')));

// Kết nối MongoDB (sử dụng biến môi trường trong file .env)
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('Đã kết nối với MongoDB'))
// .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Định nghĩa Schema cho User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  testResults: {
    mbti: { type: Object },
    bigFive: { type: Object },
    holland: { type: Object }
  },
  savedCareers: [{ 
    careerId: Number,
    title: String,
    savedAt: Date
  }],
  savedLearningPlans: [{
    pathId: Number,
    careerTitle: String,
    pathTitle: String,
    savedAt: Date
  }]
});

// Tạo model User
const User = mongoose.model('User', userSchema);

// Middleware xác thực
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Không có token xác thực' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ' });
    req.user = user;
    next();
  });
};

// Routes

// Đăng ký
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo người dùng mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });
    
    // Lưu người dùng vào cơ sở dữ liệu
    await newUser.save();
    
    // Tạo token JWT
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Tạo token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông tin người dùng
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lưu kết quả bài kiểm tra
app.post('/api/user/test-results', authenticateToken, async (req, res) => {
  try {
    const { testType, result } = req.body;
    
    // Kiểm tra loại bài kiểm tra
    if (!['mbti', 'bigFive', 'holland'].includes(testType)) {
      return res.status(400).json({ message: 'Loại bài kiểm tra không hợp lệ' });
    }
    
    // Cập nhật kết quả bài kiểm tra
    const updateData = {};
    updateData[`testResults.${testType}`] = result;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Lưu kết quả bài kiểm tra thành công',
      testResults: user.testResults
    });
  } catch (error) {
    console.error('Lỗi lưu kết quả bài kiểm tra:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lưu nghề nghiệp
app.post('/api/user/saved-careers', authenticateToken, async (req, res) => {
  try {
    const { careerId, title } = req.body;
    
    // Kiểm tra xem nghề nghiệp đã được lưu chưa
    const user = await User.findById(req.user.userId);
    const existingCareer = user.savedCareers.find(career => career.careerId === careerId);
    
    if (existingCareer) {
      return res.status(400).json({ message: 'Nghề nghiệp đã được lưu' });
    }
    
    // Thêm nghề nghiệp vào danh sách đã lưu
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $push: {
          savedCareers: {
            careerId,
            title,
            savedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Lưu nghề nghiệp thành công',
      savedCareers: updatedUser.savedCareers
    });
  } catch (error) {
    console.error('Lỗi lưu nghề nghiệp:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lưu kế hoạch học tập
app.post('/api/user/saved-learning-plans', authenticateToken, async (req, res) => {
  try {
    const { pathId, careerTitle, pathTitle } = req.body;
    
    // Kiểm tra xem kế hoạch học tập đã được lưu chưa
    const user = await User.findById(req.user.userId);
    const existingPlan = user.savedLearningPlans.find(plan => plan.pathId === pathId);
    
    if (existingPlan) {
      return res.status(400).json({ message: 'Kế hoạch học tập đã được lưu' });
    }
    
    // Thêm kế hoạch học tập vào danh sách đã lưu
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $push: {
          savedLearningPlans: {
            pathId,
            careerTitle,
            pathTitle,
            savedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Lưu kế hoạch học tập thành công',
      savedLearningPlans: updatedUser.savedLearningPlans
    });
  } catch (error) {
    console.error('Lỗi lưu kế hoạch học tập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Route mặc định cho Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

module.exports = app;
