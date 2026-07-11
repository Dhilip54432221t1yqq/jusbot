import '../config/env.js';
import { getDb } from './mongodb.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Initialize AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

class MongoQueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filters = {};
    this.sortOptions = null;
    this.limitCount = null;
    this.isSingle = false;
    this.operation = 'find'; // 'find', 'insert', 'update', 'delete'
    this.operationData = null;
  }

  select() {
    return this;
  }

  _addFilter(field, op, value) {
    const mongoField = field === 'id' ? '_id' : field;
    if (!this.filters[mongoField]) {
      this.filters[mongoField] = {};
    }
    if (typeof this.filters[mongoField] === 'object' && this.filters[mongoField] !== null && !Array.isArray(this.filters[mongoField])) {
      this.filters[mongoField][op] = value;
    } else {
      this.filters[mongoField] = { [op]: value };
    }
  }

  eq(field, value) {
    const mongoField = field === 'id' ? '_id' : field;
    this.filters[mongoField] = value;
    return this;
  }

  neq(field, value) {
    this._addFilter(field, '$ne', value);
    return this;
  }

  not(field, op, value) {
    if (op === 'is' && value === null) {
      this._addFilter(field, '$ne', null);
    }
    return this;
  }

  in(field, values) {
    this._addFilter(field, '$in', values);
    return this;
  }

  is(field, value) {
    const mongoField = field === 'id' ? '_id' : field;
    this.filters[mongoField] = value;
    return this;
  }

  lte(field, value) {
    this._addFilter(field, '$lte', value);
    return this;
  }

  gte(field, value) {
    this._addFilter(field, '$gte', value);
    return this;
  }

  lt(field, value) {
    this._addFilter(field, '$lt', value);
    return this;
  }

  gt(field, value) {
    this._addFilter(field, '$gt', value);
    return this;
  }

  or(queryStr) {
    // Enhanced parser for .or('id.eq.x,name.ilike.%search%')
    const conditions = queryStr.split(',').map(part => {
      // Support eq
      const matchEq = part.match(/^([^.]+)\.eq\.(.+)$/);
      if (matchEq) {
        const field = matchEq[1] === 'id' ? '_id' : matchEq[1];
        return { [field]: matchEq[2] };
      }
      
      // Support ilike
      const matchIlike = part.match(/^([^.]+)\.ilike\.(.+)$/);
      if (matchIlike) {
        const field = matchIlike[1] === 'id' ? '_id' : matchIlike[1];
        let val = matchIlike[2].replace(/%/g, '.*');
        return { [field]: { $regex: val, $options: 'i' } };
      }
      
      return null;
    }).filter(Boolean);

    if (conditions.length > 0) {
      this.filters['$or'] = conditions;
    }
    return this;
  }

  order(field, { ascending } = { ascending: true }) {
    const sortField = field === 'id' ? '_id' : field;
    this.sortOptions = { [sortField]: ascending ? 1 : -1 };
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  range(from, to) {
    this.skipCount = from;
    this.limitCount = (to - from) + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.operationData = data;
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.operationData = data;
    return this;
  }

  upsert(data, options = {}) {
    this.operation = 'upsert';
    this.operationData = data;
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  // Thenable implementation to support async/await
  async then(resolve, reject) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
      else throw err;
    }
  }

  async execute() {
    try {
      const db = getDb();
      const collection = db.collection(this.collectionName);

      if (this.operation === 'insert') {
        const records = Array.isArray(this.operationData) ? this.operationData : [this.operationData];
        const docsToInsert = [];
        
        for (const record of records) {
          const { id, ...rest } = record;
          let docId = id;
          
          if (!docId) {
            if (this.collectionName === 'workspaces') {
              // Generate sequential ID starting with JB001
              const maxWorkspace = await collection.find({ _id: /^JB\d+$/ }).sort({ _id: -1 }).limit(1).toArray();
              if (maxWorkspace.length > 0) {
                const lastId = maxWorkspace[0]._id;
                const lastNum = parseInt(lastId.substring(2), 10);
                const nextNum = lastNum + 1;
                docId = `JB${String(nextNum).padStart(3, '0')}`;
              } else {
                docId = 'JB001';
              }
            } else {
              docId = randomUUID();
            }
          }

          docsToInsert.push({
            _id: docId,
            ...rest,
            created_at: record.created_at || new Date().toISOString(),
            updated_at: record.updated_at || new Date().toISOString()
          });
        }

        await collection.insertMany(docsToInsert);
        const mapped = docsToInsert.map(d => {
          const { _id, ...rest } = d;
          return { id: _id, ...rest };
        });
        const data = this.isSingle ? mapped[0] : (Array.isArray(this.operationData) ? mapped : mapped[0]);
        return { data, error: null };
      }

      if (this.operation === 'upsert') {
        const records = Array.isArray(this.operationData) ? this.operationData : [this.operationData];
        const onConflictField = this.upsertOptions?.onConflict || 'id';
        const mongoConflictField = onConflictField === 'id' ? '_id' : onConflictField;

        const results = [];
        for (const record of records) {
          const { id, ...rest } = record;
          const docId = id || record[onConflictField] || randomUUID();
          
          const matchCriteria = { [mongoConflictField]: record[onConflictField] || docId };
          
          const updateDoc = {
            ...rest,
            updated_at: new Date().toISOString()
          };

          await collection.updateOne(
            matchCriteria,
            {
              $set: updateDoc,
              $setOnInsert: {
                _id: docId,
                created_at: new Date().toISOString()
              }
            },
            { upsert: true }
          );

          const finalDoc = await collection.findOne(matchCriteria);
          if (finalDoc) {
            const { _id, ...finalRest } = finalDoc;
            results.push({ id: _id, ...finalRest });
          }
        }
        
        const data = Array.isArray(this.operationData) ? results : results[0];
        return { data, error: null };
      }

      if (this.operation === 'update') {
        const updateData = { ...this.operationData, updated_at: new Date().toISOString() };
        // Don't let users update _id
        delete updateData.id;
        delete updateData._id;

        await collection.updateMany(this.filters, { $set: updateData });
        const results = await collection.find(this.filters).toArray();
        const mapped = results.map(item => {
          const { _id, ...rest } = item;
          return { id: _id, ...rest };
        });
        return { data: this.isSingle ? mapped[0] : mapped, error: null };
      }

      if (this.operation === 'delete') {
        await collection.deleteMany(this.filters);
        return { data: [], error: null };
      }

      // Default find operation
      let cursor = collection.find(this.filters);
      if (this.sortOptions) cursor = cursor.sort(this.sortOptions);
      if (this.skipCount) cursor = cursor.skip(this.skipCount);
      if (this.limitCount) cursor = cursor.limit(this.limitCount);

      const rawData = await cursor.toArray();
      const mapped = rawData.map(item => {
        const { _id, ...rest } = item;
        return { id: _id, ...rest };
      });

      const count = await collection.countDocuments(this.filters);

      if (this.isSingle) {
        return { data: mapped[0] || null, count, error: null };
      }
      return { data: mapped, count, error: null };
    } catch (err) {
      console.error(`[Supabase Mock Error in "${this.collectionName}"]:`, err.message);
      return { data: null, error: err };
    }
  }
}

