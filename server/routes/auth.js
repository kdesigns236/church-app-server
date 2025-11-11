const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Email transporter configuration
const createEmailTransporter = () => {
  // Using Gmail as example - configure with your email service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
};

// Test email endpoint
router.get('/test-email', async (req, res) => {
  try {
    const transporter = createEmailTransporter();
    
    console.log('[Auth] Testing email with:', {
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email - Church App',
      text: 'If you receive this, email is working!'
    });
    
    res.json({ success: true, message: 'Test email sent!' });
  } catch (error) {
    console.error('[Auth] Email test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send verification email
const sendVerificationEmail = async (email, code, name) => {
  const transporter = createEmailTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Church of God Evening Light <noreply@cogel.org>',
    to: email,
    subject: 'Verify Your Email - Church of God Evening Light',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A5568;">Welcome to Church of God Evening Light!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering! Please verify your email address using the code below:</p>
        <div style="background-color: #F7FAFC; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2D3748; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E2E8F0;">
        <p style="color: #718096; font-size: 12px;">
          Church of God Evening Light<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `
  };

  try {
    // In development mode, just log the code instead of sending email
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('📧 DEVELOPMENT MODE - EMAIL NOT SENT');
      console.log('========================================');
      console.log('To:', email);
      console.log('Verification Code:', code);
      console.log('========================================\n');
      return true;
    }
    
    await transporter.sendMail(mailOptions);
    console.log('[Auth] Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('[Auth] Error sending email:', error);
    // In development, still return true and log the code
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('⚠️  EMAIL FAILED - SHOWING CODE ANYWAY');
      console.log('========================================');
      console.log('To:', email);
      console.log('Verification Code:', code);
      console.log('========================================\n');
      return true;
    }
    return false;
  }
};

// Helper function to send password reset email
const sendPasswordResetEmail = async (email, code, name) => {
  const transporter = createEmailTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Church of God Evening Light <noreply@cogel.org>',
    to: email,
    subject: 'Reset Your Password - Church of God Evening Light',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A5568;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Use the code below to reset it:</p>
        <div style="background-color: #F7FAFC; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2D3748; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email or contact us if you have concerns.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E2E8F0;">
        <p style="color: #718096; font-size: 12px;">
          Church of God Evening Light<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `
  };

  try {
    // In development mode, just log the code instead of sending email
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('🔑 DEVELOPMENT MODE - PASSWORD RESET');
      console.log('========================================');
      console.log('To:', email);
      console.log('Reset Code:', code);
      console.log('========================================\n');
      return true;
    }
    
    await transporter.sendMail(mailOptions);
    console.log('[Auth] Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('[Auth] Error sending email:', error);
    // In development, still return true and log the code
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('⚠️  EMAIL FAILED - SHOWING RESET CODE');
      console.log('========================================');
      console.log('To:', email);
      console.log('Reset Code:', code);
      console.log('========================================\n');
      return true;
    }
    return false;
  }
};

// REGISTER - Step 1: Create account (requires profile picture)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, profilePicture, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!profilePicture) {
      return res.status(400).json({ error: 'Profile picture is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const { dataStore } = req.app.locals;
    const existingUser = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object (auto-verified, no email verification needed)
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      profilePicture,
      phone: phone || '',
      role: 'member',
      isEmailVerified: true, // Auto-verify
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save user to dataStore
    dataStore.users.push(newUser);
    req.app.locals.saveData();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = newUser;

    console.log('[Auth] User registered and logged in:', email);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// VERIFY EMAIL
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if code matches and hasn't expired
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > user.verificationExpiry) {
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationExpiry = null;
    user.updatedAt = new Date().toISOString();
    req.app.locals.saveData();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password)
    const { password, verificationCode, verificationExpiry, ...userWithoutSensitiveData } = user;

    res.json({
      message: 'Email verified successfully!',
      token,
      user: userWithoutSensitiveData
    });

  } catch (error) {
    console.error('[Auth] Email verification error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

// RESEND VERIFICATION CODE
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.verificationCode = verificationCode;
    user.verificationExpiry = verificationExpiry;
    user.updatedAt = new Date().toISOString();
    req.app.locals.saveData();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode, user.name);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification code sent! Please check your email.' });

  } catch (error) {
    console.error('[Auth] Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code', details: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    console.log('[Auth] Login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[Auth] Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { dataStore } = req.app.locals;
    if (!dataStore || !dataStore.users) {
      console.error('[Auth] DataStore not initialized properly');
      await initializeData();
    }
    
    console.log('[Auth] DataStore users:', dataStore?.users?.length || 0);
    const user = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    console.log('[Auth] User found:', !!user, 'for email:', email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    user.lastLogin = new Date().toISOString();
    req.app.locals.saveData();

    // Return user data (without password)
    const { password: _, verificationCode, verificationExpiry, ...userWithoutSensitiveData } = user;

    res.json({
      message: 'Login successful!',
      token,
      user: userWithoutSensitiveData
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// FORGOT PASSWORD - Step 1: Request reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ message: 'If the email exists, a reset code has been sent.' });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetCode = resetCode;
    user.resetExpiry = resetExpiry;
    user.updatedAt = new Date().toISOString();
    req.app.locals.saveData();

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, resetCode, user.name);

    if (!emailSent) {
      console.error('[Auth] Failed to send password reset email');
    }

    res.json({ message: 'If the email exists, a reset code has been sent.' });

  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
});

// RESET PASSWORD - Step 2: Verify code and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if code matches and hasn't expired
    if (user.resetCode !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (Date.now() > user.resetExpiry) {
      return res.status(400).json({ error: 'Reset code expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetExpiry = null;
    user.updatedAt = new Date().toISOString();
    req.app.locals.saveData();

    res.json({ message: 'Password reset successful! You can now login with your new password.' });

  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
});

// GET CURRENT USER (protected route)
router.get('/me', verifyToken, (req, res) => {
  try {
    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (without password)
    const { password, verificationCode, verificationExpiry, resetCode, resetExpiry, ...userWithoutSensitiveData } = user;

    res.json({ user: userWithoutSensitiveData });

  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data', details: error.message });
  }
});

// UPDATE PROFILE (protected route)
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture) user.profilePicture = profilePicture;
    user.updatedAt = new Date().toISOString();

    req.app.locals.saveData();

    // Return user data (without password)
    const { password, verificationCode, verificationExpiry, resetCode, resetExpiry, ...userWithoutSensitiveData } = user;

    res.json({
      message: 'Profile updated successfully!',
      user: userWithoutSensitiveData
    });

  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: 'Profile update failed', details: error.message });
  }
});

// CHANGE PASSWORD (protected route)
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const { dataStore } = req.app.locals;
    const user = dataStore.users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    user.updatedAt = new Date().toISOString();
    req.app.locals.saveData();

    res.json({ message: 'Password changed successfully!' });

  } catch (error) {
    console.error('[Auth] Change password error:', error);
    res.status(500).json({ error: 'Password change failed', details: error.message });
  }
});

module.exports = router;
