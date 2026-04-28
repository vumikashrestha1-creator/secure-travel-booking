import json
from django.contrib import admin
from django.utils.html import format_html
from django.conf import settings
from .models import Listing


# ── Gemini autofill view (called via admin action) ────────────────
# This is a separate API endpoint the admin page calls via JavaScript
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
@require_POST
def ai_autofill_view(request):
    """
    Called by the admin form when admin clicks the AI Autofill button.
    Takes destination + listing_type and returns suggested field values.
    """
    try:
        data        = json.loads(request.body)
        destination = data.get("destination", "").strip()
        listing_type = data.get("listing_type", "PACKAGE").strip()

        if not destination:
            return JsonResponse({"error": "Destination is required."}, status=400)

        # ── Call Gemini AI ────────────────────────────────────────
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = (
            "You are a travel listing assistant for SafeNest Travel.\n"
            "Generate listing details for a travel " + listing_type.lower() + " to " + destination + ".\n\n"
            "Reply ONLY with JSON, no markdown, no backticks:\n"
            "{\n"
            "  \"title\": \"catchy listing title including destination\",\n"
            "  \"description\": \"2-3 sentence engaging description of this travel experience\",\n"
            "  \"country\": \"country name\",\n"
            "  \"city\": \"main city name\",\n"
            "  \"origin\": \"Sydney\",\n"
            "  \"duration_days\": 7,\n"
            "  \"price_per_person\": 1200,\n"
            "  \"includes_hotel\": true,\n"
            "  \"includes_flight\": true,\n"
            "  \"includes_meals\": false,\n"
            "  \"image_url\": \"https://images.unsplash.com/photo-... (relevant unsplash photo URL)\"\n"
            "}\n\n"
            "Rules:\n"
            "- Price should be realistic in USD for an Australian traveller\n"
            "- Duration should be realistic for the destination\n"
            "- For HOTEL type: includes_hotel=true, includes_flight=false\n"
            "- For FLIGHT type: includes_flight=true, includes_hotel=false\n"
            "- For PACKAGE type: includes_hotel=true, includes_flight=true\n"
            "- Use a real Unsplash photo URL relevant to the destination"
        )

        response  = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(text)

        return JsonResponse({"success": True, "data": data})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ── Register URL for the autofill view ───────────────────────────
