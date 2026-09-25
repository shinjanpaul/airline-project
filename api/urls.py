from django.urls import path
from . import views
from . import views_chat

urlpatterns = [
    path('auth/login/', views.login_view),
    path('auth/register/', views.register_view),
    path('auth/logout/', views.logout_view),
    path('auth/me/', views.me_view),
    path('flights/', views.FlightListView.as_view()),
    path('flights/<int:pk>/', views.FlightDetailView.as_view()),
    path('reservations/', views.reservations_view),
    path('reservations/cancel/', views.cancel_ticket),
    path('reservations/all/', views.all_reservations),
    path('dashboard/', views.dashboard_stats),
    path('reports/', views.report_view),
    path('create-order/', views.create_razorpay_order),
    path('chat/', views_chat.chat_view),
]