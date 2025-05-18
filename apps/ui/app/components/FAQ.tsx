"use client"
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "What is Sketchy?",
    answer: "Sketchy is a virtual collaborative whiteboard that makes creating diagrams as easy as drawing on a napkin. It's perfect for brainstorming, wireframing, diagramming, and visual collaboration."
  },
  {
    question: "Do I need to install anything to use Sketchy?",
    answer: "No! Sketchy runs entirely in your web browser, so there's no need to download or install any software. Just visit our website and start drawing."
  },
  {
    question: "How does real-time collaboration work?",
    answer: "When you create a diagram, you can share a unique link with your team members. Anyone with the link can join your session and collaborate in real-time. You'll see each other's cursors and changes as they happen."
  },
  {
    question: "What export formats are supported?",
    answer: "The free plan supports PNG export. Our paid plans support additional formats including SVG, PDF, and more, allowing you to easily incorporate your diagrams into presentations, documents, and websites."
  },
  {
    question: "Can I use Sketchy offline?",
    answer: "Yes, Sketchy has offline support through Progressive Web App (PWA) technology. You can install it on your device and use it even without an internet connection. Your changes will sync once you're back online."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. All your diagrams are encrypted in transit and at rest. We implement industry-standard security practices to ensure your data remains private and secure."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently asked questions</h2>
          <p className="mt-4 text-xl text-gray-600">
            Everything you need to know about Sketchy. Can't find the answer you're looking for? 
            <a href="#contact" className="text-blue-500 hover:text-blue-600 ml-1">Contact us</a>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => toggleFAQ(index)}
                className="flex justify-between items-center w-full text-left focus:outline-none"
              >
                <h3 className="text-xl font-semibold text-gray-900">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <div 
                className={`mt-3 text-gray-600 transition-all duration-300 overflow-hidden ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;