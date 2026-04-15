#!/bin/bash
echo "🛫 Starting Shinjan Aero - Airline Reservation System"
echo "======================================================"

# Start Django backend
echo "🔧 Starting Django Backend on port 8000..."
cd "$(dirname "$0")"
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# Wait for Django to start
sleep 3

# Start Next.js frontend
echo "🎨 Starting Next.js Frontend on port 3000..."
cd frontend
npm run dev &
NEXT_PID=$!

echo ""
echo "✅ Both servers running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "Demo credentials:"
echo "   Admin:      admin / admin123"
echo "   Passenger:  passenger1 / pass123"
echo "   Official:   official1 / pass123"
echo ""
echo "Press Ctrl+C to stop all servers"
wait
