
import  { useState } from 'react';
import swapiDB from '../services/swapiIndexedDB'; 

const ClearDatabaseButton = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearDB = async () => {
  
    if (window.confirm('Are you sure you want to clear ALL cached Star Wars data? This action cannot be undone and will require data to be re-fetched.')) {
      setIsLoading(true);
      setMessage('Attempting to clear database...');
      try {
        await swapiDB.clearAllData();
        setMessage('Successfully cleared all Star Wars data from local cache!');
     
        setTimeout(() => {
          window.location.reload();
        }, 500); 
      } catch (error) {
        setMessage(`Failed to clear database: ${error.message || 'Unknown error'}. Please check console.`);
        console.error('Error clearing IndexedDB:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md mb-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-3 text-red-800">Clear Cached Data</h3>
      <p className="mb-4 text-red-600">
        Clicking this button will permanently delete all Star Wars data stored in your browser's local IndexedDB.
        You will need to re-fetch the data next time you use the application.
      </p>
      <button
        onClick={handleClearDB}
        disabled={isLoading}
        className={`w-full px-4 py-2 rounded-lg text-white font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isLoading
            ? 'bg-red-300 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500'
        }`}
      >
        {isLoading ? 'Clearing...' : 'Clear All Cached Star Wars Data'}
      </button>
      {message && (
        <p className={`mt-3 text-sm font-medium ${message.includes('Success') ? 'text-green-700' : 'text-red-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ClearDatabaseButton;
