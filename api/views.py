from rest_framework import generics, status, permissions
import razorpay
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum
from django.utils import timezone
import datetime
from .models import Flight, Reservation, UserProfile
from .serializers import *

# AUTH
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    print(f"DEBUG login: username='{username}'")
    user = authenticate(username=username, password=password)
    print(f"DEBUG login: user={user}")
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        profile = getattr(user, 'profile', None)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id, 'username': user.username,
                'email': user.email, 'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': profile.user_type if profile else 'passenger',
                'loyalty_points': profile.loyalty_points if profile else 0,
            }
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        profile = getattr(user, 'profile', None)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id, 'username': user.username,
                'email': user.email, 'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': profile.user_type if profile else 'passenger',
                'loyalty_points': 0,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logged out'})

@api_view(['GET'])
def me_view(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        'id': user.id, 'username': user.username,
        'email': user.email, 'first_name': user.first_name,
        'last_name': user.last_name,
        'user_type': profile.user_type if profile else 'passenger',
        'loyalty_points': profile.loyalty_points if profile else 0,
    })

def get_dynamic_availability(flight, date_obj):
    """Calculate real available seats per class for a specific date."""
    print(f"DEBUG get_dynamic: flight={flight.flight_number}, date_obj={date_obj}, type={type(date_obj)}")

    # Debug: print all reservations for this flight
    all_reservations = Reservation.objects.filter(flight=flight).values('ticket_number', 'seat_type', 'travel_date', 'status')
    print(f"DEBUG: All reservations for {flight.flight_number}: {list(all_reservations)}")

    bookings = Reservation.objects.filter(
        flight=flight,
        status__in=['confirmed', 'waitlisted'],
        travel_date=date_obj
    ).values('seat_type').annotate(total_booked=Sum('seats_booked'))
    print(f"DEBUG get_dynamic: SQL query bookings: {list(bookings)}")
    booking_counts = {b['seat_type']: b['total_booked'] for b in bookings}
    return {
        'economy_available': max(0, flight.economy_seats - booking_counts.get('economy', 0)),
        'economy_seats': flight.economy_seats,
        'economy_price': str(flight.economy_price),
        'business_available': max(0, flight.business_seats - booking_counts.get('business', 0)),
        'business_seats': flight.business_seats,
        'business_price': str(flight.business_price),
        'first_available': max(0, flight.first_seats - booking_counts.get('first', 0)),
        'first_seats': flight.first_seats,
        'first_price': str(flight.first_price),
        'premium_economy_available': max(0, flight.premium_economy_seats - booking_counts.get('premium_economy', 0)),
        'premium_economy_seats': flight.premium_economy_seats,
        'premium_economy_price': str(flight.premium_economy_price),
    }

# FLIGHTS
class FlightListView(generics.ListCreateAPIView):
    serializer_class = FlightSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Flight.objects.all().order_by('departure_time')
        origin = self.request.query_params.get('origin')
        destination = self.request.query_params.get('destination')
        # Removed seat_type filter - it was filtering by flight.seat_type which doesn't work for per-class availability
        fstatus = self.request.query_params.get('status')
        if origin:
            qs = qs.filter(Q(origin__icontains=origin) | Q(origin_code__icontains=origin))
        if destination:
            qs = qs.filter(Q(destination__icontains=destination) | Q(destination_code__icontains=destination))
        if fstatus:
            qs = qs.filter(status=fstatus)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        date_str = request.query_params.get('date')
        date_obj = None
        print(f"DEBUG: date_str from query params: '{date_str}'")
        if date_str:
            try:
                date_obj = datetime.date.fromisoformat(date_str)
                print(f"DEBUG: Parsed date_obj: {date_obj}, type: {type(date_obj)}")
            except ValueError:
                print(f"DEBUG: Failed to parse date: {date_str}")

        result = []
        for flight in queryset:
            data = FlightSerializer(flight).data
            if date_obj:
                avail = get_dynamic_availability(flight, date_obj)
                print(f"DEBUG: flight {flight.flight_number}, date {date_obj}, bookings: {avail}")
                data.update(avail)
                data['available_seats'] = (
                    avail['economy_available'] +
                    avail['business_available'] +
                    avail['first_available'] +
                    avail['premium_economy_available']
                )
            result.append(data)
        return Response(result)

    def create(self, request, *args, **kwargs):
        from rest_framework import status as http_status
        flight_number = request.data.get('flight_number')
        try:
            existing = Flight.objects.get(flight_number=flight_number)
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=http_status.HTTP_200_OK)
        except Flight.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=http_status.HTTP_201_CREATED)

class FlightDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer

