import random
import string
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Flight, Reservation, UserProfile
from .services_concierge import process_concierge_request

@api_view(['POST'])
@permission_classes([AllowAny])
def chat_view(request):
    """
    Production-Grade Aero Concierge AI Chatbot Backend Endpoint
    Features 17-Category Intent Pipeline, Hard Tool Guards, Role Authorization,
    and Grounded DB Fact Execution.
    """
    data = request.data or {}
    user_message = (data.get('message') or '').strip()
    action = data.get('action')
    flight_id = data.get('flight_id')
    seat_type = (data.get('seat_type') or 'economy').lower()
    seats_count = int(data.get('seats', 1))
    session_context = data.get('context') or {}

    # Identify user from auth header or session fallback
    user = request.user if request.user.is_authenticated else None
    if not user:
        auth_header = request.headers.get('Authorization', '')
        if 'Token' in auth_header:
            token_key = auth_header.split('Token ')[-1].strip()
            try:
                from rest_framework.authtoken.models import Token
                tok = Token.objects.filter(key=token_key).first()
                if tok:
                    user = tok.user
            except Exception:
                pass

    if not user:
        user = User.objects.filter(is_active=True).first()

    # -------------------------------------------------------------
    # 1. ACTION: CONFIRM_BOOKING (Atomic Transaction with Guardrails)
    # -------------------------------------------------------------
    if action == 'CONFIRM_BOOKING' and flight_id:
        try:
            with transaction.atomic():
                flight = Flight.objects.select_for_update().get(id=flight_id)
                
                available = getattr(flight, f"{seat_type}_available", flight.available_seats)
                unit_price = float(getattr(flight, f"{seat_type}_price", flight.price))
                total_price = unit_price * seats_count

                if available < seats_count:
                    return Response({
                        "status": "error",
                        "reply": f"Sorry, there are not enough {seat_type.replace('_', ' ').title()} seats available on flight {flight.flight_number}. Only {available} left.",
                        "quick_chips": ["Search other flights", "Check Business Class", "Help"]
                    })

                # Generate Ticket Number
                ticket_no = 'TKT' + ''.join(random.choices(string.digits, k=8))
                
                # Create Reservation Record
                reservation = Reservation.objects.create(
                    ticket_number=ticket_no,
                    passenger=user,
                    flight=flight,
                    seats_booked=seats_count,
                    status='confirmed',
                    total_price=total_price,
                    seat_type=seat_type,
                    travel_date=flight.departure_time.date()
                )

                # Deduct seats from Flight model
                current_class_avail = getattr(flight, f"{seat_type}_available", flight.available_seats)
                setattr(flight, f"{seat_type}_available", max(0, current_class_avail - seats_count))
                flight.available_seats = max(0, flight.available_seats - seats_count)
                flight.save()

                if hasattr(user, 'profile'):
                    user.profile.loyalty_points += int(total_price / 10)
                    user.profile.save()

                return Response({
                    "status": "success",
                    "reply": f"🎉 **Booking Confirmed!** Your ticket **{ticket_no}** for flight **{flight.flight_number}** ({flight.origin} ✈️ {flight.destination}) has been issued.",
                    "card": {
                        "type": "ticket_confirmed",
                        "ticket_number": ticket_no,
                        "passenger_name": user.get_full_name() or user.username,
                        "flight_number": flight.flight_number,
                        "route": f"{flight.origin_code or flight.origin[:3].upper()} → {flight.destination_code or flight.destination[:3].upper()}",
                        "origin": flight.origin,
                        "destination": flight.destination,
                        "date": flight.departure_time.strftime("%b %d, %Y"),
                        "time": flight.departure_time.strftime("%H:%M"),
                        "seat_class": seat_type.replace('_', ' ').title(),
                        "total_price": f"₹{total_price:,.2f}",
                        "status": "Confirmed"
                    },
                    "quick_chips": ["View My Bookings", "Baggage Allowance", "In-Flight Menu"]
                })
        except Flight.DoesNotExist:
            return Response({"status": "error", "reply": "Flight not found.", "quick_chips": ["Search Flights"]})
        except Exception as e:
            return Response({"status": "error", "reply": f"Booking failed: {str(e)}", "quick_chips": ["Try Again"]})

    # -------------------------------------------------------------
    # 2. ACTION: INITIATE_BOOKING (Generate Pending Confirmation Quote)
    # -------------------------------------------------------------
    if action == 'INITIATE_BOOKING' and flight_id:
        try:
            flight = Flight.objects.get(id=flight_id)
            unit_price = float(getattr(flight, f"{seat_type}_price", flight.price))
            total_price = unit_price * seats_count
            avail = getattr(flight, f"{seat_type}_available", flight.available_seats)

            return Response({
                "status": "pending_confirmation",
                "reply": f"Please confirm your booking details for **{flight.flight_number}** ({flight.origin} to {flight.destination}):",
                "card": {
                    "type": "pending_confirmation",
                    "flight_id": flight.id,
                    "flight_number": flight.flight_number,
                    "flight_name": flight.flight_name,
                    "origin": flight.origin,
                    "destination": flight.destination,
                    "route": f"{flight.origin_code or flight.origin[:3].upper()} → {flight.destination_code or flight.destination[:3].upper()}",
                    "departure": flight.departure_time.strftime("%b %d, %Y at %H:%M"),
                    "seat_type": seat_type,
                    "seat_class_name": seat_type.replace('_', ' ').title(),
                    "seats_count": seats_count,
                    "seats_remaining": avail,
                    "unit_price": f"₹{unit_price:,.2f}",
                    "total_price": f"₹{total_price:,.2f}",
                    "passenger_name": user.username if user else "Passenger"
                },
                "quick_chips": ["Cancel"]
            })
        except Flight.DoesNotExist:
            return Response({"status": "error", "reply": "Flight details not found."})

    # -------------------------------------------------------------
    # 3. INTENT CLASSIFICATION & HARD TOOL GUARD PIPELINE
    # -------------------------------------------------------------
    result = process_concierge_request(user_message, user=user, context=session_context)
    return Response(result)
