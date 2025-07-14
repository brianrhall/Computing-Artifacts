# Computing Artifacts Gallery Manager

A React-based web application for managing a gallery/museum of computing artifacts with comprehensive cataloging features and Firebase authentication.

## Features

### Authentication & Access Control
- **Email/Password Login**: Traditional authentication method
- **Google Sign-In**: Quick authentication with Google accounts
- **Role-Based Access**:
  - **Admin**: Full access to add, edit, and delete artifacts
  - **Visitor**: Read-only access to browse the collection
  - **Public**: Limited access with prompt to sign in

### Artifact Management
- Add, edit, and delete computing artifacts
- Comprehensive artifact information:
  - Basic details (name, manufacturer, model, year)
  - Category classification (12 categories including Mainframe, Personal Computer, etc.)
  - Operating system information
  - Physical condition assessment
  - Estimated value tracking
  - Acquisition details (date, donor)
  - Task management (status, priority)
  - Multiple image uploads

### Organization & Display
- **Display Groups**: Organize by computing era
- **Location Tracking**: Track physical display/storage locations
- **Search & Filter**: Real-time search across multiple fields
- **View Modes**: Switch between grid and list views
- **Responsive Design**: Works on desktop, tablet, and mobile

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/brianrhall/Computing-Artifacts.git
cd Computing-Artifacts
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Storage (optional, for image uploads)

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values

5. Run the development server:
```bash
npm start
```

### Firebase Setup

#### Authentication
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google

#### Firestore Database
1. Create a Firestore database
2. Create collections:
   - `users` - for user roles
   - `artifacts` - for artifact data

#### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Everyone can read artifacts
    match /artifacts/{document=**} {
      allow read: if true;
      // Only admins can write
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Setting Up Admin Users

1. Have users sign up normally
2. In Firestore, find their user document
3. Add/update the `role` field to `"admin"`

## Demo Credentials

The app includes mock authentication for testing:
- **Admin**: admin@gallery.com / admin123
- **Visitor**: visitor@gallery.com / visitor123

**Note**: These only work with mock authentication. For production, use Firebase authentication.

## Technologies Used

- **React** - UI framework
- **Firebase** - Authentication, database, and storage
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Brian R. Hall - Professor of Computer Science at Champlain College