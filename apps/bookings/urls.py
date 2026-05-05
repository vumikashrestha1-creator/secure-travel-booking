from django.urls import path
from . import views

urlpatterns = [
    # Customer
    path("create/",              views.CreateBookingView.as_view(),    name="booking_create"),
    path("my-bookings/",         views.MyBookingsView.as_view(),       name="my_bookings"),
    path("<int:pk>/",            views.BookingDetailView.as_view(),    name="booking_detail"),
    path("<int:pk>/cancel/",     views.CancelBookingView.as_view(),    name="booking_cancel"),

    # Admin / Agent
	path("admin/create-for-user/", views.AdminCreateBookingView.as_view(), name="admin_create_booking"),
    path("admin/all/",           views.AdminBookingListView.as_view(), name="admin_booking_list"),
    path("admin/<int:pk>/update/",views.AdminUpdateBookingView.as_view(), name="admin_booking_update"),
]