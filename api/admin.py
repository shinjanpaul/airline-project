from django.contrib import admin
from .models import Flight, Reservation, UserProfile

@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ['flight_number', 'origin_code', 'destination_code', 'departure_time', 'status', 'available_seats']
    list_filter = ['status', 'seat_type']
    search_fields = ['flight_number', 'origin', 'destination']

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'passenger', 'flight', 'status', 'reservation_date']
    list_filter = ['status']
    search_fields = ['ticket_number', 'passenger__username']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'user_type', 'phone', 'loyalty_points']
