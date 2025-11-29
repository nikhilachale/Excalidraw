import React from 'react';
import Image from 'next/image'; // Add this import

// Simple Star SVG component used by testimonials
const Star: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.945a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.371 2.447a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.371 2.447c-.785.57-1.84-.197-1.54-1.118l1.287-3.945a1 1 0 00-.364-1.118L2.641 9.372c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

const testimonials = [
  {
    quote: "Sketchy has completely transformed our remote brainstorming sessions. It's like we're all in the same room sketching together.",
    author: "Sarah Johnson",
    role: "Product Manager at Droplet",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    stars: 5
  },
  {
    quote: "I've tried every whiteboarding tool out there, and nothing comes close to the natural feel and collaboration features of Sketchy.",
    author: "Michael Chen",
    role: "UX Designer at Framestack",
    avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    stars: 5
  },
  {
    quote: "Our team's productivity skyrocketed after switching to Sketchy. The learning curve is practically non-existent.",
    author: "Alex Rivera",
    role: "Engineering Lead at TechFlow",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    stars: 5
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Loved by teams worldwide</h2>
          <p className="mt-4 text-xl text-gray-600">
            Join thousands of teams who have transformed their collaborative drawing experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center">
                <Image
                  src={testimonial.avatar} 
                  alt={testimonial.author} 
                  width={48} 
                  height={48}
                  className="rounded-full object-cover mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap justify-center gap-8 md:gap-12">
            {['Acme Inc.', 'Globex', 'Soylent', 'Initech', 'Umbrella'].map((company, index) => (
              <div key={index} className="text-xl font-bold text-gray-400">{company}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;