const ExternalBooking = ({ listing }) => {
  const dest = encodeURIComponent(listing.destination || "");
  const orig = encodeURIComponent(listing.origin || "");
  const city = encodeURIComponent(listing.city || "");
  const cin  = listing.start_date || "";
  const cout = listing.end_date || "";
  const type = listing.listing_type;

  const hotelButtons = [
    {
      href:  listing.booking_com_url || "https://www.booking.com/search.html?ss=" + dest + "&checkin=" + cin + "&checkout=" + cout,
      label: "🏨 Booking.com",
      cls:   "bg-blue-600 hover:bg-blue-700",
      exact: !!listing.booking_com_url,
    },
    {
      href:  listing.agoda_url || "https://www.agoda.com/search?city=" + city + "&checkIn=" + cin + "&checkOut=" + cout,
      label: "🌏 Agoda",
      cls:   "bg-red-500 hover:bg-red-600",
      exact: !!listing.agoda_url,
    },
    {
      href:  listing.expedia_url || "https://www.hotels.com/search.do?q-destination=" + dest,
      label: "🏩 Hotels.com",
      cls:   "bg-orange-500 hover:bg-orange-600",
      exact: !!listing.expedia_url,
    },
  ];

  const flightButtons = [
    {
      href:  listing.skyscanner_url || "https://www.skyscanner.com/transport/flights/" + orig + "/" + dest + "/",
      label: "✈️ Skyscanner",
      cls:   "bg-cyan-600 hover:bg-cyan-700",
      exact: !!listing.skyscanner_url,
    },
    {
      href:  listing.booking_com_url || "https://www.kayak.com/flights/" + orig + "-" + dest + "/" + cin + "/" + cout,
      label: "🛫 Kayak",
      cls:   "bg-orange-500 hover:bg-orange-600",
      exact: !!listing.booking_com_url,
    },
    {
      href:  "https://www.google.com/travel/flights?q=flights+from+" + orig + "+to+" + dest,
      label: "🔍 Google Flights",
      cls:   "bg-blue-500 hover:bg-blue-600",
      exact: false,
    },
  ];

  const packageButtons = [
    {
      href:  listing.expedia_url || "https://www.expedia.com/Hotel-Search?destination=" + dest + "&startDate=" + cin + "&endDate=" + cout,
      label: "🌴 Expedia",
      cls:   "bg-yellow-500 hover:bg-yellow-600",
      exact: !!listing.expedia_url,
    },
    {
      href:  listing.agoda_url || "https://www.tripadvisor.com/Search?q=" + dest,
      label: "🦉 TripAdvisor",
      cls:   "bg-green-600 hover:bg-green-700",
      exact: !!listing.agoda_url,
    },
    {
      href:  listing.booking_com_url || "https://www.viator.com/search/" + dest,
      label: "🎒 Viator",
      cls:   "bg-purple-600 hover:bg-purple-700",
      exact: !!listing.booking_com_url,
    },
  ];

  var buttons = packageButtons;
  if (type === "HOTEL")  { buttons = hotelButtons;  }
  if (type === "FLIGHT") { buttons = flightButtons; }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        🔗 Also available on
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Compare prices and book directly on these trusted platforms
      </p>
      <div className="flex flex-col gap-3">
        {buttons.map(function(btn) {
          return (
            <a
              key={btn.label}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              className={"w-full text-center text-white text-sm font-medium py-2.5 rounded-xl transition-colors " + btn.cls}
            >
              {btn.label}
              {btn.exact && (
                <span className="ml-2 text-xs bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full">
                  exact
                </span>
              )}
              <span className="ml-2 text-xs opacity-75">↗</span>
            </a>
          );
        })}
      </div>
      <p className="text-xs text-gray-300 mt-4 text-center">
        Opens external website in a new tab
      </p>
    </div>
  );
};

export default ExternalBooking;