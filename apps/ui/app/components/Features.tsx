import React from 'react';
import { PenTool, Users, Zap, Globe, Lock, Palette } from 'lucide-react';

const features = [
  {
    icon: <PenTool className="h-8 w-8 text-blue-500" />,
    title: 'Hand-drawn Style',
    description: 'Create diagrams that look like they were drawn by hand, perfect for wireframes and brainstorming sessions.'
  },
  {
    icon: <Users className="h-8 w-8 text-blue-500" />,
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time. See changes as they happen and discuss ideas instantly.'
  },
  {
    icon: <Zap className="h-8 w-8 text-blue-500" />,
    title: 'Lightning Fast',
    description: 'Enjoy a smooth, responsive drawing experience with no lag, whether on desktop or mobile.'
  },
  {
    icon: <Globe className="h-8 w-8 text-blue-500" />,
    title: 'Works Everywhere',
    description: 'No download required. Works in your browser on any device with a modern web browser.'
  },
  {
    icon: <Lock className="h-8 w-8 text-blue-500" />,
    title: 'Private & Secure',
    description: 'Your data is encrypted and never shared without your permission. Take control of your privacy.'
  },
  {
    icon: <Palette className="h-8 w-8 text-blue-500" />,
    title: 'Customizable',
    description: 'Choose from various colors, line styles, and shapes to make your diagrams exactly how you want them.'
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Everything you need to bring your ideas to life</h2>
          <p className="mt-4 text-xl text-gray-600">
            Powerful features that make diagramming and whiteboarding simple, collaborative, and fun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-4 bg-blue-50 rounded-lg inline-block mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;