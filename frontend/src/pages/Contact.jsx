import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-teal-200 text-lg">
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-teal-900 mb-6">Get In Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl shrink-0">📍</div>
                <div>
                  <h3 className="font-bold text-gray-800">Address</h3>
                  <p className="text-gray-500 text-sm">Crown Institute of Higher Education<br />Canberra, Australia</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl shrink-0">📧</div>
                <div>
                  <h3 className="font-bold text-gray-800">Email</h3>
                  <p className="text-gray-500 text-sm">support@safenesttravel.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl shrink-0">📞</div>
                <div>
                  <h3 className="font-bold text-gray-800">Phone</h3>
                  <p className="text-gray-500 text-sm">+61 2 0000 0000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl shrink-0">🕐</div>
                <div>
                  <h3 className="font-bold text-gray-800">Support Hours</h3>
                  <p className="text-gray-500 text-sm">Monday - Friday: 9am - 5pm AEST<br />Weekend: 10am - 3pm AEST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-teal-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 mb-6">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="bg-teal-700 text-white px-6 py-2 rounded-xl hover:bg-teal-800 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-teal-900 mb-6">Send a Message</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this about?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Send Message 📨
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;