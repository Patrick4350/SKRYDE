# SKRYDE - Student Rideshare Platform

SKRYDE is a student-exclusive rideshare platform that connects HBCU students for affordable, safe, peer-to-peer rides. Built with a focus on community, safety, and affordability.

## 🚗 Features

### Core MVP Features
- **Authentication & Verification**: Secure login/signup with JWT authentication and student-only verification via .edu email
- **Ride Posting & Requests**: Riders can create ride requests, drivers can post available rides
- **Peer-to-Peer Fare Bargaining**: Built-in chat/offer system for fare negotiation
- **Safety & Trust**: Verified-student tags, trip history, rating/review system (1-5 stars)
- **Dashboard & Metrics**: Rider and driver dashboards with summaries, admin dashboard for management
- **Payments (Simulation)**: Simulated payment via Stripe test mode with 80% driver / 20% platform split
- **Partnerships & Ads**: Placeholder section for campus ads and local businesses

### Key Features
- ✅ Student-only verification (.edu email validation)
- ✅ Role-based access (Rider, Driver, Admin)
- ✅ Real-time ride browsing and posting
- ✅ Fare negotiation system
- ✅ Rating and review system
- ✅ Admin panel with analytics
- ✅ Responsive design with campus-style UI
- ✅ Clean, modern interface with soft blue/purple palette

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS, Helmet, Morgan** for middleware

### Database
- **PostgreSQL** with Prisma ORM
- Models: User, Ride, RideRequest, Offer, Review, Ad

## 📁 Project Structure

```
SKRYDE/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Main server file
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/skryde_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=5000
   NODE_ENV="development"
   EMAIL_DOMAIN_WHITELIST="edu"
   PLATFORM_FEE_PERCENTAGE=20
   DRIVER_FEE_PERCENTAGE=80
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server**
   ```bash
   npm start
   ```

The frontend will be running on `http://localhost:3000`

## 📊 Database Schema

### User Model
- `id`: Unique identifier
- `email`: User email (must be .edu for auto-verification)
- `password`: Hashed password
- `name`: Full name
- `school`: School/university name
- `role`: RIDER, DRIVER, or ADMIN
- `verified`: Boolean verification status
- `rating`: Average rating (0-5)
- `vehicleInfo`: Driver's vehicle information
- `licensePlate`: Driver's license plate

### Ride Model
- `id`: Unique identifier
- `driverId`: Reference to driver user
- `origin`: Starting location
- `destination`: End location
- `departureTime`: Scheduled departure time
- `seats`: Available seats
- `fare`: Base fare amount
- `status`: ACTIVE, COMPLETED, or CANCELLED

### Offer Model
- `id`: Unique identifier
- `rideId`: Reference to ride
- `riderId`: Reference to rider user
- `amount`: Proposed fare amount
- `accepted`: Boolean acceptance status

### Review Model
- `id`: Unique identifier
- `reviewerId`: User giving the review
- `reviewedId`: User being reviewed
- `rating`: 1-5 star rating
- `comment`: Optional review text

## 🔐 Authentication

The app uses JWT-based authentication with the following features:
- Secure password hashing with bcryptjs
- JWT tokens with configurable expiration
- Role-based access control (RIDER, DRIVER, ADMIN)
- Student verification via .edu email domains
- Protected routes and API endpoints

## 🎨 UI/UX Design

- **Color Palette**: Soft blue/purple theme with accent colors
- **Typography**: Inter font family for clean, modern look
- **Components**: Reusable, accessible components
- **Responsive**: Mobile-first design approach
- **Icons**: Lucide React icon library
- **Notifications**: Toast notifications for user feedback

## 📈 Business Model

- **Ride Transaction Fee**: $5 average / 80% margin
- **Campus Subscriptions**: $25/month/student
- **Ads & Partnerships**: $10/slot

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Rides
- `GET /api/rides` - Get all active rides
- `GET /api/rides/:id` - Get specific ride
- `POST /api/rides` - Create new ride (drivers only)
- `PUT /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Delete ride

### Offers
- `GET /api/offers/ride/:rideId` - Get offers for a ride
- `POST /api/offers` - Create offer
- `PUT /api/offers/:id/accept` - Accept offer
- `PUT /api/offers/:id/reject` - Reject offer

### Reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin
- `GET /api/admin/dashboard` - Get dashboard analytics
- `GET /api/admin/metrics` - Get business metrics
- `GET /api/admin/ads` - Get all ads
- `POST /api/admin/ads` - Create ad

## 🚀 Deployment

### Backend Deployment (Railway/Supabase)
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy with Railway or similar platform
4. Run database migrations

### Frontend Deployment (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- Real-time chat for ride coordination
- Map integration for route visualization
- Push notifications for ride updates
- Mobile app development
- Integration with campus systems
- Advanced analytics and reporting
- Multi-campus support
- Emergency contact integration

## 📞 Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for students by students**
