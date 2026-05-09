from rest_framework              import status, generics, filters
from rest_framework.response     import Response
from rest_framework.views        import APIView
from rest_framework.permissions  import IsAuthenticated, AllowAny
from django.db.models            import Q

from .models       import Listing
from .serializers  import ListingSerializer, ListingListSerializer
from apps.users.permissions import IsAdminOrTravelAgent, IsAdminOrManager

# ── Public: Browse All Listings ───────────────────────────────────
class ListingListView(generics.ListAPIView):
    """
    Anyone can browse listings.
    Supports advanced search, filtering and sorting.

    Query parameters:
    - search        → search title, description, destination
    - type          → PACKAGE / HOTEL / FLIGHT
    - min_price     → minimum price per person
    - max_price     → maximum price per person
    - min_rating    → minimum average rating
    - available     → true = only show listings with seats
    - start_date    → listings starting on or after this date
    - duration      → maximum duration in days
    - sort          → cheapest / expensive / rating / duration / seats
    """
    permission_classes = [AllowAny]
    serializer_class   = ListingListSerializer

    def get_queryset(self):
        queryset = Listing.objects.filter(status="ACTIVE")

        # ── Search ────────────────────────────────────────────────
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)       |
                Q(description__icontains=search) |
                Q(destination__icontains=search) |
                Q(country__icontains=search)     |
                Q(city__icontains=search)        |
                Q(origin__icontains=search)
            )

        # ── Type filter ───────────────────────────────────────────
        listing_type = self.request.query_params.get("type")
        if listing_type and listing_type != "ALL":
            queryset = queryset.filter(
                listing_type=listing_type.upper()
            )

        # ── Price filter ──────────────────────────────────────────
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(
                price_per_person__gte=min_price
            )
        if max_price:
            queryset = queryset.filter(
                price_per_person__lte=max_price
            )

        # ── Rating filter ─────────────────────────────────────────
        min_rating = self.request.query_params.get("min_rating")
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)

        # ── Availability filter ───────────────────────────────────
        available = self.request.query_params.get("available")
        if available == "true":
            queryset = queryset.filter(available_seats__gt=0)

        # ── Date filter ───────────────────────────────────────────
        start_date = self.request.query_params.get("start_date")
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)

        # ── Duration filter ───────────────────────────────────────
        max_duration = self.request.query_params.get("duration")
        if max_duration:
            queryset = queryset.filter(
                duration_days__lte=max_duration
            )

        # ── Country filter ────────────────────────────────────────
        country = self.request.query_params.get("country")
        if country:
            queryset = queryset.filter(country__icontains=country)

        # ── Sorting ───────────────────────────────────────────────
        sort = self.request.query_params.get("sort", "newest")

        if sort == "cheapest":
            queryset = queryset.order_by("price_per_person")
        elif sort == "expensive":
            queryset = queryset.order_by("-price_per_person")
        elif sort == "rating":
            queryset = queryset.order_by("-rating")
        elif sort == "duration":
            queryset = queryset.order_by("duration_days")
        elif sort == "seats":
            queryset = queryset.order_by("-available_seats")
        elif sort == "discount":
            queryset = queryset.order_by("-discount_percent")
        else:
            queryset = queryset.order_by("-created_at")

        return queryset


# ── Public: Single Listing Detail ─────────────────────────────────
class ListingDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ListingSerializer(listing)
        return Response(serializer.data)


# ── Admin/Agent: Create Listing ───────────────────────────────────
class ListingCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTravelAgent]

    def post(self, request):
        serializer = ListingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(
                {
                    "message": "Listing created successfully.",
                    "listing": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Admin/Agent: Update + Delete Listing ──────────────────────────
class ListingManageView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTravelAgent]

    def get_object(self, pk):
        try:
            return Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return None

    def put(self, request, pk):
        listing = self.get_object(pk)
        if not listing:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ListingSerializer(
            listing, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Listing updated.",
                    "listing": serializer.data
                }
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        listing = self.get_object(pk)
        if not listing:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        listing.status = Listing.Status.INACTIVE
        listing.save()
        return Response(
            {"message": "Listing deactivated successfully."},
            status=status.HTTP_200_OK,
        )
    
    # ── Public: Real Time Availability ───────────────────────────────
class ListingAvailabilityView(APIView):
    """
    Returns real time seat availability for a listing.
    Frontend uses this to show progress bar and urgency messages.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        seats_booked   = listing.max_seats - listing.available_seats
        percent_booked = round(
            (seats_booked / listing.max_seats) * 100
        ) if listing.max_seats > 0 else 0

        return Response({
            "listing_id":      listing.id,
            "title":           listing.title,
            "available_seats": listing.available_seats,
            "max_seats":       listing.max_seats,
            "seats_booked":    seats_booked,
            "status":          listing.status,
            "is_available":    listing.is_available,
            "percent_booked":  percent_booked,
        })
    

# ── Travel Agent / Admin: Edit listing fields ─────────────────────
class ListingEditView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTravelAgent]

    def patch(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response({"error": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == "TRAVEL_AGENT" and listing.created_by != request.user:
            return Response({"error": "You can only edit your own listings."}, status=status.HTTP_403_FORBIDDEN)

        allowed_fields = [
            "title", "description", "price_per_person", "discount_percent",
            "available_seats", "image_url",
            "includes_hotel", "includes_flight", "includes_meals",
        ]
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = ListingSerializer(listing, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Listing updated successfully.", "listing": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Manager / Admin: Approve a pending listing ────────────────────
class ListingApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response({"error": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)

        if listing.status != "PENDING":
            return Response({"error": "Only PENDING listings can be approved."}, status=status.HTTP_400_BAD_REQUEST)

        listing.status           = "ACTIVE"
        listing.rejection_reason = ""
        listing.save()
        return Response({"message": f'"{listing.title}" has been approved and is now live.'})


# ── Manager / Admin: Reject a pending listing ─────────────────────
class ListingRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response({"error": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "A rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        if listing.status != "PENDING":
            return Response({"error": "Only PENDING listings can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        listing.status           = "INACTIVE"
        listing.rejection_reason = reason
        listing.save()
        return Response({"message": f'"{listing.title}" has been rejected.', "reason": reason})


# ── Manager / Admin: Get all pending listings ─────────────────────
class ListingPendingView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        pending = Listing.objects.filter(status="PENDING").select_related("created_by")
        data    = ListingSerializer(pending, many=True).data
        return Response(data)