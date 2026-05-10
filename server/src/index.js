import 'dotenv/config';
import axios from 'axios';
import cors from 'cors';
import crypto from 'node:crypto';
import express from 'express';
import FormData from 'form-data';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  createUser,
  deleteScan,
  deleteUser,
  getAnalysis,
  getUserByEmail,
  getUserById,
  listScans,
  listUsers,
  pool,
  saveAnalysis,
  updateScan,
  updateUser,
} from './db.js';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const port = Number(process.env.PORT || 5000);
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const aiServiceUrl = process.env.AI_SERVICE_URL || process.env.PYTORCH_API_URL || 'http://localhost:8000/predict';
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@eyedx.local').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

app.use(cors({ origin: clientOrigins }));
app.use(express.json());

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    return res.status(401).json({ message: 'Admin token is required.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access is required.' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token.' });
  }
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(503).json({ ok: false, database: 'unavailable', message: error.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, organization } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existing = await getUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'User with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email: email.toLowerCase(),
      password_hash,
      first_name: firstName,
      last_name: lastName,
      organization,
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: 'doctor' },
      jwtSecret,
      { expiresIn: '30d' },
    );

    res.json({ token, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, organization: user.organization, role: 'doctor' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed.', detail: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: 'doctor' },
      jwtSecret,
      { expiresIn: '30d' },
    );
    res.json({ token, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, organization: user.organization, role: 'doctor' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed.', detail: error.message });
  }
});

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (email.toLowerCase() !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { sub: 'admin', email: adminEmail, firstName: 'Platform', lastName: 'Admin', role: 'admin' },
      jwtSecret,
      { expiresIn: '12h' },
    );

    res.json({
      token,
      user: { id: 'admin', email: adminEmail, firstName: 'Platform', lastName: 'Admin', role: 'admin' },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Admin login failed.', detail: error.message });
  }
});

app.post('/api/analyze', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid file type. Please upload an image.' });
    }

    // Forward the uploaded image to the Python FastAPI AI service.
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const predictionResponse = await axios.post(aiServiceUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    const aiResult = predictionResponse.data;
    const now = new Date();
    const prediction = {
      scanId: `SCN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      patientId: req.body.patientId || 'Unknown',
      patientName: req.body.patientName || '',
      scanType: req.body.scanType || 'Fundus Photography',
      eye: req.body.eye || 'Left Eye (OS)',
      notes: req.body.notes || '',
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      severity: aiResult.severity,
      confidence: Math.round(Number(aiResult.confidence) * 1000) / 10,
      is_diabetic: aiResult.is_diabetic,
      class_id: aiResult.class_id,
      detectedFeatures: [],
    };

    try {
      await saveAnalysis({
        prediction,
        upload: {
          patientName: req.body.patientName || '',
          scanType: req.body.scanType || 'Fundus Photography',
          eye: req.body.eye || 'Left Eye (OS)',
          notes: req.body.notes || '',
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
        },
      });
    } catch (databaseError) {
      console.warn('Prediction succeeded but database save failed:', databaseError.message);
    }

    res.json(aiResult);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      return res.status(503).json({ message: 'AI service is not running or did not respond.' });
    }
    if (error.response) {
      return res.status(502).json({
        message: 'AI service returned an error.',
        detail: error.response.data,
      });
    }
    next(error);
  }
});

app.post('/api/analysis', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid file type. Please upload an image.' });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const predictionResponse = await axios.post(aiServiceUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    const aiResult = predictionResponse.data;
    const now = new Date();
    const prediction = {
      scanId: `SCN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      patientId: req.body.patientId || 'Unknown',
      patientName: req.body.patientName || '',
      scanType: req.body.scanType || 'Fundus Photography',
      eye: req.body.eye || 'Left Eye (OS)',
      notes: req.body.notes || '',
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      severity: aiResult.severity,
      confidence: Math.round(Number(aiResult.confidence) * 1000) / 10,
      is_diabetic: aiResult.is_diabetic,
      class_id: aiResult.class_id,
      detectedFeatures: [],
    };

    try {
      await saveAnalysis({
        prediction,
        upload: {
          patientName: req.body.patientName || '',
          scanType: req.body.scanType || 'Fundus Photography',
          eye: req.body.eye || 'Left Eye (OS)',
          notes: req.body.notes || '',
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
        },
      });
    } catch (databaseError) {
      console.warn('Prediction succeeded but database save failed:', databaseError.message);
    }

    res.json(prediction);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      return res.status(503).json({ message: 'AI service is not running or did not respond.' });
    }
    if (error.response) {
      return res.status(502).json({
        message: 'AI service returned an error.',
        detail: error.response.data,
      });
    }
    next(error);
  }
});

app.get('/api/scans', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const scans = await listScans(limit);
    res.json(scans);
  } catch (error) {
    next(error);
  }
});

app.get('/api/analysis/:scanId', async (req, res, next) => {
  try {
    const analysis = await getAnalysis(req.params.scanId);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found.' });
    }

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/users', requireAdmin, async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, organization } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: 'A doctor account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email: normalizedEmail,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      organization,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      organization: user.organization,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'Doctor account not found.' });
    }

    const { email, password, firstName, lastName, organization } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const userWithEmail = await getUserByEmail(normalizedEmail);
    if (userWithEmail && userWithEmail.id !== req.params.id) {
      return res.status(409).json({ message: 'Another doctor account already uses this email.' });
    }

    const password_hash = password ? await bcrypt.hash(password, 10) : null;
    const user = await updateUser(req.params.id, {
      email: normalizedEmail,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      organization,
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const user = await deleteUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Doctor account not found.' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/scans/:scanId', requireAdmin, async (req, res, next) => {
  try {
    const { patientId, patientName, scanType, eye, notes, severity } = req.body || {};
    const allowedSeverities = new Set(['No DR', 'Mild', 'Moderate', 'Severe', 'No diabetic retinopathy', 'Mild diabetic retinopathy', 'Moderate diabetic retinopathy', 'Severe diabetic retinopathy', 'Proliferative diabetic retinopathy']);

    if (!patientId || !scanType || !eye || !severity) {
      return res.status(400).json({ message: 'Patient ID, scan type, eye, and severity are required.' });
    }

    if (!allowedSeverities.has(severity)) {
      return res.status(400).json({ message: 'Invalid severity value.' });
    }

    const scan = await updateScan(req.params.scanId, {
      patient_id: patientId,
      patient_name: patientName,
      scan_type: scanType,
      eye,
      notes,
      severity,
    });

    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found.' });
    }

    res.json(scan);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/scans/:scanId', requireAdmin, async (req, res, next) => {
  try {
    const scan = await deleteScan(req.params.scanId);
    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found.' });
    }

    res.json(scan);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Server error.', detail: error.message });
});

app.listen(port, () => {
  console.log(`Node API listening on http://localhost:${port}`);
});
