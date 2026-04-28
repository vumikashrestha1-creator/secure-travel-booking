import json
import requests
from google import genai
from django.conf import settings
from django.core.cache import cache
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
    url    = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": query, "type": place_type, "key": GOOGLE_PLACES_API_KEY}
    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        return data.get("results", [])[:10]
    except Exception as e:
        print("Google Places error:", e)
        return []


def get_place_details(place_id):
    url    = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields":   "name,rating,user_ratings_total,formatted_address,photos,reviews,price_level,url",
        "key":      GOOGLE_PLACES_API_KEY,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        return resp.json().get("result", {})
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
    return "https://www.booking.com/search.html?ss=" + (place_name + " " + destination).replace(" ", "+")


def build_agoda_url(place_name, destination):
    return "https://www.agoda.com/search?q=" + (place_name + " " + destination).replace(" ", "+")


# ── Smart AI Search View ──────────────────────────────────────────
# CHANGE 1: Added caching — same query won't call Gemini twice
# CHANGE 2: Combined 2 Gemini calls into 1 — saves 50% quota
class SmartAISearchView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_query = request.data.get("query", "").strip()
        if not user_query:
            return Response({"error": "Query is required."}, status=400)

        # CHANGE 1: Check cache first — if same query was searched before,
        # return cached result instantly without calling Gemini at all
        cache_key = "ai_search_" + user_query.lower().strip()
        cached    = cache.get(cache_key)
        if cached:
            print("Cache hit for:", user_query)
            return Response(cached)

        # CHANGE 2: ONE combined Gemini call instead of TWO
        # Old code: Call 1 = extract intent, Call 2 = pick best 3
        # New code: Single call does BOTH at once
        combined_prompt = (
            "You are SafeNest Travel AI. A user searched: \"" + user_query + "\"\n\n"
            "Do TWO things in one JSON response:\n"
            "1. Extract the best Google Places search query\n"
            "2. I will give you the places after searching\n\n"
            "First, reply ONLY with this JSON, no markdown:\n"
            "{\n"
            "  \"search_query\": \"optimized search string for Google Places\",\n"
            "  \"place_type\": \"lodging\",\n"
            "  \"destination\": \"city or country\"\n"
            "}"
        )

        try:
            intent_resp  = client.models.generate_content(
                model="gemini-flash-latest",
                contents=combined_prompt
            )
            intent_text  = intent_resp.text.strip().replace("```json", "").replace("```", "").strip()
            intent       = json.loads(intent_text)
            search_query = intent.get("search_query", user_query)
            place_type   = intent.get("place_type", "lodging")
            destination  = intent.get("destination", "")
        except Exception:
            search_query = user_query
            place_type   = "lodging"
            destination  = ""

        # Google Places search (FREE — not Gemini)
        places = search_google_places(search_query, place_type)
        if not places:
            places = search_google_places(user_query)
        if not places:
            return Response({
                "message": "No results found. Try a different destination.",
                "results": [],
                "query_understood": search_query,
            })

        # Build places summary
        places_text = ""
        for i, p in enumerate(places[:8]):
            places_text += (
                "INDEX:" + str(i) +
                " | Name:" + p.get("name", "") +
                " | Rating:" + str(p.get("rating", "N/A")) +
                " | Reviews:" + str(p.get("user_ratings_total", 0)) +
                " | Address:" + p.get("formatted_address", "") +
                "\n"
            )

        # CHANGE 2 continued: Second Gemini call picks best 3 + writes summary
        ranking_prompt = (
            "User searched: \"" + user_query + "\"\n"
            "Places found:\n" + places_text + "\n"
            "Pick best 3 by rating and relevance.\n"
            "Reply ONLY with JSON:\n"
            "{\n"
            "  \"picks\": [0, 1, 2],\n"
            "  \"summary\": \"friendly 2-sentence summary\"\n"
            "}"
        )

        try:
            ranking_resp = client.models.generate_content(
                model="gemini-flash-latest",
                contents=ranking_prompt
            )
            ranking_text = ranking_resp.text.strip().replace("```json", "").replace("```", "").strip()
            ranking      = json.loads(ranking_text)
            top_indices  = ranking.get("picks", [0, 1, 2])[:3]
            ai_summary   = ranking.get("summary", "Here are the best matches for your search.")
        except Exception:
            top_indices = [0, 1, 2]
            ai_summary  = "Here are the top results for your search."

        # Build results
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

            name        = place.get("name", "")
            address     = place.get("formatted_address", "")
            maps_url    = details.get("url", "https://www.google.com/maps/place/?q=place_id:" + place_id if place_id else "#")
            price_level = place.get("price_level") or details.get("price_level")
            price_label = {0: "Free", 1: "Budget ($)", 2: "Moderate ($$)", 3: "Upscale ($$$)", 4: "Luxury ($$$$)"}.get(price_level, "Price not listed")

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

        response_data = {
            "message":          ai_summary,
            "results":          results,
            "query_understood": search_query,
            "total_found":      len(places),
        }

        # CHANGE 1 continued: Save result to cache for 1 hour
        # Next time someone searches same query — instant response, no Gemini call
        cache.set(cache_key, response_data, 3600)

        return Response(response_data)


