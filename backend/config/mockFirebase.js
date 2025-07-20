// Mock Firebase service for development when Firebase is not configured
class MockCollection {
  constructor(name) {
    this.name = name;
    this.data = new Map();
  }

  doc(id) {
    return new MockDocument(this, id);
  }

  async add(data) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const doc = new MockDocument(this, id);
    await doc.set({ ...data, id });
    return doc;
  }

  where(field, operator, value) {
    return new MockQuery(this, field, operator, value);
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(this).orderBy(field, direction);
  }

  limit(count) {
    return new MockQuery(this).limit(count);
  }

  async get() {
    const docs = Array.from(this.data.values()).map(data => ({
      id: data.id,
      data: () => data,
      exists: true
    }));
    return { docs, empty: docs.length === 0 };
  }
}

class MockDocument {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }

  async get() {
    const data = this.collection.data.get(this.id);
    return {
      exists: !!data,
      data: () => data || null,
      id: this.id
    };
  }

  async set(data) {
    this.collection.data.set(this.id, { ...data, id: this.id });
    return this;
  }

  async update(data) {
    const existing = this.collection.data.get(this.id) || {};
    this.collection.data.set(this.id, { ...existing, ...data, id: this.id });
    return this;
  }

  async delete() {
    this.collection.data.delete(this.id);
    return this;
  }
}

class MockQuery {
  constructor(collection, field = null, operator = null, value = null) {
    this.collection = collection;
    this.filters = field ? [{ field, operator, value }] : [];
    this._orderBy = null;
    this._limit = null;
  }

  where(field, operator, value) {
    this.filters.push({ field, operator, value });
    return this;
  }

  orderBy(field, direction = 'asc') {
    this._orderBy = { field, direction };
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  async get() {
    let docs = Array.from(this.collection.data.values());

    // Apply filters
    for (const filter of this.filters) {
      docs = docs.filter(doc => {
        const fieldValue = doc[filter.field];
        switch (filter.operator) {
          case '==':
            return fieldValue === filter.value;
          case '!=':
            return fieldValue !== filter.value;
          case '>':
            return fieldValue > filter.value;
          case '>=':
            return fieldValue >= filter.value;
          case '<':
            return fieldValue < filter.value;
          case '<=':
            return fieldValue <= filter.value;
          case 'array-contains':
            return Array.isArray(fieldValue) && fieldValue.includes(filter.value);
          default:
            return true;
        }
      });
    }

    // Apply ordering
    if (this._orderBy) {
      docs.sort((a, b) => {
        const aVal = a[this._orderBy.field];
        const bVal = b[this._orderBy.field];
        if (this._orderBy.direction === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }

    // Apply limit
    if (this._limit) {
      docs = docs.slice(0, this._limit);
    }

    const mappedDocs = docs.map(data => ({
      id: data.id,
      data: () => data,
      exists: true
    }));

    return { docs: mappedDocs, empty: mappedDocs.length === 0 };
  }
}

class MockFirestore {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }
}

// Create mock Firebase admin
const mockAdmin = {
  firestore: () => new MockFirestore(),
  apps: { length: 1 }, // Pretend we're already initialized
  initializeApp: () => mockAdmin,
  credential: {
    cert: () => ({})
  }
};

module.exports = {
  admin: mockAdmin,
  db: new MockFirestore(),
  auth: {
    verifyIdToken: async (token) => ({ uid: 'mock-uid', email: 'mock@example.com' })
  }
};