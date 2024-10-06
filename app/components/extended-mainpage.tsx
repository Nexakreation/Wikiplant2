import React from 'react'

export default function Component() {
  return (
    <div className="min-h-screen bg-transparent text-green-400 p-8 mt-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <section className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-green-800 rounded-full p-2">
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Instant Plant Recognition</h2>
            <p className="text-green-300">
              Snap a photo or upload an image of any plant you encounter. Our app swiftly analyzes and identifies it for you. Explore up to 15 plant identifications per month with our free tier.
            </p>
          </div>
        </section>

        <section className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-green-800 rounded-full p-2">
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Extensive Botanical Database</h2>
            <p className="text-green-300">
              Access information on over 25,000 plant species from across the globe. Get common names, scientific classifications, and concise descriptions to satisfy your botanical curiosity.
            </p>
          </div>
        </section>

        <section className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-green-800 rounded-full p-2">
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Plant Health Assessment</h2>
            <p className="text-green-300">
              Worried about your plant&apos;s well-being? Our app can diagnose common plant ailments, from pest infestations to nutrient deficiencies. Get tailored care advice to keep your green friends thriving.
            </p>
          </div>
        </section>

        <section className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-green-800 rounded-full p-2">
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Advanced AI Technology</h2>
            <p className="text-green-300">
              Our app leverages state-of-the-art machine learning algorithms and neural networks for accurate plant identification. We continuously refine our models to improve recognition accuracy and expand our database.
            </p>
          </div>
        </section>

        <section className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-green-800 rounded-full p-2">
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Integration Options</h2>
            <p className="text-green-300">
              Are you developing a gardening app, agricultural tool, or environmental project? Our plant identification engine is available via API, allowing seamless integration into your own applications. Contact us to discuss custom solutions for your specific needs.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}