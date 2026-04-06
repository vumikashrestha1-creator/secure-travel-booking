from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """
    Stores user reviews and ratings for listings.

    Key rules:
    - One user can only review each listing once
    - Rating must be between 1 and 5
    - Comment is optional but encouraged
    - Reviews are public — anyone can read them
    """

    # ── Relationships ─────────────────────────────────────────────
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    # ── Review Content ────────────────────────────────────────────
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    title   = models.CharField(max_length=100, blank=True, null=True)

    # ── Timestamps ────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        # Prevent duplicate reviews
        unique_together = ["user", "listing"]

    def __str__(self):
        return (
            f"{self.user.email} — {self.listing.title} "
            f"— {self.rating} stars"
        )