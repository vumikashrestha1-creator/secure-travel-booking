from django.urls import path
from . import views

urlpatterns = [
    # Create a review
    path(
        "create/",
        views.CreateReviewView.as_view(),
        name="create_review"
    ),

    # Get all reviews for a specific listing
    path(
        "listing/<int:listing_id>/",
        views.ListingReviewsView.as_view(),
        name="listing_reviews"
    ),

    # Get my reviews
    path(
        "my-reviews/",
        views.MyReviewsView.as_view(),
        name="my_reviews"
    ),

    # Delete a review
    path(
        "<int:pk>/delete/",
        views.DeleteReviewView.as_view(),
        name="delete_review"
    ),

    # Admin: all reviews
    path(
        "admin/all/",
        views.AdminReviewListView.as_view(),
        name="admin_reviews"
    ),
]