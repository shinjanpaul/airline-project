from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    USER_TYPES = [
        ('passenger', 'Passenger'),
        ('flight_official', 'Flight Official'),
        ('ministry_official', 'Ministry Official'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='passenger')
    phone = models.CharField(max_length=15, blank=True)
    loyalty_points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} ({self.user_type})"


class Flight(models.Model):
    SEAT_TYPES = [
        ('economy', 'Economy'),
        ('business', 'Business'),
        ('first', 'First Class'),
        ('premium_economy', 'Premium Economy'),
    ]
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('boarding', 'Boarding'),
        ('in_flight', 'In Flight'),
        ('delayed', 'Delayed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    flight_number = models.CharField(max_length=10, unique=True)
    flight_name = models.CharField(max_length=100)
    origin = models.CharField(max_length=100)
    origin_code = models.CharField(max_length=5, default='XXX')
    destination = models.CharField(max_length=100)
    destination_code = models.CharField(max_length=5, default='YYY')
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    economy_seats = models.IntegerField(default=50)
    economy_available = models.IntegerField(default=50)
    economy_price = models.DecimalField(max_digits=10, decimal_places=2, default=3000.00)
    business_seats = models.IntegerField(default=20)
    business_available = models.IntegerField(default=20)
    business_price = models.DecimalField(max_digits=10, decimal_places=2, default=8000.00)
    first_seats = models.IntegerField(default=10)
    first_available = models.IntegerField(default=10)
    first_price = models.DecimalField(max_digits=10, decimal_places=2, default=15000.00)
    premium_economy_seats = models.IntegerField(default=20)
    premium_economy_available = models.IntegerField(default=20)
    premium_economy_price = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    seat_type = models.CharField(max_length=20, choices=SEAT_TYPES, default='economy')
    total_seats = models.IntegerField(default=100)
    available_seats = models.IntegerField(default=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    aircraft_type = models.CharField(max_length=100, default='Boeing 737')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

def __str__(self):
    return f"{self.flight_number} | {self.origin} -> {self.destination}"

    @property
    def waitlisted_count(self):
        return self.reservations.filter(status='waitlisted').count()

    @property
    def duration_minutes(self):
        delta = self.arrival_time - self.departure_time
        return int(delta.total_seconds() / 60)


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('waitlisted', 'Waitlisted'),
        ('completed', 'Completed'),
    ]
    ticket_number = models.CharField(max_length=20, unique=True)
    passenger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='reservations')
    reservation_date = models.DateTimeField(auto_now_add=True)
    seats_booked = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    credit_card_number = models.CharField(max_length=20, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seat_number = models.CharField(max_length=10, blank=True)
    seat_type = models.CharField(max_length=20, default='economy')
    travel_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Ticket {self.ticket_number} - {self.passenger.username}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            import random, string
            self.ticket_number = 'TKT' + ''.join(random.choices(string.digits, k=8))
        # Note: total_price is now set in the view to handle different seat types correctly
        # Do NOT override it here - it breaks business/first class pricing
        super().save(*args, **kwargs)
