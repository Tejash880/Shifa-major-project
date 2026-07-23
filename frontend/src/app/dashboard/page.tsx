"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Upload, LogOut, ImageIcon, Activity, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [protectedImage, setProtectedImage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setProtectedImage(null);
      setMetrics(null);
    }
  };

  const handleProtect = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    const token = localStorage.getItem("token");
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const response = await fetch("http://localhost:8000/api/protect", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        // Assume backend returns base64 protected image and metrics
        setProtectedImage(`data:image/jpeg;base64,${data.protected_image}`);
        setMetrics(data.metrics);
      } else {
        alert("Failed to protect image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-500" />
            <span className="font-bold text-xl">InvisiFace Dashboard</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {!protectedImage ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
            >
              {!preview ? (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-500 mb-4" />
                  <h3 className="text-xl font-medium mb-2">Upload your photo</h3>
                  <p className="text-gray-400 mb-6 text-sm">PNG, JPG up to 10MB</p>
                  <label className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full cursor-pointer transition-colors">
                    Browse Files
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <img src={preview} alt="Preview" className="max-h-96 rounded-xl object-contain mb-8 border border-white/10" />
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPreview(null)}
                      className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleProtect}
                      disabled={isProcessing}
                      className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>Protect Image</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-400">
                    <ImageIcon className="w-5 h-5" />
                    Original Image
                  </h3>
                  <img src={preview!} alt="Original" className="w-full rounded-xl" />
                </div>
                <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-500 text-xs font-bold px-3 py-1 rounded-bl-lg">PROTECTED</div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-purple-400">
                    <Shield className="w-5 h-5" />
                    Anonymized Image
                  </h3>
                  <img src={protectedImage} alt="Protected" className="w-full rounded-xl" />
                </div>
              </div>
              
              {metrics && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Protection Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <div className="text-sm text-gray-400 mb-1">Privacy Score</div>
                      <div className="text-2xl font-bold text-green-400">{metrics.privacy_score}%</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <div className="text-sm text-gray-400 mb-1">SSIM</div>
                      <div className="text-2xl font-bold">{metrics.ssim.toFixed(3)}</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <div className="text-sm text-gray-400 mb-1">PSNR</div>
                      <div className="text-2xl font-bold">{metrics.psnr.toFixed(1)} dB</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <div className="text-sm text-gray-400 mb-1">Cosine Sim.</div>
                      <div className="text-2xl font-bold text-red-400">{metrics.cosine_similarity.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => {
                    if (!protectedImage) return;
                    const a = document.createElement("a");
                    a.href = protectedImage;
                    a.download = "invisiface_protected.jpg";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-2 text-white"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
                <button 
                  onClick={() => {
                    setProtectedImage(null);
                    setPreview(null);
                    setSelectedFile(null);
                    setMetrics(null);
                  }}
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Protect Another Image
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
