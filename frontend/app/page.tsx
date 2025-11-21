"use client";
import { useState, ChangeEvent } from 'react';

export default function Home() {
  // --- CONFIGURATION START ---
  
  // 1. Set this to TRUE when testing on your computer.
  // 2. Set this to FALSE when you deploy to Vercel.
  const IS_LOCAL_DEV = false; 

  // When local, we use localhost:8080. When deployed, we use your Cloud Run URL.
  const API_URL = IS_LOCAL_DEV 
    ? "http://127.0.0.1:8080/upload" 
    : "https://my-python-uploader-147110456749.us-west3.run.app";

  // --- CONFIGURATION END ---

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [backendResponse, setBackendResponse] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setBackendResponse(""); 
      setIsError(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setBackendResponse("");
    setIsError(false);

    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      console.log(`Attempting to upload to: ${API_URL}`);
      
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        mode: 'cors',
      });

      // Check if the response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Backend did not return JSON. Did it crash or is the URL wrong?");
      }

      const data = await response.json();
      
      if (response.ok) {
        setBackendResponse(data.message);
        setIsError(false);
      } else {
        setBackendResponse("Error: " + (data.error || "Unknown error"));
        setIsError(true);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setIsError(true);

      // HELPFUL DEBUGGING LOGIC FOR THE USER
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const isTargetHttp = API_URL.startsWith('http://');
      
      if (isHttps && isTargetHttp) {
        setBackendResponse(
          "⚠️ SECURITY ERROR: You are running this frontend on HTTPS, but trying to connect to HTTP Localhost. Browsers block this. \n\nSOLUTION: Run 'npm run dev' locally on your machine."
        );
      } else {
        setBackendResponse(
          `Failed to connect to ${IS_LOCAL_DEV ? "Localhost" : "Cloud Run"}. Is your Python backend running on port 8080? Check your terminal.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-800 text-center">
          {IS_LOCAL_DEV ? "Local Testing Mode" : "Cloud Run Uploader"}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6 break-all">
          Target: {API_URL}
        </p>

        {/* Image Input */}
        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="mb-6 flex justify-center">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-64 rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedImage || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors
            ${!selectedImage || loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? "Sending..." : "Send to Backend"}
        </button>

        {/* Backend Message Display */}
        {backendResponse && (
          <div className={`mt-6 p-4 rounded-lg text-sm whitespace-pre-wrap ${isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            <p className="font-bold mb-1">{isError ? "Connection Error:" : "Response:"}</p>
            <p>{backendResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}