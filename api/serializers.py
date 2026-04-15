from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Flight, Reservation

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user_type', 'phone', 'loyalty_points']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=UserProfile.USER_TYPES, default='passenger')
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'user_type', 'phone']

    def create(self, validated_data):
        user_type = validated_data.pop('user_type', 'passenger')
        phone = validated_data.pop('phone', '')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, user_type=user_type, phone=phone)
        return user

class FlightSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.ReadOnlyField()
    waitlisted_count = serializers.ReadOnlyField()
    class Meta:
        model = Flight
        fields = '__all__'

class ReservationSerializer(serializers.ModelSerializer):
    flight = FlightSerializer(read_only=True)
    flight_id = serializers.PrimaryKeyRelatedField(queryset=Flight.objects.all(), source='flight', write_only=True)
    passenger = UserSerializer(read_only=True)
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['ticket_number', 'passenger', 'total_price', 'reservation_date']

class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['flight', 'seats_booked', 'credit_card_number', 'bank_name', 'seat_number']
