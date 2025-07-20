const admin = require('firebase-admin');

/**
 * Error-proof Firebase configuration with automatic fallback to mock database
 * Supports both real Firebase/Firestore and local development mock
 */

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  const hasConfig = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  );
  
  if (!hasConfig) {
    console.warn('⚠️  Firebase environment variables not found. Using mock Firebase for development.');
    console.warn('   To use real Firebase, set: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  }
  
  return hasConfig;
};

let db, auth, adminInstance;

try {
  if (isFirebaseConfigured()) {
    // Use real Firebase
    console.log('✅ Firebase configured - using production mode');
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    // Initialize Firebase Admin only if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
      });
      console.log('🔥 Firebase Admin initialized successfully');
    }

    db = admin.firestore();
    auth = admin.auth();
    adminInstance = admin;
    
    // Test connection
    db.listCollections()
      .then(() => console.log('🌐 Firestore connection verified'))
      .catch(err => {
        console.error('❌ Firestore connection failed:', err.message);
        console.warn('🔄 Falling back to mock Firebase...');
        initializeMockFirebase();
      });
      
  } else {
    initializeMockFirebase();
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.warn('🔄 Falling back to mock Firebase...');
  initializeMockFirebase();
}

function initializeMockFirebase() {
  // Use mock Firebase for development
  console.log('🛠️  Using mock Firebase for development');
  const mockFirebase = require('./mockFirebase');
  
  db = mockFirebase.db;
  auth = mockFirebase.auth;
  adminInstance = mockFirebase.admin;
  
  // Add default test data for development
  try {
    // Create test users
    const testUsers = [
      {
        email: 'test@example.com',
        name: 'Test User',
        userId: 'test@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj95.oVq1Npq', // 'password123'
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      },
      {
        email: 'admin@example.com',
        name: 'Admin User',
        userId: 'admin@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj95.oVq1Npq', // 'password123'
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      }
    ];
    
    testUsers.forEach(user => {
      db.collection('users').doc(user.email).set(user);
    });
    
    console.log('📝 Test users created:');
    console.log('   - test@example.com / password123');
    console.log('   - admin@example.com / password123');
    
    // Create sample documents
    const sampleDoc = {
      id: 'sample-doc-1',
      title: 'Welcome Document',
      content: '<h1>Welcome to the Collaboration Tool!</h1><p>This is a sample document to get you started.</p>',
      isPublic: true,
      createdBy: 'test@example.com',
      collaborators: ['test@example.com', 'admin@example.com'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    db.collection('documents').doc('sample-doc-1').set(sampleDoc);
    console.log('📄 Sample document created');
    
  } catch (error) {
    console.warn('⚠️  Could not create test data:', error.message);
  }
}

// Error-proof database operations wrapper
const safeDbOperation = async (operation, errorMessage = 'Database operation failed') => {
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error.message);
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

// Health check function
const checkDatabaseHealth = async () => {
  try {
    if (isFirebaseConfigured()) {
      await db.collection('health').doc('check').get();
      return { status: 'healthy', type: 'firebase', timestamp: new Date().toISOString() };
    } else {
      const collections = db.collections || new Map();
      return { status: 'healthy', type: 'mock', collections: collections.size, timestamp: new Date().toISOString() };
    }
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

module.exports = {
  admin: adminInstance,
  db,
  auth,
  isFirebaseConfigured,
  safeDbOperation,
  checkDatabaseHealth
};