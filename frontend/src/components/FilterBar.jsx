const FilterBar = ({ filters, onFilterChange, onReset }) => {

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Filters</h3>
        <button
          onClick={onReset}
          className="text-teal-600 hover:text-teal-800 text-xs font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={filters.sort}
          onChange={(e) => handleChange("sort", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="cheapest">Cheapest First</option>
          <option value="expensive">Most Expensive</option>
          <option value="rating">Highest Rated</option>
          <option value="duration">Shortest Duration</option>
          <option value="seats">Most Available</option>
          <option value="discount">Biggest Discount</option>
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Package Type
        </label>
        <div className="space-y-2">
          {[
            { value: "ALL",     label: "All Types" },
            { value: "PACKAGE", label: "Packages"  },
            { value: "HOTEL",   label: "Hotels"    },
            { value: "FLIGHT",  label: "Flights"   },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={filters.type === value}
                onChange={(e) => handleChange("type", e.target.value)}
                className="accent-teal-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range (per person)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-400 mb-1">Min ($)</p>
            <input
              type="number"
              value={filters.min_price}
              onChange={(e) => handleChange("min_price", e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Max ($)</p>
            <input
              type="number"
              value={filters.max_price}
              onChange={(e) => handleChange("max_price", e.target.value)}
              placeholder="5000"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Quick price buttons */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: "Under $500",  max: "500"  },
            { label: "Under $1500", max: "1500" },
            { label: "Under $3000", max: "3000" },
          ].map(({ label, max }) => (
            <button
              key={label}
              onClick={() => {
                handleChange("min_price", "0");
                handleChange("max_price", max);
              }}
              className={
                "text-xs px-2 py-1 rounded-full border transition-colors " +
                (filters.max_price === max
                  ? "bg-teal-600 text-white border-teal-600"
                  : "border-gray-300 text-gray-600 hover:border-teal-400")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Rating
        </label>
        <div className="space-y-1">
          {[
            { value: "",    label: "Any Rating"        },
            { value: "3",   label: "3+ Stars"          },
            { value: "4",   label: "4+ Stars"          },
            { value: "4.5", label: "4.5+ Stars"        },
          ].map(({ value, label }) => (
            <label
              key={label}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="min_rating"
                value={value}
                checked={filters.min_rating === value}
                onChange={(e) =>
                  handleChange("min_rating", e.target.value)
                }
                className="accent-teal-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Duration
        </label>
        <select
          value={filters.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">Any Duration</option>
          <option value="1">1 Day</option>
          <option value="3">Up to 3 Days</option>
          <option value="7">Up to 7 Days</option>
          <option value="14">Up to 14 Days</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Travel From Date
        </label>
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => handleChange("start_date", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Available Only toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Available Only
          </p>
          <p className="text-xs text-gray-400">Hide fully booked</p>
        </div>
        <button
          onClick={() =>
            handleChange(
              "available",
              filters.available === "true" ? "" : "true"
            )
          }
          className={
            "relative w-12 h-6 rounded-full transition-colors " +
            (filters.available === "true" ? "bg-teal-600" : "bg-gray-300")
          }
        >
          <div
            className={
              "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform " +
              (filters.available === "true"
                ? "translate-x-7"
                : "translate-x-1")
            }
          />
        </button>
      </div>

      {/* Active filters */}
      {Object.entries(filters).some(
        ([key, val]) =>
          val !== "" &&
          val !== "ALL" &&
          val !== "newest" &&
          key !== "search"
      ) && (
        <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
          <p className="text-xs font-medium text-teal-700 mb-1">
            Active Filters:
          </p>
          <div className="flex flex-wrap gap-1">
            {filters.type !== "ALL" && filters.type && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                {filters.type}
              </span>
            )}
            {filters.min_price && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                Min ${filters.min_price}
              </span>
            )}
            {filters.max_price && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                Max ${filters.max_price}
              </span>
            )}
            {filters.min_rating && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                {filters.min_rating}+ stars
              </span>
            )}
            {filters.available === "true" && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                Available only
              </span>
            )}
            {filters.duration && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                Max {filters.duration} days
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;