import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  Calendar,
  Trophy,
  ArrowRight,
  Play,
} from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Find Local Activities",
      description:
        "Discover sports activities happening near you with location-based matching.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Connect with People",
      description:
        "Meet like-minded sports enthusiasts and build lasting friendships.",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Easy Scheduling",
      description:
        "Create and join activities with simple, intuitive scheduling tools.",
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "All Sports Welcome",
      description:
        "From running to tennis, cycling to walking - find your perfect activity.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Moovle
            </h1>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Sports Buddy
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with local sports enthusiasts, join activities, and discover
            new ways to stay active. Whether you're into running, cycling,
            tennis, or just walking - find your community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Play className="h-4 w-4" />
              Watch Demo
            </button>
          </div>

          {/* Quick Email Capture */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Join
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Join 1,000+ active sports enthusiasts
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to stay active
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Moovle makes it easy to find, join, and organize sports activities
              with people in your area.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get moving?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of people who have found their sports community on
            Moovle.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Start Your Journey
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-lg font-semibold text-white">Moovle</span>
          </div>
          <p>&copy; 2025 Moovle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
