from rest_framework              import status, generics, filters
from rest_framework.response     import Response
from rest_framework.views        import APIView
from rest_framework.permissions  import IsAuthenticated, AllowAny

from django.db.models import Q

from .models       import Listing
from .serializers  import ListingSerializer, ListingListSerializer
from apps.users.permissions import IsAdminOrTravelAgent


# ── Public: Browse All Listings ───────────────────────────────────
class ListingListView(generics.ListAPIView):
    """
    Anyone can browse listings (no login required).
    Supports search and filtering via query parameters.
    """
    permission_classes = [AllowAny]
    serializer_class   = ListingListSerializer

    def get_queryset(self):
        queryset = Listing.objects.filter(status="ACTIVE")

        # ── Filters from query params ──────────────────────────────
        listing_type = self.request.query_params.get("type")
        destination  = self.request.query_params.get("destination")
        country      = self.request.query_params.get("country")
        min_price    = self.request.query_params.get("min_price")
        max_price    = self.request.query_params.get("max_price")
        start_date   = self.request.query_params.get("start_date")
        search       = self.request.query_params.get("search")
        available    = self.request.query_params.get("available")

        if listing_type:
            queryset = queryset.filter(listing_type=listing_type.upper())
        if destination:
            queryset = queryset.filter(destination__icontains=destination)
        if country:
            queryset = queryset.filter(country__icontains=country)
        if min_price:
            queryset = queryset.filter(price_per_person__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_person__lte=max_price)
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if available == "true":
            queryset = queryset.filter(available_seats__gt=0)

        # ── Search across multiple fields ──────────────────────────
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)       |
                Q(description__icontains=search) |
                Q(destination__icontains=search) |
                Q(country__icontains=search)     |
                Q(city__icontains=search)
            )

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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        serializer = ListingSerializer(listing, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Listing updated.", "listing": serializer.data}
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        listing = self.get_object(pk)
        if not listing:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Soft delete — just mark inactive
        listing.status = Listing.Status.INACTIVE
        listing.save()
        return Response(
            {"message": "Listing deactivated successfully."},
            status=status.HTTP_200_OK,
        )