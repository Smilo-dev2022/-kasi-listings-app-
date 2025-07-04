#!/bin/bash

# Kasi Listings App Deployment Script

echo "🚀 Starting deployment process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi
cd ..

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env file not found"
    echo "Please create a .env file in the server directory with the following variables:"
    echo ""
    echo "NODE_ENV=development"
    echo "PORT=5000"
    echo "MONGODB_URI=mongodb://localhost:27017/kasi-listings"
    echo "JWT_SECRET=your-jwt-secret-key"
    echo "STRIPE_SECRET_KEY=your-stripe-secret-key"
    echo "CLOUDINARY_CLOUD_NAME=your-cloudinary-name"
    echo "CLOUDINARY_API_KEY=your-cloudinary-api-key"
    echo "CLOUDINARY_API_SECRET=your-cloudinary-api-secret"
    echo "EMAIL_USER=your-email@gmail.com"
    echo "EMAIL_PASS=your-email-password"
    echo "CLIENT_URL=http://localhost:3000"
    echo ""
    echo "Continue with deployment? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Continuing deployment..."
    else
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Start the application
echo "🚀 Starting the application..."
echo ""
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "To start the application, run:"
echo "npm run dev"
echo ""
echo "Or start them separately:"
echo "Backend: npm run server"
echo "Frontend: cd client && npm start"
echo ""
echo "✅ Deployment setup complete!" 