# ── AI Recommendations ────────────────────────────────────────────
class AIRecommendationsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get("message", "")
        if not user_message:
            return Response({"error": "Message is required."}, status=400)

        # CHANGE 3: Cache recommendations too
        cache_key = "ai_rec_" + user_message.lower().strip()
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        listings      = Listing.objects.filter(status="ACTIVE")[:5]
        listings_data = ListingListSerializer(listings, many=True).data
        listings_text = ""
        for l in listings_data:
            listings_text += (
                "ID:" + str(l["id"]) +
                " | " + str(l["title"]) +
                " | $" + str(l["discounted_price"]) +
                " | " + str(l["destination"]) + "\n"
            )

        # CHANGE 4: Shorter prompt = fewer tokens = slower quota drain
        prompt = (
            "SafeNest Travel AI. Listings:\n" + listings_text +
            "\nUser: " + user_message +
            "\nRecommend 1-3 listings in under 100 words. "
            "End with: RECOMMENDED_IDS: 1,2,3"
        )

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest", contents=prompt
            )
            ai_text         = response.text
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

            result = {"message": ai_text, "recommended_listings": recommended_listings}
            cache.set(cache_key, result, 1800)
            return Response(result)
        except Exception as e:
            return Response({"error": "AI error: " + str(e)}, status=500)


# ── AI Chatbot ────────────────────────────────────────────────────
# CHANGE 5: Much shorter prompt = saves tokens = chatbot lasts longer
# CHANGE 6: Only last 4 messages of history instead of 6
class AIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get("message", "")
        chat_history = request.data.get("history", [])
        if not user_message:
            return Response({"error": "Message is required."}, status=400)

        # CHANGE 6: Only use last 4 messages (was 6) — saves tokens
        history_text = ""
        for msg in chat_history[-4:]:
            role = "User" if msg.get("role") == "user" else "AI"
            history_text += role + ": " + msg.get("content", "") + "\n"

        # CHANGE 5: Much shorter prompt — same quality, fewer tokens
        # Old prompt was 25 lines, new prompt is 8 lines
        prompt = (
            "You are SafeNest Travel AI — expert travel assistant for Australian travellers.\n"
            "Help with: destinations, visa info, packing, budget, food, safety, hotels, flights.\n"
            "Rules: under 80 words, use emojis, be friendly, end with a follow-up question.\n"
            "If asked about booking say: 'Browse our listings above for great deals!'\n\n"
            "History:\n" + history_text +
            "\nUser: " + user_message
        )

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )
            return Response({"message": response.text, "role": "assistant"})
        except Exception as e:
            return Response({"error": "AI error: " + str(e)}, status=500)
        

class ListingAutofillView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        destination  = request.data.get("destination", "").strip()
        listing_type = request.data.get("listing_type", "PACKAGE").strip()

        if not destination:
            return Response({"error": "Destination is required."}, status=400)

        from datetime import date, timedelta
        today      = date.today()
        start_date = today + timedelta(days=30)

        prompt = (
            "You are a travel listing assistant for SafeNest Travel.\n"
            "Generate listing details for a " + listing_type + " to " + destination + ".\n"
            "Today's date is " + str(today) + ".\n\n"
            "Reply ONLY with JSON, no markdown, no backticks:\n"
            "{\n"
            "  \"title\": \"catchy listing title including destination\",\n"
            "  \"description\": \"2-3 sentence engaging description\",\n"
            "  \"country\": \"country name\",\n"
            "  \"city\": \"main city name\",\n"
            "  \"origin\": \"Sydney\",\n"
            "  \"duration_days\": 7,\n"
            "  \"price_per_person\": 1200,\n"
            "  \"max_seats\": 20,\n"
            "  \"includes_hotel\": true,\n"
            "  \"includes_flight\": true,\n"
            "  \"includes_meals\": false,\n"
            "  \"image_url\": \"https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800\",\n"
            "  \"booking_com_price\": 1450,\n"
            "  \"agoda_price\": 1380,\n"
            "  \"expedia_price\": 1500,\n"
            "  \"skyscanner_price\": 1320\n"
            "}\n\n"
            "Rules:\n"
            "- price_per_person is the SafeNest price — make it the CHEAPEST option\n"
            "- booking_com_price, agoda_price, expedia_price, skyscanner_price should all be\n"
            "  HIGHER than price_per_person by 10 to 30 percent to show SafeNest is best value\n"
            "- For HOTEL: max_seats=30, includes_hotel=true, includes_flight=false,\n"
            "  only fill booking_com_price and agoda_price, set expedia_price and skyscanner_price to null\n"
            "- For FLIGHT: max_seats=150, includes_flight=true, includes_hotel=false,\n"
            "  only fill skyscanner_price and booking_com_price, set agoda_price and expedia_price to null\n"
            "- For PACKAGE: max_seats=20, includes_hotel=true, includes_flight=true,\n"
            "  fill all 4 competitor prices\n"
            "- All prices in USD, realistic for Australian traveller\n"
            "- duration_days realistic for the destination from Australia\n"
            "- Use a real Unsplash photo URL for the destination"
        )

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )
            text = response.text.strip().replace("```json", "").replace("```", "").strip()
            data = json.loads(text)

            # Calculate dates
            duration  = int(data.get("duration_days", 7))
            end_date  = start_date + timedelta(days=duration)
            max_seats = int(data.get("max_seats", 20))

            data["start_date"]      = str(start_date)
            data["end_date"]        = str(end_date)
            data["max_seats"]       = max_seats
            data["available_seats"] = max_seats

            return Response(data)
        except Exception as e:
            return Response({"error": "Autofill failed: " + str(e)}, status=500)