# How to Deploy the Real-time Collaborative Document Editor

## Prerequisites

- Node.js 16+ installed
- Firebase account and project
- Git repository
- Domain name (optional)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Choose a project name (e.g., "collaborative-docs-prod")
4. Enable Google Analytics (optional)
5. Wait for project creation

### 1.2 Enable Firebase Services
1. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose location (closest to users)

2. **Firebase Authentication** (optional):
   - Go to Authentication
   - Click "Get started"
   - Enable sign-in methods you want to use

3. **Firebase Realtime Database**:
   - Go to Realtime Database
   - Click "Create database"
   - Start in locked mode
   - Choose location

### 1.3 Generate Service Account Key
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Extract the following values for environment variables:
   - `project_id`
   - `private_key_id`
   - `private_key`
   - `client_email`
   - `client_id`

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables
Create `.env` file in the backend directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2.2 Frontend Environment Variables
Create `.env` file in the frontend directory:

```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_WS_URL=https://your-backend-domain.com

# Firebase Configuration (if using Firebase Auth)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Step 3: Backend Deployment

### Option A: Deploy to Railway
1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
cd backend
railway init
```

4. Set environment variables:
```bash
railway variables set JWT_SECRET=your-secret
railway variables set FIREBASE_PROJECT_ID=your-project-id
# Set all other environment variables
```

5. Deploy:
```bash
railway up
```

### Option B: Deploy to Heroku
1. Install Heroku CLI
2. Login to Heroku:
```bash
heroku login
```

3. Create Heroku app:
```bash
cd backend
heroku create your-app-name
```

4. Set environment variables:
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set FIREBASE_PROJECT_ID=your-project-id
# Set all other environment variables
```

5. Deploy:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option C: Deploy to Firebase Functions
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase functions:
```bash
firebase init functions
```

4. Modify `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const app = require('./server'); // Your Express app

exports.api = functions.https.onRequest(app);
```

5. Deploy:
```bash
firebase deploy --only functions
```

## Step 4: Frontend Deployment

### Option A: Deploy to Vercel
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd frontend
vercel --prod
```

4. Set environment variables in Vercel dashboard

### Option B: Deploy to Netlify
1. Build the project:
```bash
cd frontend
npm run build
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy:
```bash
netlify deploy --prod --dir=build
```

### Option C: Deploy to Firebase Hosting
1. Initialize Firebase hosting:
```bash
firebase init hosting
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
firebase deploy --only hosting
```

## Step 5: Database Security Rules

### 5.1 Firestore Security Rules
Add these rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Documents access rules
    match /documents/{documentId} {
      allow read: if request.auth != null && (
        resource.data.isPublic == true ||
        request.auth.uid in resource.data.collaborators ||
        request.auth.uid == resource.data.createdBy
      );
      
      allow write: if request.auth != null && (
        request.auth.uid in resource.data.collaborators ||
        request.auth.uid == resource.data.createdBy
      );
      
      allow create: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
  }
}
```

### 5.2 Realtime Database Security Rules
```json
{
  "rules": {
    "documents": {
      "$documentId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Step 6: Domain Configuration

### 6.1 Custom Domain Setup
1. **For Vercel**:
   - Go to Vercel dashboard
   - Add custom domain
   - Configure DNS records

2. **For Netlify**:
   - Go to Netlify dashboard
   - Add custom domain
   - Configure DNS records

3. **For Firebase Hosting**:
   - Run `firebase hosting:channel:deploy live --domain your-domain.com`

### 6.2 SSL Certificate
- Most platforms (Vercel, Netlify, Firebase) automatically provide SSL
- For custom deployments, use Let's Encrypt or CloudFlare

## Step 7: Performance Optimization

### 7.1 CDN Setup
- Configure CloudFlare for static assets
- Enable gzip compression
- Set up proper caching headers

### 7.2 Database Optimization
- Create composite indexes in Firestore
- Enable persistence for offline support
- Implement proper pagination

### 7.3 Monitoring Setup
- Set up Firebase Performance Monitoring
- Configure error tracking (Sentry)
- Enable analytics

## Step 8: Testing Deployment

### 8.1 Functionality Testing
- Test user registration/login
- Test document creation/editing
- Test real-time collaboration
- Test cursor tracking
- Test document sharing

### 8.2 Performance Testing
- Check page load times
- Test real-time latency
- Verify database query performance
- Test concurrent users

### 8.3 Security Testing
- Test authentication flows
- Verify permission systems
- Check input validation
- Test rate limiting

## Step 9: Maintenance

### 9.1 Monitoring
- Set up uptime monitoring
- Monitor database usage
- Track error rates
- Monitor real-time connection health

### 9.2 Backups
- Firebase automatically backs up data
- Set up additional backup strategies if needed
- Document recovery procedures

### 9.3 Updates
- Keep dependencies updated
- Monitor security advisories
- Plan for feature updates
- Maintain documentation

## Troubleshooting Common Issues

### 1. CORS Issues
```javascript
// In backend/server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### 2. WebSocket Connection Issues
- Check firewall settings
- Verify Socket.IO configuration
- Test with WebSocket fallbacks

### 3. Firebase Connection Issues
- Verify service account permissions
- Check Firebase project settings
- Validate environment variables

### 4. Real-time Sync Issues
- Check WebRTC STUN server configuration
- Verify Socket.IO room management
- Test with different network conditions

## Security Checklist

- [ ] JWT secret is strong and secure
- [ ] Firebase service account key is protected
- [ ] Environment variables are not exposed
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] HTTPS is enforced
- [ ] Database security rules are in place
- [ ] Error messages don't leak sensitive info
- [ ] Regular security audits are scheduled

## Cost Optimization

### Firebase Pricing
- Monitor Firestore read/write operations
- Use Firebase Usage dashboard
- Implement caching strategies
- Optimize query patterns

### Hosting Costs
- Use CDN for static assets
- Implement proper caching
- Monitor bandwidth usage
- Consider serverless functions for backend

This deployment guide provides a complete production-ready setup for the real-time collaborative document editor with proper security, performance, and monitoring configurations.