from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Listing(models.Model):
    """
    Represents a travel product — can be a package, hotel, or flight.
    Travel agents and admins create these. Customers browse and book them.
    """

    class ListingType(models.TextChoices):
        PACKAGE = "PACKAGE", "Travel Package"
        HOTEL   = "HOTEL",   "Hotel"
        FLIGHT  = "FLIGHT",  "Flight"

    class Status(models.TextChoices):
        ACTIVE   = "ACTIVE",   "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SOLDOUT  = "SOLDOUT",  "Sold Out"

    # ── Basic Info ────────────────────────────────────────────────
    title        = models.CharField(max_length=255)
    description  = models.TextField()
    listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices,
        default=ListingType.PACKAGE,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    # ── Location ──────────────────────────────────────────────────
    origin      = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    country     = models.CharField(max_length=100)
    city        = models.CharField(max_length=100)

    # ── Pricing ───────────────────────────────────────────────────
    price_per_person = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # ── Availability ──────────────────────────────────────────────
    available_seats = models.IntegerField(
        validators=[MinValueValidator(0)]
    )
    max_seats  = models.IntegerField(
        validators=[MinValueValidator(1)]
    )
    start_date = models.DateField()
    end_date   = models.DateField()

    # ── Details ───────────────────────────────────────────────────
    duration_days   = models.IntegerField(validators=[MinValueValidator(1)])
    includes_hotel  = models.BooleanField(default=False)
    includes_flight = models.BooleanField(default=False)
    includes_meals  = models.BooleanField(default=False)

    # ── Images ────────────────────────────────────────────────────
    image = models.ImageField(
        upload_to="listings/", blank=True, null=True
    )
    image_url = models.URLField(
        max_length=500, blank=True, null=True,
        help_text="Direct URL to listing image — paste any photo link here"
    )

    # ── Rating ────────────────────────────────────────────────────
    rating = models.DecimalField(
        max_digits=3, decimal_places=1,
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )

    # ── Who created it ────────────────────────────────────────────
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="listings",
    )

    # ── Timestamps ────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table         = "listings"
        ordering         = ["-created_at"]
        verbose_name     = "Listing"
        verbose_name_plural = "Listings"

    def __str__(self):
        return f"{self.title} ({self.listing_type}) - ${self.price_per_person}"

    # ── Computed properties ───────────────────────────────────────
    @property
    def discounted_price(self):
        """Final price after discount."""
        if self.discount_percent > 0:
            discount = self.price_per_person * (self.discount_percent / 100)
            return round(self.price_per_person - discount, 2)
        return self.price_per_person

    @property
    def is_available(self):
        """Check if seats are available."""
        return (
            self.available_seats > 0
            and self.status == self.Status.ACTIVE
        )

    @property
    def seats_booked(self):
        """How many seats have been booked."""
        return self.max_seats - self.available_seats