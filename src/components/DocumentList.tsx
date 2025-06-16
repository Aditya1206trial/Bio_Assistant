import React, { useEffect, useState } from "react";
import { File, Loader, X } from "lucide-react";

export const DocumentList = () => {
  const [documents, setDocuments] = useState<Array<{ name: string; id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/files");
        const data = await response.json();
        setDocuments(data.files);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Stored Documents
        </h2>
        <p className="text-gray-600">
          All documents currently available in the knowledge base
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {documents?.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  {doc.name}
                </span>
              </div>
              <button
                className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                onClick={() => console.log("Implement delete here")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
