import json
import requests
from google import genai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Listing
from apps.listings.serializers import ListingListSerializer

# ── Configure Gemini ──────────────────────────────────────────────
client = genai.Client(api_key=settings.GEMINI_API_KEY)

GOOGLE_PLACES_API_KEY = "AIzaSyD2_TRJQT5BdSgecCIcCmFihWXGUH5-BSw"


# ── Helper: Search Google Places ──────────────────────────────────
def search_google_places(query, place_type="lodging"):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": query,
        "type": place_type,
        "key": GOOGLE_PLACES_API_KEY,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        return data.get("results", [])[:10]
    except Exception as e:
        print("Google Places error:", e)
        return []


def get_place_details(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": (
            "name,rating,user_ratings_total,formatted_address,"
            "photos,reviews,price_level,url,website,geometry"
        ),
        "key": GOOGLE_PLACES_API_KEY,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        return data.get("result", {})
    except Exception as e:
        print("Places details error:", e)
        return {}


def get_photo_url(photo_reference, max_width=800):
    if not photo_reference:
        return None
    return (
        "https://maps.googleapis.com/maps/api/place/photo"
        "?maxwidth=" + str(max_width) +
        "&photo_reference=" + photo_reference +
        "&key=" + GOOGLE_PLACES_API_KEY
    )


def build_booking_url(place_name, destination):
    query = (place_name + " " + destination).replace(" ", "+")
    return "https://www.booking.com/search.html?ss=" + query


def build_agoda_url(place_name, destination):
    query = (place_name + " " + destination).replace(" ", "+")
    return "https://www.agoda.com/search?q=" + query


# ── Smart AI Search View ──────────────────────────────────────────
class SmartAISearchView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_query = request.data.get("query", "").strip()
        if not user_query:
            return Response({"error": "Query is required."}, status=400)

        # Step 1: Gemini extracts intent
        intent_prompt = (
            "Extract search intent from this travel query.\n"
            "Query: \"" + user_query + "\"\n\n"
            "Reply ONLY with JSON, no markdown, no backticks:\n"
            "{\n"
            "  \"search_query\": \"optimized Google Places search string\",\n"
            "  \"place_type\": \"lodging or restaurant or tourist_attraction\",\n"
            "  \"destination\": \"city or country name\",\n"
            "  \"travel_type\": \"hotel or flight or package\"\n"
            "}"
        )

        try:
            intent_resp = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=intent_prompt
            )
            intent_text = intent_resp.text.strip()
            intent_text = intent_text.replace("```json", "").replace("```", "").strip()
            intent      = json.loads(intent_text)
            search_query = intent.get("search_query", user_query)
            place_type   = intent.get("place_type", "lodging")
            destination  = intent.get("destination", "")
        except Exception:
            search_query = user_query
            place_type   = "lodging"
            destination  = ""

        # Step 2: Google Places search
        places = search_google_places(search_query, place_type)
        if not places:
            places = search_google_places(user_query)
        if not places:
            return Response({
                "message": "No results found. Try a different destination.",
                "results": [],
                "query_understood": search_query,
            })

        # Step 3: Build summary for Gemini
        places_text = ""
        for i, p in enumerate(places[:8]):
            places_text += (
                "INDEX:" + str(i) +
                " | Name:" + p.get("name", "") +
                " | Rating:" + str(p.get("rating", "N/A")) +
                " | Reviews:" + str(p.get("user_ratings_total", 0)) +
                " | Address:" + p.get("formatted_address", "") +
                " | Price Level:" + str(p.get("price_level", "N/A")) +
                "\n"
            )

        # Step 4: Gemini picks best 3
        ranking_prompt = (
            "You are SafeNest Travel AI. A user searched: \"" + user_query + "\"\n\n"
            "Available results:\n" + places_text + "\n"
            "Pick the best 3 results. Consider rating and reviews.\n\n"
            "Reply ONLY with JSON, no markdown:\n"
            "{\n"
            "  \"picks\": [0, 1, 2],\n"
            "  \"summary\": \"2-sentence friendly explanation\"\n"
            "}"
        )

        try:
            ranking_resp = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=ranking_prompt
            )
            ranking_text = ranking_resp.text.strip()
            ranking_text = ranking_text.replace("```json", "").replace("```", "").strip()
            ranking      = json.loads(ranking_text)
            top_indices  = ranking.get("picks", [0, 1, 2])[:3]
            ai_summary   = ranking.get("summary", "Here are the best matches for your search.")
        except Exception:
            top_indices = [0, 1, 2]
            ai_summary  = "Here are the top results for your search."

        # Step 5: Get details for top 3
        results = []
        for idx in top_indices:
            if idx >= len(places):
                continue
            place    = places[idx]
            place_id = place.get("place_id", "")
            details  = get_place_details(place_id) if place_id else {}

            photos    = place.get("photos") or details.get("photos", [])
            photo_url = get_photo_url(photos[0].get("photo_reference")) if photos else None

            raw_reviews = details.get("reviews", [])
            top_reviews = []
            for r in raw_reviews[:2]:
                top_reviews.append({
                    "author": r.get("author_name", "Guest"),
                    "rating": r.get("rating", 5),
                    "text":   r.get("text", "")[:200],
                    "time":   r.get("relative_time_description", ""),
                })

            name       = place.get("name", "")
            address    = place.get("formatted_address", "")
            maps_url   = details.get("url", (
                "https://www.google.com/maps/place/?q=place_id:" + place_id
                if place_id else "#"
            ))
            price_level = place.get("price_level") or details.get("price_level")
            price_label = {
                0: "Free",
                1: "Budget ($)",
                2: "Moderate ($$)",
                3: "Upscale ($$$)",
                4: "Luxury ($$$$)",
            }.get(price_level, "Price not listed")

            results.append({
                "place_id":      place_id,
                "name":          name,
                "address":       address,
                "rating":        place.get("rating"),
                "total_reviews": place.get("user_ratings_total", 0),
                "price_level":   price_level,
                "price_label":   price_label,
                "photo_url":     photo_url,
                "maps_url":      maps_url,
                "booking_url":   build_booking_url(name, destination),
                "agoda_url":     build_agoda_url(name, destination),
                "reviews":       top_reviews,
                "destination":   destination,
            })

        return Response({
            "message":          ai_summary,
            "results":          results,
            "query_understood": search_query,
            "total_found":      len(places),
        })


