from django.urls import path
from . import views

urlpatterns = [
    # Public
    path("",           views.ListingListView.as_view(),   name="listing_list"),
    path("<int:pk>/",  views.ListingDetailView.as_view(), name="listing_detail"),

    # Admin / Travel Agent only
    path("create/",          views.ListingCreateView.as_view(), name="listing_create"),
    path("<int:pk>/manage/", views.ListingManageView.as_view(), name="listing_manage"),
]