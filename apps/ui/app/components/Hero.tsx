import React from 'react';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Create beautiful diagrams with a{' '}
              <span className="text-blue-500">hand-drawn feel</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Sketchy is a virtual collaborative whiteboard that makes creating diagrams as easy as drawing on a napkin.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Start Drawing Now
              </button>
              <a href="#how-it-works" className="group px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center">
                See how it works
                <ArrowRight className="ml-2 h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="mt-8 flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-blue-${i * 100} flex items-center justify-center text-white text-xs font-bold`}>
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-gray-600">
                <span className="font-medium">10,000+</span> users already drawing
              </p>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0">
            <div className="relative">
              <div className="absolute -top-6 -left-6 bg-blue-100 w-full h-full rounded-xl transform rotate-3"></div>
              <div className="absolute -bottom-6 -right-6 bg-blue-50 w-full h-full rounded-xl transform -rotate-3"></div>
              <div className="relative bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6956016/pexels-photo-6956016.jpeg" 
                  alt="Sketchy Interface Preview" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;