// Supabase Mock Client Export
export const supabase = {
  from(collectionName) {
    return new MongoQueryBuilder(collectionName);
  },

  async rpc(funcName, params = {}) {
    // Mock key RPC endpoints for compatibility
    console.log(`[Supabase Mock RPC] Executing: ${funcName}`, params);
    if (funcName === 'exec_sql') {
      // Return empty/success structure for database setup scripts
      return { data: [], error: null };
    }
    return { data: null, error: new Error(`RPC function "${funcName}" not mocked`) };
  },

  auth: {
    async getUser(token) {
      try {
        if (!token) return { data: { user: null }, error: new Error('Token required') };
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        // Map payload to Supabase user format
        const user = {
          id: decoded.id,
          email: decoded.email,
          user_metadata: decoded.metadata || {}
        };
        return { data: { user }, error: null };
      } catch (err) {
        return { data: { user: null }, error: err };
      }
    }
  },

  storage: {
    from(bucketName) {
      return {
        async upload(filePath, fileBuffer, options = {}) {
          try {
            const bucket = process.env.AWS_S3_BUCKET_NAME || bucketName;
            const region = process.env.AWS_REGION || 'us-east-1';
            
            const uploadParams = {
              Bucket: bucket,
              Key: filePath,
              Body: fileBuffer,
              ContentType: options.contentType || 'application/octet-stream',
            };

            await s3Client.send(new PutObjectCommand(uploadParams));
            
            const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${filePath}`;
            return {
              data: { path: filePath, publicUrl },
              error: null
            };
          } catch (err) {
            console.error('[Supabase Mock Storage Upload Error]:', err.message);
            return { data: null, error: err };
          }
        },

        getPublicUrl(filePath) {
          const bucket = process.env.AWS_S3_BUCKET_NAME || bucketName;
          const region = process.env.AWS_REGION || 'us-east-1';
          const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${filePath}`;
          return { data: { publicUrl } };
        }
      };
    }
  }
};

export default supabase;
