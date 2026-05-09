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

    # NEW — Edit listing fields (Travel Agent / Admin)
    path("<int:pk>/edit/",
        views.ListingEditView.as_view(),
        name="listing_edit"),

    # NEW — Manager/Admin approve a pending listing
    path("<int:pk>/approve/",
        views.ListingApproveView.as_view(),
        name="listing_approve"),

    # NEW — Manager/Admin reject a pending listing
    path("<int:pk>/reject/",
        views.ListingRejectView.as_view(),
        name="listing_reject"),

    # NEW — Get all pending listings for Manager tab
    path("pending/",
        views.ListingPendingView.as_view(),
        name="listing_pending"),
]