# ── AI Recommendations ────────────────────────────────────────────
class AIRecommendationsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get("message", "")
        if not user_message:
            return Response({"error": "Message is required."}, status=400)

        listings      = Listing.objects.filter(status="ACTIVE")[:5]
        listings_data = ListingListSerializer(listings, many=True).data
        listings_text = ""
        for l in listings_data:
            listings_text += (
                "ID:" + str(l["id"]) +
                " | Title:" + str(l["title"]) +
                " | Type:" + str(l["listing_type"]) +
                " | From:" + str(l["origin"]) +
                " | To:" + str(l["destination"]) +
                " | Price:$" + str(l["discounted_price"]) +
                " | Rating:" + str(l["rating"]) + "\n"
            )

        prompt = (
            "You are SafeNest Travel AI assistant.\n\n"
            "LISTINGS:\n" + listings_text +
            "\nUSER: " + user_message +
            "\n\nRecommend 1-3 listings, under 150 words. "
            "End with: RECOMMENDED_IDS: 1,2,3"
        )

        try:
            response    = client.models.generate_content(
                model="gemini-2.0-flash-lite", contents=prompt
            )
            ai_text     = response.text
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
                rec = Listing.objects.filter(id__in=recommended_ids, status="ACTIVE")
                recommended_listings = ListingListSerializer(rec, many=True).data

            return Response({
                "message": ai_text,
                "recommended_listings": recommended_listings,
            })
        except Exception as e:
            return Response({"error": "AI error: " + str(e)}, status=500)


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
            "You are SafeNest Travel AI, an expert travel assistant. "
            "You have deep knowledge about destinations worldwide.\n\n"
            "You can help with:\n"
            "- Destination guides and what to see/do\n"
            "- Best time to visit any country or city\n"
            "- Budget planning and cost estimates in USD\n"
            "- Visa requirements for Australian travellers\n"
            "- Packing tips for different climates\n"
            "- Local food and cuisine recommendations\n"
            "- Safety tips and travel warnings\n"
            "- Hotel area recommendations (which neighbourhood to stay in)\n"
            "- Cultural tips and etiquette\n"
            "- Flight tips (best airlines, how to find cheap flights)\n\n"
            "Previous conversation:\n" + history_text +
            "\nUser: " + user_message +
            "\n\nRules:\n"
            "1. Reply in a friendly, conversational tone\n"
            "2. Keep responses under 120 words\n"
            "3. Use relevant emojis to make it engaging\n"
            "4. Give specific, actionable advice\n"
            "5. If asked about booking, say 'Browse our listings above to find great deals!'\n"
            "6. If asked about flights specifically, give tips on finding cheap flights\n"
            "7. Always end with a follow-up question to keep conversation going"
        )

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt
            )
            return Response({"message": response.text, "role": "assistant"})
        except Exception as e:
            return Response({"error": "AI error: " + str(e)}, status=500)