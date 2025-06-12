export default function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">About Bizzart</h1>
        <p className="mb-4 text-lg text-gray-800 text-center">
          <strong>Bizzart</strong> is a handcrafted pottery shop dedicated to bringing unique, beautiful, and functional ceramic pieces to your home. Every item is made with love, care, and a passion for the art of pottery.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2 text-gray-900">Our Mission</h2>
        <p className="mb-4 text-gray-800">
          We believe in the beauty of handmade goods and the value of supporting local artisans. Our mission is to connect people with one-of-a-kind pottery that tells a story and adds warmth to any space.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2 text-gray-900">Meet the Artisans</h2>
        <p className="mb-4 text-gray-800">
          Our team of skilled artisans pours their creativity and expertise into every piece. From classic designs to modern styles, each item is crafted with attention to detail and a commitment to quality.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2 text-gray-900">Why Choose Bizzart?</h2>
        <ul className="list-disc pl-6 text-gray-800 mb-4">
          <li>Unique, handcrafted pottery you won't find anywhere else</li>
          <li>High-quality materials and glazes</li>
          <li>Support for local artists and sustainable practices</li>
          <li>Perfect gifts for loved ones or yourself</li>
        </ul>
        <p className="text-center text-gray-700 mt-8">
          Thank you for supporting our small business and for appreciating the art of pottery!
        </p>
      </div>
    </div>
  );
} 