# RESERVATIONS
@api_view(['GET', 'POST'])
def reservations_view(request):
    if request.method == 'GET':
        reservations = Reservation.objects.filter(passenger=request.user).order_by('-reservation_date')
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)

    flight_id = request.data.get('flight')
    seats = int(request.data.get('seats_booked', 1))
    seat_type = request.data.get('seat_type', 'economy').lower().strip()
    travel_date_str = request.data.get('travel_date')
    print(f"DEBUG backend: received travel_date_str: '{travel_date_str}'")

    if not travel_date_str:
        return Response({'error': 'Please provide a travel date'}, status=400)

    try:
        travel_date = datetime.date.fromisoformat(travel_date_str)
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

    try:
        flight = Flight.objects.get(pk=flight_id)
    except Flight.DoesNotExist:
        return Response({'error': 'Flight not found'}, status=404)

    price_field = f'{seat_type}_price'
    price = getattr(flight, price_field, flight.price)

    # Get real-time availability for this date
    avail = get_dynamic_availability(flight, travel_date)
    available = avail.get(f'{seat_type}_available', 0)

    if available >= seats:
        res = Reservation.objects.create(
            passenger=request.user, flight=flight,
            seats_booked=seats, status='confirmed',
            credit_card_number=request.data.get('credit_card_number', ''),
            bank_name=request.data.get('bank_name', ''),
            seat_number=request.data.get('seat_number', ''),
            seat_type=seat_type,
            travel_date=travel_date,
            total_price=price * seats
        )
        profile = getattr(request.user, 'profile', None)
        if profile:
            profile.loyalty_points += int(float(price) * seats // 100)
            profile.save()
        return Response(ReservationSerializer(res).data, status=201)
    elif available == 0:
        res = Reservation.objects.create(
            passenger=request.user, flight=flight,
            seats_booked=seats, status='waitlisted',
            credit_card_number=request.data.get('credit_card_number', ''),
            bank_name=request.data.get('bank_name', ''),
            seat_type=seat_type,
            travel_date=travel_date,
            total_price=price * seats
        )
        return Response({**ReservationSerializer(res).data, 'message': 'Added to waitlist'}, status=201)
    else:
        return Response({'error': f'Only {available} seats available in {seat_type} on {travel_date}'}, status=400)

@api_view(['POST'])
def cancel_ticket(request):
    ticket_number = request.data.get('ticket_number')
    credit_card = request.data.get('credit_card_number')
    bank_name = request.data.get('bank_name')
    try:
        res = Reservation.objects.get(
            ticket_number=ticket_number, passenger=request.user,
            credit_card_number=credit_card, bank_name=bank_name
        )
        if res.status == 'cancelled':
            return Response({'error': 'Already cancelled'}, status=400)
        res.status = 'cancelled'
        res.save()
        return Response({'message': f'Ticket {ticket_number} cancelled successfully'})
    except Reservation.DoesNotExist:
        return Response({'error': 'Ticket not found. Check your details.'}, status=404)

@api_view(['GET'])
def dashboard_stats(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    user_type = profile.user_type if profile else 'passenger'
    my_reservations = Reservation.objects.filter(passenger=user).order_by('-reservation_date')[:5]
    upcoming = Flight.objects.filter(status__in=['scheduled', 'boarding']).order_by('departure_time')[:6]
    stats = {
        'active_bookings': Reservation.objects.filter(passenger=user, status='confirmed').count(),
        'total_flights': Flight.objects.filter(status='scheduled').count(),
        'loyalty_points': profile.loyalty_points if profile else 0,
        'user_type': user_type,
    }
    if user_type in ['flight_official', 'ministry_official'] or user.is_staff:
        stats['total_reservations'] = Reservation.objects.filter(status='confirmed').count()
    return Response({
        'stats': stats,
        'my_reservations': ReservationSerializer(my_reservations, many=True).data,
        'upcoming_flights': FlightSerializer(upcoming, many=True).data,
    })

@api_view(['GET'])
def report_view(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    if not (user.is_staff or (profile and profile.user_type in ['flight_official', 'ministry_official'])):
        return Response({'error': 'Permission denied'}, status=403)
    report = Reservation.objects.filter(
        status__in=['confirmed', 'waitlisted']
    ).values(
        'flight__flight_number', 'flight__flight_name',
        'flight__origin', 'flight__destination',
        'flight__departure_time', 'flight__origin_code',
        'flight__destination_code'
    ).annotate(total_reservations=Count('id')).order_by('flight__departure_time')
    all_flights = Flight.objects.all().order_by('departure_time')
    total_revenue = Reservation.objects.filter(status='confirmed').aggregate(
        total=Sum('total_price'))['total'] or 0
    return Response({
        'report': list(report),
        'flight_stats': FlightSerializer(all_flights, many=True).data,
        'total_revenue': total_revenue,
        'total_passengers': Reservation.objects.filter(status='confirmed').count(),
        'active_flights': Flight.objects.filter(status__in=['scheduled', 'boarding', 'in_flight']).count(),
    })

@api_view(['GET'])
def all_reservations(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    if not (user.is_staff or (profile and profile.user_type in ['flight_official', 'ministry_official'])):
        return Response({'error': 'Permission denied'}, status=403)
    reservations = Reservation.objects.all().order_by('-reservation_date')
    return Response(ReservationSerializer(reservations, many=True).data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_razorpay_order(request):
    amount = request.data.get('amount')
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    order = client.order.create({
        'amount': int(amount),
        'currency': 'INR',
        'payment_capture': 1
    })
    return Response({'order_id': order['id']})