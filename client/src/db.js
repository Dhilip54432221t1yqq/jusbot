import config from './config';

class MongoQueryBuilder {
  constructor(collection) {
    this.collection = collection;
    this.operation = 'find';
    this.filters = [];
    this.orderOptions = null;
    this.limitCount = null;
    this.isSingle = false;
    this.data = null;
  }

  select() {
    return this;
  }

  eq(field, value) {
    this.filters.push({ method: 'eq', args: [field, value] });
    return this;
  }

  neq(field, value) {
    this.filters.push({ method: 'neq', args: [field, value] });
    return this;
  }

  in(field, values) {
    this.filters.push({ method: 'in', args: [field, values] });
    return this;
  }

  is(field, value) {
    this.filters.push({ method: 'is', args: [field, value] });
    return this;
  }

  lte(field, value) {
    this.filters.push({ method: 'lte', args: [field, value] });
    return this;
  }

  gte(field, value) {
    this.filters.push({ method: 'gte', args: [field, value] });
    return this;
  }

  lt(field, value) {
    this.filters.push({ method: 'lt', args: [field, value] });
    return this;
  }

  gt(field, value) {
    this.filters.push({ method: 'gt', args: [field, value] });
    return this;
  }

  or(query) {
    this.filters.push({ method: 'or', args: [query] });
    return this;
  }

  order(field, { ascending } = { ascending: true }) {
    this.orderOptions = { field, ascending };
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.data = data;
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.data = data;
    return this;
  }

  upsert(data, options = {}) {
    this.operation = 'upsert';
    this.data = data;
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  async then(resolve, reject) {
    try {
      const res = await this.execute();
      if (resolve) resolve(res);
      return res;
    } catch (err) {
      if (reject) reject(err);
      else throw err;
    }
  }

  async execute() {
    const sessionStr = localStorage.getItem('reflx_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    const token = session?.access_token;

    const response = await fetch(`${config.API_URL}/api/db-mock/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        collection: this.collection,
        operation: this.operation,
        filters: this.filters,
        order: this.orderOptions,
        limit: this.limitCount,
        isSingle: this.isSingle,
        data: this.data,
        options: this.upsertOptions
      })
    });

    return await response.json();
  }
}

const authCallbacks = new Set();

function triggerAuthChange(event, session) {
  for (const cb of authCallbacks) {
    try {
      cb(event, session);
    } catch (e) {
      console.error('[Auth Callback Error]:', e);
    }
  }
}

const auth = {
  async getSession() {
    const sessionStr = localStorage.getItem('reflx_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    return { data: { session }, error: null };
  },

  async getUser() {
    const sessionStr = localStorage.getItem('reflx_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    if (!session?.access_token) {
      return { data: { user: null }, error: new Error('No active session') };
    }

    try {
      const response = await fetch(`${config.API_URL}/api/db-mock/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUser', token: session.access_token })
      });
      return await response.json();
    } catch (err) {
      return { data: { user: null }, error: err };
    }
  },

  async signUp({ email, password, options = {} }) {
    try {
      const response = await fetch(`${config.API_URL}/api/db-mock/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signUp',
          email,
          password,
          metadata: options.data || {}
        })
      });

      const result = await response.json();
      if (result.data?.session) {
        localStorage.setItem('reflx_session', JSON.stringify(result.data.session));
        triggerAuthChange('SIGNED_IN', result.data.session);
      }
      return result;
    } catch (err) {
      return { data: { session: null, user: null }, error: err };
    }
  },

  async signInWithPassword({ email, password }) {
    try {
      const response = await fetch(`${config.API_URL}/api/db-mock/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signInWithPassword', email, password })
      });

      const result = await response.json();
      if (result.data?.session) {
        localStorage.setItem('reflx_session', JSON.stringify(result.data.session));
        triggerAuthChange('SIGNED_IN', result.data.session);
      }
      return result;
    } catch (err) {
      return { data: { session: null, user: null }, error: err };
    }
  },

  async signOut() {
    const sessionStr = localStorage.getItem('reflx_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    
    try {
      await fetch(`${config.API_URL}/api/db-mock/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signOut', token: session?.access_token })
      });
    } catch (e) {}

    localStorage.removeItem('reflx_session');
    triggerAuthChange('SIGNED_OUT', null);
    return { error: null };
  },

  onAuthStateChange(callback) {
    authCallbacks.add(callback);
    this.getSession().then(({ data: { session } }) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });

    return {
      data: {
        subscription: {
          unsubscribe() {
            authCallbacks.delete(callback);
          }
        }
      }
    };
  }
};

const storage = {
  from(bucket) {
    return {
      async upload(filePath, fileObject, options = {}) {
        const sessionStr = localStorage.getItem('reflx_session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        const token = session?.access_token;

        const formData = new FormData();
        formData.append('bucket', bucket);
        formData.append('path', filePath);
        formData.append('file', fileObject);

        try {
          const response = await fetch(`${config.API_URL}/api/db-mock/storage/upload`, {
            method: 'POST',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
          });
          return await response.json();
        } catch (err) {
          return { data: null, error: err };
        }
      },

      getPublicUrl(filePath) {
        const bucketName = (bucket === 'brand-assets' || bucket === 'workspace-assets' || bucket === 'agent-group-images') ? 'jusbot-workspace-assets' : bucket;
        const publicUrl = `https://${bucketName}.s3.ap-south-1.amazonaws.com/${filePath}`;
        return { data: { publicUrl } };
      }
    };
  }
};

export const supabase = {
  from(collection) {
    return new MongoQueryBuilder(collection);
  },
  auth,
  storage
};

export default supabase;