# We add this URL inside the admin class below using get_urls()


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = [
        "title", "listing_type", "destination",
        "price_per_person", "available_seats", "status", "created_at"
    ]
    list_filter   = ["listing_type", "status", "country", "includes_hotel", "includes_flight"]
    search_fields = ["title", "destination", "country", "city"]
    ordering      = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]

    # ── Group fields neatly in the admin form ─────────────────────
    fieldsets = (
        ("✨ AI Autofill", {
            "description": "Type a destination below then click the AI Autofill button to automatically fill in the listing details.",
            "fields": (),  # No actual fields — the JS button lives in the custom template
        }),
        ("Basic Information", {
            "fields": ("title", "listing_type", "status", "description"),
        }),
        ("Location", {
            "fields": ("origin", "destination", "country", "city"),
        }),
        ("Pricing & Availability", {
            "fields": (
                "price_per_person", "discount_percent",
                "available_seats", "max_seats",
                "start_date", "end_date", "duration_days",
            ),
        }),
        ("What's Included", {
            "fields": ("includes_hotel", "includes_flight", "includes_meals"),
        }),
        ("Images", {
            "fields": ("image", "image_url"),
        }),
        ("External Booking URLs", {
            "fields": ("booking_com_url", "agoda_url", "skyscanner_url", "expedia_url"),
            "classes": ("collapse",),
        }),
        ("Rating & Meta", {
            "fields": ("rating", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    # ── Register the autofill API URL inside Django admin ─────────
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom = [
            path(
                "ai-autofill/",
                self.admin_site.admin_view(ai_autofill_view),
                name="listing_ai_autofill",
            ),
        ]
        return custom + urls

    # ── Inject AI autofill button + JS into the admin change form ──
    # This adds a floating green button at the top of the Add Listing page
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        extra_context = extra_context or {}

        # Only show autofill on the ADD page (not edit page)
        if not object_id:
            extra_context["show_autofill"] = True

        return super().changeform_view(request, object_id, form_url, extra_context)

    # ── Custom CSS + JS injected into admin head ──────────────────
    class Media:
        css = {}
        js  = ()  # JS is injected inline via the template below

    # ── Override save to attach JS to the form ────────────────────
    def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
        """
        Injects the AI autofill button and JavaScript directly into
        the Add Listing admin form. The button appears at the top of
        the form. When clicked it reads the destination field, calls
        the Gemini API endpoint, and fills in all form fields.
        """
        if add:
            # Build the autofill button HTML + JavaScript
            autofill_html = """
            <style>
                #ai-autofill-box {
                    background: linear-gradient(135deg, #0f6e56, #1a9e7a);
                    border-radius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                #ai-autofill-box h3 {
                    margin: 0 0 8px 0;
                    font-size: 16px;
                    font-weight: bold;
                }
                #ai-autofill-box p {
                    margin: 0 0 14px 0;
                    font-size: 13px;
                    opacity: 0.9;
                }
                #autofill-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #autofill-destination {
                    flex: 1;
                    min-width: 200px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: none;
                    font-size: 14px;
                    outline: none;
                    color: #333;
                }
                #autofill-type {
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: none;
                    font-size: 14px;
                    color: #333;
                    cursor: pointer;
                }
                #autofill-btn {
                    background: white;
                    color: #0f6e56;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                #autofill-btn:hover { background: #e8f5f0; transform: scale(1.02); }
                #autofill-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                #autofill-status {
                    font-size: 13px;
                    margin-top: 10px;
                    min-height: 18px;
                }
            </style>

            <div id="ai-autofill-box">
                <h3>✨ AI Autofill — Powered by Gemini</h3>
                <p>Type a destination and select listing type, then click Autofill. Gemini will automatically fill in the title, description, country, city, price and more.</p>
                <div id="autofill-row">
                    <input
                        type="text"
                        id="autofill-destination"
                        placeholder="e.g. Bali, Tokyo, Paris, Maldives..."
                    />
                    <select id="autofill-type">
                        <option value="PACKAGE">Package</option>
                        <option value="HOTEL">Hotel</option>
                        <option value="FLIGHT">Flight</option>
                    </select>
                    <button type="button" id="autofill-btn" onclick="runAutofill()">
                        ✨ Autofill with AI
                    </button>
                </div>
                <div id="autofill-status"></div>
            </div>

            <script>
            function getCookie(name) {
                let cookieValue = null;
                if (document.cookie && document.cookie !== '') {
                    const cookies = document.cookie.split(';');
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i].trim();
                        if (cookie.substring(0, name.length + 1) === (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }

            async function runAutofill() {
                const destination = document.getElementById('autofill-destination').value.trim();
                const listingType = document.getElementById('autofill-type').value;
                const btn         = document.getElementById('autofill-btn');
                const status      = document.getElementById('autofill-status');

                if (!destination) {
                    status.innerHTML = '<span style="color:#ffcccc;">⚠️ Please type a destination first.</span>';
                    return;
                }

                // Show loading state
                btn.disabled     = true;
                btn.textContent  = '⏳ Generating...';
                status.innerHTML = '<span style="opacity:0.8;">Gemini is generating listing details for ' + destination + '...</span>';

                try {
                    const response = await fetch('/admin/listings/listing/ai-autofill/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken'),
                        },
                        body: JSON.stringify({
                            destination:  destination,
                            listing_type: listingType,
                        }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        const d = result.data;

                        // Fill all the form fields automatically
                        setField('id_title',            d.title          || '');
                        setField('id_description',      d.description    || '');
                        setField('id_country',          d.country        || '');
                        setField('id_city',             d.city           || '');
                        setField('id_origin',           d.origin         || 'Sydney');
                        setField('id_destination',      destination);
                        setField('id_price_per_person', d.price_per_person || '');
                        setField('id_duration_days',    d.duration_days  || '7');
                        setField('id_image_url',        d.image_url      || '');

                        // Set listing type dropdown
                        const typeField = document.getElementById('id_listing_type');
                        if (typeField) typeField.value = listingType;

                        // Set checkboxes
                        setCheckbox('id_includes_hotel',  d.includes_hotel);
                        setCheckbox('id_includes_flight', d.includes_flight);
                        setCheckbox('id_includes_meals',  d.includes_meals);

                        status.innerHTML = '<span style="color:#aaffcc;">✅ Fields filled! Please review and adjust before saving.</span>';
                    } else {
                        status.innerHTML = '<span style="color:#ffcccc;">❌ Error: ' + (result.error || 'Unknown error') + '</span>';
                    }
                } catch (err) {
                    status.innerHTML = '<span style="color:#ffcccc;">❌ Failed to connect. Check if Django is running.</span>';
                } finally {
                    btn.disabled    = false;
                    btn.textContent = '✨ Autofill with AI';
                }
            }

            function setField(id, value) {
                const el = document.getElementById(id);
                if (el) el.value = value;
            }

            function setCheckbox(id, value) {
                const el = document.getElementById(id);
                if (el) el.checked = !!value;
            }
            </script>
            """

            # Inject the HTML into the admin form context
            context["autofill_html"] = autofill_html

            # Override the submit row to add our box above the form
            from django.utils.safestring import mark_safe
            context["autofill_html_safe"] = mark_safe(autofill_html)

        response = super().render_change_form(request, context, add, change, form_url, obj)

        # Inject autofill box directly into the response content
        if add and hasattr(response, 'content'):
            content = response.content.decode('utf-8')
            # Insert autofill box right after the opening <form> tag
            insert_after = '<div id="content-main">'
            if insert_after in content:
                content = content.replace(
                    insert_after,
                    insert_after + autofill_html,
                    1
                )
            response.content = content.encode('utf-8')

        return response