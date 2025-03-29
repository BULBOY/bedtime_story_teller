// app/components/LoadingSpinner.js
export default function LoadingSpinner() {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-700"></div>
      </div>
    );
  }