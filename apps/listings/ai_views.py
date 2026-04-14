from google import genai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Listing
from apps.listings.serializers import ListingListSerializer

# ── Configure Gemini ──────────────────────────────────────────────
client = genai.Client(api_key=settings.GEMINI_API_KEY)


# ── AI Recommendations ────────────────────────────────────────────
class AIRecommendationsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get("message", "")
        if not user_message:
            return Response({"error": "Message is required."}, status=400)

        listings = Listing.objects.filter(status="ACTIVE")[:5]
        listings_data = ListingListSerializer(listings, many=True).data

        listings_text = ""
        for l in listings_data:
            listings_text += (
                "ID:" + str(l["id"]) +
                " | Title:" + str(l["title"]) +
                " | Type:" + str(l["listing_type"]) +
                " | From:" + str(l["origin"]) +
                " | To:" + str(l["destination"]) +
                " | Country:" + str(l["country"]) +
                " | Price:$" + str(l["discounted_price"]) +
                " | Duration:" + str(l["duration_days"]) + " days" +
                " | Rating:" + str(l["rating"]) +
                " | Seats:" + str(l["available_seats"]) +
                "\n"
            )

        prompt = (
            "You are SafeNest Travel AI assistant. "
            "Help users find the best travel packages, hotels and flights "
            "from our listings below.\n\n"
            "AVAILABLE LISTINGS:\n" +
            listings_text +
            "\nUSER REQUEST: " + user_message +
            "\n\nINSTRUCTIONS:\n"
            "1. Recommend 1-3 listings that best match the user request\n"
            "2. Be friendly and conversational\n"
            "3. Mention title, price, destination and why it suits them\n"
            "4. Keep response under 150 words\n"
            "5. End with EXACTLY this on the last line:\n"
            "RECOMMENDED_IDS: 1,2,3"
        )

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt
            )
            ai_text = response.text

            recommended_ids = []
            if "RECOMMENDED_IDS:" in ai_text:
                ids_part = ai_text.split("RECOMMENDED_IDS:")[-1].strip()
                for id_str in ids_part.split(","):
                    try:
                        recommended_ids.append(int(id_str.strip()))
                    except ValueError:
                        pass
                ai_text = ai_text.split("RECOMMENDED_IDS:")[0].strip()

            recommended_listings = []
            if recommended_ids:
                rec = Listing.objects.filter(
                    id__in=recommended_ids, status="ACTIVE"
                )
                recommended_listings = ListingListSerializer(
                    rec, many=True
                ).data

            return Response({
                "message": ai_text,
                "recommended_listings": recommended_listings,
            })

        except Exception as e:
            return Response(
                {"error": "AI error: " + str(e)},
                status=500
            )


# ── AI Chatbot ────────────────────────────────────────────────────
class AIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get("message", "")
        chat_history = request.data.get("history", [])

        if not user_message:
            return Response({"error": "Message is required."}, status=400)

        history_text = ""
        for msg in chat_history[-6:]:
            role = "User" if msg.get("role") == "user" else "Assistant"
            history_text += role + ": " + msg.get("content", "") + "\n"

        prompt = (
            "You are SafeNest Travel AI, a friendly travel assistant. "
            "You help users with travel advice, destination tips, "
            "best time to visit, packing tips, visa info, "
            "local food and culture recommendations.\n\n"
            "Previous conversation:\n" +
            history_text +
            "\nUser: " + user_message +
            "\n\nReply friendly and helpfully. "
            "Keep response under 100 words. "
            "If asked about booking, suggest browsing our listings."
        )

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt
            )
            return Response({
                "message": response.text,
                "role": "assistant"
            })
        except Exception as e:
            return Response(
                {"error": "AI error: " + str(e)},
                status=500
            )