const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, firstName, lastName, email, password } = req.body;

    if ((!name && (!firstName || !lastName)) || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name || `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          pricingCompleted: user.pricingCompleted,
          onboardingCompleted: user.onboardingCompleted,
          plan: user.plan,
          paymentStatus: user.paymentStatus
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).populate('preferences');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          preferences: user.preferences,
          pricingCompleted: user.pricingCompleted,
          onboardingCompleted: user.onboardingCompleted,
          plan: user.plan,
          paymentStatus: user.paymentStatus
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('preferences');
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get Me Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Logout user (invalidate token from client-side usually, but endpoint provided for completion)
// @route   POST /api/auth/logout
// @access  Public (or Private)
const logoutUser = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

// In-memory OTP store for simplicity (email -> { otp, expiresAt, userData })
const otpStore = new Map();

// Helper to send email
const sendOTPEmail = async (email, otp) => {
  // If SMTP is not configured, just log it
  if (!process.env.SMTP_HOST) {
    console.log(`[MOCK EMAIL] To: ${email} | OTP: ${otp}`);
    return;
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER || '"Apply4Works" <noreply@apply4works.com>',
    to: email,
    subject: 'Your Apply4Works Verification Code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
  });
};

// @desc    Google Sign In
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, name, email_verified } = payload;

    // Check if user already exists
    let user = await User.findOne({ email }).populate('preferences');

    if (!user) {
      if (!email_verified) {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, {
          otp,
          expiresAt: Date.now() + 10 * 60 * 1000,
          userData: { email, given_name, family_name, name }
        });
        
        await sendOTPEmail(email, otp);
        return res.status(403).json({ requireOTP: true, email, message: 'Email verification required.' });
      }

      // Create user if they don't exist and email is verified
      user = await User.create({
        name: name || `${given_name} ${family_name}`,
        firstName: given_name,
        lastName: family_name,
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferences: user.preferences,
        pricingCompleted: user.pricingCompleted,
        onboardingCompleted: user.onboardingCompleted,
        plan: user.plan,
        paymentStatus: user.paymentStatus
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during Google login' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }
    
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    
    // OTP matches, clear it
    otpStore.delete(email);
    
    const { given_name, family_name, name } = record.userData;
    
    let user = await User.findOne({ email }).populate('preferences');
    if (!user) {
      user = await User.create({
        name: name || `${given_name} ${family_name}`,
        firstName: given_name,
        lastName: family_name,
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferences: user.preferences,
        pricingCompleted: user.pricingCompleted,
        onboardingCompleted: user.onboardingCompleted,
        plan: user.plan,
        paymentStatus: user.paymentStatus
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  verifyOTP,
  getMe,
  logoutUser
};
