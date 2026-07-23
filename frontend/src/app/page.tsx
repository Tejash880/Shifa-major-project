"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, EyeOff, Lock, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-500" />
            <span className="font-bold text-xl tracking-tight">InvisiFace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-500 bg-clip-text text-transparent">
              Protect Your Digital Identity from AI
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              InvisiFace uses advanced adversarial machine learning to anonymize your face against facial recognition systems, while preserving natural visual quality.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-purple-600 rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-purple-500">
                <span className="mr-2">Start Protecting</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="container mx-auto mt-32 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<EyeOff className="w-8 h-8 text-purple-400" />}
            title="AI Evasion"
            description="Our advanced FGSM perturbations trick modern facial recognition models like FaceNet and RetinaFace."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8 text-purple-400" />}
            title="Privacy First"
            description="Your photos are processed locally or securely without being stored on our servers."
          />
          <FeatureCard 
            icon={<Lock className="w-8 h-8 text-purple-400" />}
            title="Visual Quality"
            description="Adversarial noise is added imperceptibly, preserving the human-readable quality of the image."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
    >
      <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
