require('dotenv').config();
const { db } = require('./config/firebase');

async function createTestData() {
  try {
    // Create test user
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      userId: 'test@example.com',
      password: '$2b$10$mGbg8vqb0xS79EwuJL69sedwCJ0fHSyUaAo4K4MnRL6jAC9/psmHu', // password123
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc('test@example.com').set(testUser);
    console.log('Test user created');
    
    // Create test documents
    const testDocs = [
      {
        title: 'My Private Document',
        content: 'This is a private document',
        isPublic: false,
        createdBy: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        collaborators: ['test@example.com'],
        permissions: { 'test@example.com': 'owner' }
      },
      {
        title: 'My Public Document',
        content: 'This is a public document',
        isPublic: true,
        createdBy: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        collaborators: ['test@example.com'],
        permissions: { 'test@example.com': 'owner' }
      },
      {
        title: 'Another Public Document',
        content: 'This is another public document',
        isPublic: true,
        createdBy: 'other@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        collaborators: ['other@example.com'],
        permissions: { 'other@example.com': 'owner' }
      }
    ];
    
    for (const doc of testDocs) {
      await db.collection('documents').add(doc);
    }
    
    console.log('Test documents created');
    console.log('Now you can login with: test@example.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();