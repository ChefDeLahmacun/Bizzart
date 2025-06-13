import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gray-100">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Handcrafted Pottery
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Discover unique ceramic pieces made with love and care
          </p>
          <Link
            href="/products"
            className="bg-white text-black px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['Bowls', 'Vases', 'Plates'].map((category) => (
            <div
              key={category}
              className="relative h-64 rounded-lg overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-semibold text-white">{category}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
          <p className="text-lg text-gray-800 mb-8">
            Each piece in our collection is carefully handcrafted by skilled artisans,
            bringing together traditional techniques and modern design. We believe in
            creating pieces that are not just beautiful, but also functional and
            sustainable.
          </p>
          <Link
            href="/about"
            className="text-black border-2 border-black px-8 py-3 rounded-full text-lg font-semibold hover:bg-black hover:text-white transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>
    </main>
  );
}
