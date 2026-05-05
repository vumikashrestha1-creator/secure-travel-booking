import StarRating from "./StarRating";

const ReviewCard = ({ review, onDelete, currentUserId }) => {

  const isOwner = currentUserId === review.user;

  const date = new Date(review.created_at).toLocaleDateString(
    "en-AU",
    {
      year:  "numeric",
      month: "long",
      day:   "numeric",
    }
  );

  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-teal-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };
    return labels[rating] || "";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">

      {/* Header row */}
      <div className="flex justify-between items-start mb-3">

        {/* User info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${getAvatarColor(review.user_name)}`}
          >
            {getInitial(review.user_name)}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {review.user_name}
            </p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>

        {/* Rating badge */}
        <div className="flex items-center gap-2 shrink-0">
          <StarRating
            rating={review.rating}
            size="sm"
            showNumber={false}
          />
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              review.rating >= 4
                ? "bg-green-50 text-green-700"
                : review.rating === 3
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {review.rating}/5
          </span>
        </div>
      </div>

      {/* Rating label */}
      <p className="text-xs text-teal-600 font-medium mb-2">
        {getRatingLabel(review.rating)}
      </p>

      {/* Review title */}
      {review.title && (
        <h4 className="font-semibold text-gray-800 text-sm mb-1">
          {review.title}
        </h4>
      )}

      {/* Review comment */}
      {review.comment && (
        <p className="text-gray-600 text-sm leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* No comment fallback */}
      {!review.comment && !review.title && (
        <p className="text-gray-400 text-sm italic">
          No written review provided.
        </p>
      )}

      {/* Delete button for owner */}
      {isOwner && onDelete && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => onDelete(review.id)}
            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
          >
            🗑️ Delete my review
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;