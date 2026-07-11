import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'crypto';
import { supabase } from '../utils/db.js';
import { getDb } from '../utils/mongodb.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Generic database query runner
router.post('/query', async (req, res) => {
  const { collection, operation, filters, order, limit, isSingle, data } = req.body;

  try {
    let q = supabase.from(collection);

    if (operation === 'insert') {
      q = q.insert(data);
    } else if (operation === 'update') {
      q = q.update(data);
    } else if (operation === 'upsert') {
      q = q.upsert(data, req.body.options);
    } else if (operation === 'delete') {
      q = q.delete();
    }

    if (filters && Array.isArray(filters)) {
      for (const f of filters) {
        if (f.method === 'eq') {
          q = q.eq(f.args[0], f.args[1]);
        } else if (f.method === 'neq') {
          q = q.neq(f.args[0], f.args[1]);
        } else if (f.method === 'in') {
          q = q.in(f.args[0], f.args[1]);
        } else if (f.method === 'is') {
          q = q.is(f.args[0], f.args[1]);
        } else if (f.method === 'or') {
          q = q.or(f.args[0]);
        } else if (f.method === 'lte') {
          q = q.lte(f.args[0], f.args[1]);
        } else if (f.method === 'gte') {
          q = q.gte(f.args[0], f.args[1]);
        } else if (f.method === 'lt') {
          q = q.lt(f.args[0], f.args[1]);
        } else if (f.method === 'gt') {
          q = q.gt(f.args[0], f.args[1]);
        }
      }
    }

    if (order) {
      q = q.order(order.field, { ascending: order.ascending });
    }
    if (limit) {
      q = q.limit(limit);
    }
    if (isSingle) {
      q = q.single();
    }

    const result = await q;
    res.json(result);
  } catch (error) {
    console.error('[Supabase Mock Router Query Error]:', error.message);
    res.status(500).json({ data: null, error: { message: error.message } });
  }
});

// 2. Custom User Authentication Handler (SignUp / Login / SignOut)
router.post('/auth', async (req, res) => {
  const { action, email, password, metadata, token } = req.body;

  try {
    const db = getDb();
    const members = db.collection('members');

    if (action === 'signUp') {
      const existing = await members.findOne({ _id: email });
      if (existing) {
        return res.json({ data: { user: null }, error: { message: 'User already exists' } });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const newMember = {
        _id: email, // username = member _id as per requirement
        id: userId,
        email: email,
        password: hashedPassword,
        name: metadata?.name || email.split('@')[0],
        role: metadata?.role || 'admin',
        subRole: metadata?.subRole || 'manager',
        crmId: metadata?.crmId || 'crm_default',
        created_at: new Date().toISOString(),
        auth: null
      };

      await members.insertOne(newMember);

      const accessToken = jwt.sign(
        { id: userId, email, role: newMember.role, metadata },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '7d' }
      );

      // Save token inside member.auth as session token
      await members.updateOne({ _id: email }, { $set: { auth: accessToken } });

      const user = { id: userId, email, user_metadata: metadata || {} };
      return res.json({
        data: {
          session: { access_token: accessToken, user },
          user
        },
        error: null
      });
    }

    if (action === 'signInWithPassword') {
      const member = await members.findOne({ _id: email });
      if (!member) {
        return res.json({ data: { session: null, user: null }, error: { message: 'Invalid credentials' } });
      }

      const validPassword = await bcrypt.compare(password, member.password);
      if (!validPassword) {
        return res.json({ data: { session: null, user: null }, error: { message: 'Invalid credentials' } });
      }

      const accessToken = jwt.sign(
        { id: member.id, email: member.email, role: member.role, metadata: { name: member.name } },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '7d' }
      );

      // Save session token
      await members.updateOne({ _id: email }, { $set: { auth: accessToken } });

      const user = { id: member.id, email: member.email, user_metadata: { name: member.name } };
      return res.json({
        data: {
          session: { access_token: accessToken, user },
          user
        },
        error: null
      });
    }

    if (action === 'getUser') {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const member = await members.findOne({ id: decoded.id });
      if (!member) {
        return res.json({ data: { user: null }, error: { message: 'User not found' } });
      }
      const user = { id: member.id, email: member.email, user_metadata: { name: member.name } };
      return res.json({ data: { user }, error: null });
    }

    if (action === 'signOut') {
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && decoded.email) {
            await members.updateOne({ _id: decoded.email }, { $set: { auth: null } });
          }
        } catch (e) {}
      }
      return res.json({ error: null });
    }

    return res.status(400).json({ error: { message: `Auth action "${action}" not supported` } });
  } catch (error) {
    console.error('[Supabase Mock Auth Error]:', error.message);
    res.json({ data: null, error: { message: error.message } });
  }
});

// 3. AWS S3 file upload handler (receives from frontend, uploads to S3, returns public URL)
router.post('/storage/upload', upload.single('file'), async (req, res) => {
  const { bucket, path } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ data: null, error: { message: 'No file provided' } });
  }

  try {
    const storageResult = await supabase.storage.from(bucket).upload(path, file.buffer, {
      contentType: file.mimetype
    });

    res.json(storageResult);
  } catch (error) {
    console.error('[Supabase Mock Storage Error]:', error.message);
    res.status(500).json({ data: null, error: { message: error.message } });
  }
});

export default router;
