# Kasi Listings App

A comprehensive township listing application for jobs, rentals, skills, business services, and paid advertisements. Built with Node.js/Express backend and React frontend.

## 🚀 Features

### Core Features
- **Rental Listings**: Post and browse rental properties
- **Job Listings**: Find and post job opportunities
- **Skills Marketplace**: Offer and hire local skills
- **Business Directory**: Business listings and services
- **Paid Advertisements**: Premium advertising system
- **User Authentication**: Secure login/registration
- **Messaging System**: In-app communication
- **Search & Filtering**: Advanced search capabilities
- **User Dashboard**: Personal management interface
- **Admin Panel**: Content moderation and management

### Technical Features
- **PWA Support**: Progressive Web App capabilities
- **Mobile Responsive**: Optimized for all devices
- **Real-time Messaging**: Socket.io integration
- **Payment Processing**: Stripe integration
- **Image Upload**: Cloudinary cloud storage
- **Email Notifications**: Nodemailer integration
- **Rate Limiting**: Security protection
- **JWT Authentication**: Secure token-based auth

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Socket.io** - Real-time communication
- **Cloudinary** - Image storage
- **Nodemailer** - Email service

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Query** - Data fetching
- **Framer Motion** - Animations
- **React Icons** - Icon library

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Smilo-dev2022/-kasi-listings-app-.git
   cd kasi-listings-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/kasi-listings
   JWT_SECRET=your-jwt-secret-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   CLIENT_URL=http://localhost:3000
   SESSION_SECRET=your-session-secret
   ```

4. **Start the server**
   ```bash
   npm run server
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd client && npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

### Full Stack Development

To run both backend and frontend simultaneously:
```bash
npm run dev
```

## 🗄️ Database Models

### User
- Authentication details
- Profile information
- Role-based permissions
- Subscription status

### Rental
- Property details
- Location information
- Pricing and availability
- Images and amenities

### Job
- Job description
- Requirements
- Salary information
- Application tracking

### Skill
- Skill category
- Service description
- Pricing
- Availability

### Business
- Business information
- Services offered
- Contact details
- Operating hours

### Advertisement
- Ad content
- Payment status
- Duration and targeting
- Analytics tracking

### Message/Conversation
- Real-time messaging
- Conversation management
- Message history

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Listings
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `POST /api/jobs/:id/apply` - Apply for job

### Skills
- `GET /api/skills` - Get all skills
- `POST /api/skills` - Create skill listing
- `POST /api/skills/:id/hire` - Hire skill

### Businesses
- `GET /api/businesses` - Get all businesses
- `POST /api/businesses` - Create business

### Advertisements
- `GET /api/advertisements` - Get all ads
- `POST /api/advertisements` - Create ad
- `PUT /api/advertisements/:id/paid` - Mark as paid

### Messaging
- `GET /api/messaging/conversations` - Get conversations
- `POST /api/messaging/conversations` - Create conversation
- `GET /api/messaging/conversations/:id/messages` - Get messages
- `POST /api/messaging/conversations/:id/messages` - Send message

### Search
- `POST /api/search` - Advanced search
- `GET /api/search/suggestions` - Search suggestions

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `PUT /api/admin/listings/:id/approve` - Approve listing
- `PUT /api/admin/advertisements/:id/approve` - Approve ad

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create Heroku app
2. Set environment variables
3. Deploy with Git:
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   git push heroku main
   ```

### Frontend Deployment (Netlify/Vercel)
1. Build the project:
   ```bash
   cd client && npm run build
   ```
2. Deploy the `build` folder to your hosting service

### Database Deployment (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Update `MONGODB_URI` in environment variables
3. Configure network access and security

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS configuration
- Helmet security headers
- Session management

## 📱 PWA Features

- Service worker for offline functionality
- App manifest for installability
- Push notifications (configurable)
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🔄 Updates

Stay updated with the latest features and improvements by:
- Following the repository
- Checking the releases page
- Reading the changelog

---

**Built with ❤️ for the Kasi community** 