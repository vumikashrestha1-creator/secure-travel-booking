from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """
    Used for displaying reviews to anyone.
    Shows reviewer name and rating details.
    """
    user_name    = serializers.CharField(
        source="user.full_name", read_only=True
    )
    user_email   = serializers.CharField(
        source="user.email", read_only=True
    )
    listing_title = serializers.CharField(
        source="listing.title", read_only=True
    )

    class Meta:
        model  = Review
        fields = [
            "id", "user", "user_name", "user_email",
            "listing", "listing_title",
            "rating", "title", "comment",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "user", "created_at", "updated_at"
        ]


class CreateReviewSerializer(serializers.ModelSerializer):
    """
    Used when a customer submits a new review.
    Validates rating range and prevents duplicates.
    """

    class Meta:
        model  = Review
        fields = ["listing", "rating", "title", "comment"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )
        return value

    def validate(self, attrs):
        user    = self.context["request"].user
        listing = attrs.get("listing")

        # Check for duplicate review
        if Review.objects.filter(
            user=user, listing=listing
        ).exists():
            raise serializers.ValidationError(
                {
                    "listing": (
                        "You have already reviewed this listing. "
                        "You can only submit one review per listing."
                    )
                }
            )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)