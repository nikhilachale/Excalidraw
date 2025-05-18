import React from 'react';
import { Play, Pencil, Users, Share2 } from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">See Sketchy in action</h2>
          <p className="mt-4 text-xl text-gray-600">
            Watch how easy it is to create beautiful diagrams and collaborate in real-time.
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
          <img 
            src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg" 
            alt="Sketchy Demo Preview" 
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
            <button className="group bg-white/90 backdrop-blur-sm hover:bg-white p-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110">
              <Play className="h-12 w-12 text-blue-500 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto flex items-center justify-center bg-blue-100 rounded-full mb-4">
              <Pencil className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Draw Freely</h3>
            <p className="mt-2 text-gray-600">
              Use intuitive tools to sketch diagrams and ideas just like on paper — but better.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto flex items-center justify-center bg-blue-100 rounded-full mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Collaborate in Real Time</h3>
            <p className="mt-2 text-gray-600">
              Work with your team live. Everyone stays in sync, no matter where they are.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto flex items-center justify-center bg-blue-100 rounded-full mb-4">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Share Instantly</h3>
            <p className="mt-2 text-gray-600">
              Export your work or share a live link in seconds — it’s that simple.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
