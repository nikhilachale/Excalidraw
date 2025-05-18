import React from 'react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals and small projects",
    features: [
      "Up to 3 diagrams",
      "Basic shapes and tools",
      "PNG export",
      "24-hour collaboration sessions",
      "Community support"
    ],
    ctaText: "Get Started",
    ctaColor: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    popular: false
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "Everything you need for professional diagramming",
    features: [
      "Unlimited diagrams",
      "Advanced shapes library",
      "All export formats",
      "Persistent rooms",
      "Custom templates",
      "Priority support"
    ],
    ctaText: "Start Free Trial",
    ctaColor: "bg-blue-500 hover:bg-blue-600 text-white",
    popular: true
  },
  {
    name: "Team",
    price: "$49",
    period: "per month",
    description: "Enhanced collaboration for growing teams",
    features: [
      "Everything in Pro",
      "Team workspace",
      "Admin controls",
      "Advanced permissions",
      "SSO authentication",
      "Dedicated support",
      "Team onboarding"
    ],
    ctaText: "Contact Sales",
    ctaColor: "bg-gray-800 hover:bg-gray-900 text-white",
    popular: false
  }
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that's right for you and start creating beautiful diagrams today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`rounded-xl overflow-hidden border ${
                plan.popular ? 'border-blue-400 shadow-xl' : 'border-gray-200 shadow-md'
              } transition-all duration-300 hover:shadow-xl relative`}
            >
              {plan.popular && (
                <div className="bg-blue-500 text-white text-xs font-bold uppercase py-2 text-center">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.ctaColor}`}>
                  {plan.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600 max-w-3xl mx-auto">
            All plans include a 14-day trial. Need a custom plan for your enterprise? 
            <a href="#contact" className="text-blue-500 hover:text-blue-600 ml-1">Contact our sales team</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;