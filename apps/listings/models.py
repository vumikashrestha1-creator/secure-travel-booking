from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Listing(models.Model):
    """
    Represents a travel product — can be a package, hotel, or flight.
    Travel agents and admins create these.
    Customers browse and book them.
    """

    # ── Listing Type Choices ──────────────────────────────────────
    # Defines what kind of travel product this listing is
    class ListingType(models.TextChoices):
        PACKAGE = "PACKAGE", "Travel Package"   # Full holiday bundle
        HOTEL   = "HOTEL",   "Hotel"            # Hotel stay only
        FLIGHT  = "FLIGHT",  "Flight"           # Flight only

    # ── Status Choices ────────────────────────────────────────────
    # Controls whether listing is visible to customers
    class Status(models.TextChoices):
        ACTIVE   = "ACTIVE",   "Active"         # Live and bookable
        INACTIVE = "INACTIVE", "Inactive"       # Hidden from customers
        SOLDOUT  = "SOLDOUT",  "Sold Out"       # No more seats available
        PENDING  = "PENDING",  "Pending"        # Waiting for approval

    # ── Basic Information ─────────────────────────────────────────
    title = models.CharField(
        max_length=200,
        help_text="Eye-catching title for the listing"
    )
    description = models.TextField(
        help_text="Full description shown to customers"
    )
    listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices,
        default=ListingType.PACKAGE
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    # ── Location Details ──────────────────────────────────────────
    origin = models.CharField(
        max_length=100,
        help_text="Departure city (e.g. Sydney)"
    )
    destination = models.CharField(
        max_length=100,
        help_text="Destination name (e.g. Bali)"
    )
    country = models.CharField(
        max_length=100,
        help_text="Country of destination"
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        help_text="Main city of destination"
    )

    # ── Pricing ───────────────────────────────────────────────────
    price_per_person = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Original price per person in USD"
    )
    discount_percent = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Discount percentage (0-100)"
    )

    # ── Seats / Capacity ──────────────────────────────────────────
    available_seats = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of seats still available"
    )
    max_seats = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Maximum total seats for this listing"
    )

    # ── Dates ─────────────────────────────────────────────────────
    start_date = models.DateField(
        help_text="Trip start / check-in date"
    )
    end_date = models.DateField(
        help_text="Trip end / check-out date"
    )
    duration_days = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Total duration in days"
    )

    # ── What's Included ───────────────────────────────────────────
    includes_hotel  = models.BooleanField(default=False)
    includes_flight = models.BooleanField(default=False)
    includes_meals  = models.BooleanField(default=False)

    # ── Images ────────────────────────────────────────────────────
    image = models.ImageField(
        upload_to="listings/",
        blank=True,
        null=True,
        help_text="Upload an image file"
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Direct URL to listing image"
    )

    # ── Rating ────────────────────────────────────────────────────
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Average customer rating out of 5"
    )

    # ── External Booking URLs ─────────────────────────────────────
    # These are direct links to the SAME listing on other platforms
    # Admin enters them manually for exact match (otherwise we
    # generate a generic search URL on the frontend)
    booking_com_url = models.URLField(
        max_length=500, blank=True, null=True,
        help_text="Paste exact Booking.com URL for this listing"
    )
    agoda_url = models.URLField(
        max_length=500, blank=True, null=True,
        help_text="Paste exact Agoda URL for this listing"
    )
    skyscanner_url = models.URLField(
        max_length=500, blank=True, null=True,
        help_text="Paste exact Skyscanner URL for this listing"
    )
    expedia_url = models.URLField(
        max_length=500, blank=True, null=True,
        help_text="Paste exact Expedia URL for this listing"
    )

    # ── External Platform Prices (for comparison table) ───────────
    # NEW FIELDS - these power the price comparison feature on the
    # listing detail page. Admin enters competitor prices, frontend
    # shows them next to SafeNest price so customers can compare.
    # AI Autofill also fills these automatically when creating new listings.
    booking_com_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        help_text="Price shown on Booking.com (for comparison table)"
    )
    agoda_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        help_text="Price shown on Agoda (for comparison table)"
    )
    expedia_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        help_text="Price shown on Expedia (for comparison table)"
    )
    skyscanner_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        help_text="Price shown on Skyscanner (for comparison table)"
    )

    # ── Approval Workflow (for Manager approval feature) ──────────
    # Used when Travel Agent creates a listing — stays PENDING until
    # Manager or Admin approves it
    rejection_reason = models.TextField(
        blank=True,
        default="",
        help_text="Reason given if listing was rejected by Manager"
    )

    # ── Metadata ──────────────────────────────────────────────────
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_listings"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Listing"
        verbose_name_plural = "Listings"

    def __str__(self):
        return f"{self.title} ({self.listing_type})"

    # ── Computed Properties ───────────────────────────────────────
    # These are calculated on-the-fly, not stored in the database

    @property
    def discounted_price(self):
        """Return the actual price after applying discount."""
        if self.discount_percent > 0:
            discount = (self.price_per_person * self.discount_percent) / 100
            return round(self.price_per_person - discount, 2)
        return self.price_per_person

    @property
    def is_available(self):
        """True if listing is active and has available seats."""
        return (
            self.status == self.Status.ACTIVE
            and self.available_seats > 0
        )

    @property
    def seats_booked(self):
        """Number of seats that have been booked."""
        return self.max_seats - self.available_seats