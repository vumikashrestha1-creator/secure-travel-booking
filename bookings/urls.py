# bookings/urls.py

from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    CancelBookingView,
    AllBookingsView,
    BookingDetailView,
)

urlpatterns = [
    path('create/',            CreateBookingView.as_view(),  name='booking-create'),
    path('my-bookings/',       MyBookingsView.as_view(),     name='my-bookings'),
    path('all/',               AllBookingsView.as_view(),    name='all-bookings'),
    path('<int:pk>/',          BookingDetailView.as_view(),  name='booking-detail'),
    path('<int:pk>/cancel/',   CancelBookingView.as_view(),  name='booking-cancel'),
]
