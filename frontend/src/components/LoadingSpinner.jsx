const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;