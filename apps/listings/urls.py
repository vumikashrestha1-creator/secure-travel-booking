from django.urls import path
from . import views

urlpatterns = [
    path("",
        views.ListingListView.as_view(),
        name="listing_list"),

    path("create/",
        views.ListingCreateView.as_view(),
        name="listing_create"),

    path("<int:pk>/",
        views.ListingDetailView.as_view(),
        name="listing_detail"),

    path("<int:pk>/manage/",
        views.ListingManageView.as_view(),
        name="listing_manage"),

    path("<int:pk>/availability/",
        views.ListingAvailabilityView.as_view(),
        name="listing_availability"),
]