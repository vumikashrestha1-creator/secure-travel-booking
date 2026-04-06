from rest_framework             import status, generics
from rest_framework.response    import Response
from rest_framework.views       import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models           import Avg, Count

from .models       import Review
from .serializers  import ReviewSerializer, CreateReviewSerializer
from apps.listings.models import Listing
from apps.users.permissions import IsAdmin


# ── Create a Review ───────────────────────────────────────────────
class CreateReviewView(APIView):
    """
    Logged in customers can submit a review for any listing.
    One review per user per listing is enforced.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateReviewSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            review = serializer.save()

            # Update listing average rating automatically
            listing = review.listing
            avg = Review.objects.filter(
                listing=listing
            ).aggregate(Avg("rating"))["rating__avg"]

            listing.rating = round(avg, 1)
            listing.save(update_fields=["rating"])

            return Response(
                {
                    "message": "Review submitted successfully.",
                    "review":  ReviewSerializer(review).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Get Reviews for a Listing ─────────────────────────────────────
class ListingReviewsView(APIView):
    """
    Anyone can read reviews for a listing.
    Also returns average rating and review count.
    """
    permission_classes = [AllowAny]

    def get(self, request, listing_id):
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        reviews = Review.objects.filter(
            listing=listing
        ).select_related("user", "listing")

        # Calculate stats
        stats = reviews.aggregate(
            avg_rating=Avg("rating"),
            total_reviews=Count("id")
        )

        # Rating breakdown (how many 1 star, 2 star etc)
        breakdown = {}
        for i in range(1, 6):
            breakdown[f"{i}_star"] = reviews.filter(
                rating=i
            ).count()

        serializer = ReviewSerializer(reviews, many=True)

        return Response({
            "listing_id":    listing_id,
            "listing_title": listing.title,
            "avg_rating":    round(stats["avg_rating"] or 0, 1),
            "total_reviews": stats["total_reviews"],
            "rating_breakdown": breakdown,
            "reviews":       serializer.data,
        })


# ── Get My Reviews ────────────────────────────────────────────────
class MyReviewsView(generics.ListAPIView):
    """Returns all reviews written by the logged in user."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        ).select_related("listing", "user")


# ── Delete a Review ───────────────────────────────────────────────
class DeleteReviewView(APIView):
    """
    Users can delete their own reviews.
    Admins can delete any review.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            if request.user.role == "ADMIN":
                review = Review.objects.get(pk=pk)
            else:
                review = Review.objects.get(
                    pk=pk, user=request.user
                )
        except Review.DoesNotExist:
            return Response(
                {"error": "Review not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        listing = review.listing
        review.delete()

        # Recalculate average after deletion
        avg = Review.objects.filter(
            listing=listing
        ).aggregate(Avg("rating"))["rating__avg"]

        listing.rating = round(avg, 1) if avg else 0.0
        listing.save(update_fields=["rating"])

        return Response(
            {"message": "Review deleted successfully."},
            status=status.HTTP_200_OK
        )


# ── Admin: All Reviews ────────────────────────────────────────────
class AdminReviewListView(generics.ListAPIView):
    """Admin can see all reviews across all listings."""
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = ReviewSerializer
    queryset           = Review.objects.all().select_related(
        "user", "listing"
    )