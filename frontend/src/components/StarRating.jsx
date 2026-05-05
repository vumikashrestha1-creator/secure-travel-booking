const StarRating = ({
  rating,
  maxStars = 5,
  size = "md",
  showNumber = true,
  interactive = false,
  onRate = null,
}) => {

  const sizes = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(maxStars)].map((_, i) => {
          const starValue = i + 1;
          const filled    = starValue <= Math.floor(rating);
          const half      = !filled && starValue - 0.5 <= rating;

          return (
            <span
              key={i}
              onClick={() => interactive && onRate && onRate(starValue)}
              className={`
                ${sizes[size]}
                ${interactive
                  ? "cursor-pointer hover:scale-110 transition-transform"
                  : ""
                }
                ${filled
                  ? "text-yellow-400"
                  : half
                  ? "text-yellow-300"
                  : "text-gray-300"
                }
              `}
            >
              ★
            </span>
          );
        })}
      </div>

      {showNumber && rating > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}

      {showNumber && rating === 0 && (
        <span className="text-sm text-gray-400 ml-1">
          No ratings yet
        </span>
      )}
    </div>
  );
};

export default StarRating;