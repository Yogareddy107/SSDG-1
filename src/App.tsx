import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { 
  Camera, Printer, Palette, Phone, MapPin, Instagram, MessageCircle, 
  Star, Quote, ArrowRight, Trash2, Plus, X, Lock, Check, Loader2, LogOut 
} from "lucide-react";
import { db } from "./firebase";
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, 
  serverTimestamp, query, orderBy 
} from "firebase/firestore";

import heroImg from "./assets/images/hero_photography_1779088821005.png";
import weddingImg from "./assets/images/traditional_wedding_capture_1779088877270.png";
import flexImg from "./assets/images/flex_printing_setup_1779088837437.png";
import graphicImg from "./assets/images/graphic_design_desk_1779088856851.png";

interface PortfolioItem {
  id: string;
  img: string;
  type: "image" | "video";
  category: string;
  createdAt: any;
}

interface Testimonial {
  id: string;
  text: string;
  author: string;
  role: string;
  rating: number;
  approved: boolean;
  createdAt: any;
}

const TESTIMONIALS = [
  { text: "The best photography studio in the region. Their attention to detail in our wedding photos was incredible.", author: "Suresh Kumar", role: "Wedding Client" },
  { text: "Quick and high-quality flex printing service. They handled our urgent shop banner request perfectly.", author: "Rajesh Reddy", role: "Business Owner" },
  { text: "Creative graphics that really made our brand stand out. Professional and easy to work with.", author: "Lakshmi Narayana", role: "Marketing Manager" },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const approvedTestimonials = testimonials.filter(t => t.approved);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  
  // Dashboard states
  const [newImg, setNewImg] = useState("");
  const [newType, setNewType] = useState<"image" | "video">("image");
  const [newCat, setNewCat] = useState("Photography");
  const [uploading, setUploading] = useState(false);

  // User testimonial form states
  const [userTestimonial, setUserTestimonial] = useState({ text: "", author: "", role: "" });
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  const galleryRef = useRef(null);
  const isGalleryInView = useInView(galleryRef, { amount: 0.1, margin: "0px 0px -200px 0px" });

  useEffect(() => {
    const q = query(collection(db, "portfolio"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
      setItems(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
      setTestimonials(docs);
    });
    return () => unsubscribe();
  }, []);

  // Slider effect
  useEffect(() => {
    if (approvedTestimonials.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % approvedTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [approvedTestimonials.length]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePinSubmit = () => {
    if (pin === "188199") {
      setIsAdmin(true);
      setShowPinModal(false);
      setIsDashboardOpen(true);
      setPin("");
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1000);
    }
  };

  const handleUpload = async () => {
    if (!newImg) return;
    setUploading(true);
    try {
      // Check size (Firestore limit is 1MB)
      const sizeInBytes = (newImg.length * 3) / 4;
      if (sizeInBytes > 1000000) {
        throw new Error(`${newType === 'video' ? 'Video' : 'Image'} is too large (must be under 1MB). Please use a shorter/smaller clip.`);
      }

      await addDoc(collection(db, "portfolio"), {
        img: newImg,
        type: newType,
        category: newCat,
        createdAt: serverTimestamp(),
      });
      setNewImg("");
      alert("Image uploaded successfully!");
    } catch (e: any) {
      console.error("Upload error:", e);
      alert(`Upload failed: ${e.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteDoc(doc(db, "portfolio", id));
      } catch (e: any) {
        console.error("Delete error:", e);
        alert(`Delete failed: ${e.message}`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      setNewType("video");
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("image/")) {
      setNewType("image");
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 1000;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
            setNewImg(compressedBase64);
          } else {
            setNewImg(reader.result as string);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const submitUserTestimonial = async () => {
    if (!userTestimonial.text || !userTestimonial.author) {
      alert("Please enter message and name");
      return;
    }
    setSubmittingTestimonial(true);
    try {
      await addDoc(collection(db, "testimonials"), {
        ...userTestimonial,
        rating: 5,
        approved: false, // Wait for admin approval
        createdAt: serverTimestamp(),
      });
      setUserTestimonial({ text: "", author: "", role: "" });
      alert("Testimonial submitted! It will appear once approved by admin.");
    } catch (e) {
      console.error(e);
      alert("Error submitting testimonial.");
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const approveTestimonial = async (id: string) => {
    try {
      await updateDoc(doc(db, "testimonials", id), { approved: true });
    } catch (e) {
      console.error(e);
      alert("Failed to approve.");
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (confirm("Delete this testimonial?")) {
      try {
        await deleteDoc(doc(db, "testimonials", id));
      } catch (e) {
        console.error(e);
        alert("Failed to delete.");
      }
    }
  };

  const filteredItems = filter === "All" 
    ? items 
    : items.filter(item => item.category === filter);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      <AnimatePresence>
        {loading && (
          <motion.div 
            key="loader"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center flex-col"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Spinning circular text */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <path 
                    id="circlePath" 
                    d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" 
                    fill="transparent" 
                  />
                  <text className="fill-orange-500 text-[3.8px] font-bold uppercase tracking-[2px]">
                    <textPath href="#circlePath">
                      Sri Siva Durga Photo Studio & Graphics Digital Flex Printing • 
                    </textPath>
                  </text>
                </svg>
              </motion.div>
              {/* Center Logo/Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <Camera className="w-12 h-12 text-white opacity-20" />
              </motion.div>
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-[10px] uppercase tracking-[0.5em] opacity-40 font-medium"
            >
              Loading Excellence
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 1 }}
      >
        {/* Sticky CTA */}
      <AnimatePresence>
        {isGalleryInView && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] md:bottom-12"
          >
            <a 
              href="#contact"
              className="group px-8 py-4 bg-white text-black text-[12px] font-bold uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-orange-500/20 flex items-center gap-3 hover:bg-orange-500 hover:text-white transition-all duration-500"
            >
              Work with us
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Navbar */}
      <nav id="navbar" className="fixed top-0 w-full z-50 px-6 py-8 flex justify-center items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-8 text-[11px] uppercase tracking-[0.2em] font-medium"
        >
          <a href="#services" className="hover:text-orange-500 transition-colors">Services</a>
          <a href="#gallery" className="hover:text-orange-500 transition-colors">Gallery</a>
          <a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex flex-col justify-center items-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Photography Studio" 
            className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 text-center"
        >
          <h1 className="text-[15vw] leading-[0.85] font-black uppercase tracking-tighter sm:text-[12vw]">
            Moments<br />
            <span className="text-orange-500 italic font-serif">Captured</span>
          </h1>
          <p className="mt-8 text-sm uppercase tracking-[0.3em] opacity-60 max-w-md mx-auto">
            Sri Siva Durga Photo Studio & Graphics Digital Flex Printing
          </p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <a 
              href="tel:8332883773"
              className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 z-10 animate-bounce"
        >
          <div className="w-[1px] h-12 bg-white/30 mx-auto" />
        </motion.div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { 
              title: "Photography", 
              desc: "Specialized in wedding, portrait, and commercial shoots with state-of-the-art equipment.",
              icon: <Camera className="w-8 h-8" />,
              img: weddingImg
            },
            { 
              title: "Flex Printing", 
              desc: "High-quality digital flex printing for banners, billboards, and promotional materials.",
              icon: <Printer className="w-8 h-8" />,
              img: flexImg
            },
            { 
              title: "Graphics Design", 
              desc: "Creative visual solutions for branding, social media, and business identity.",
              icon: <Palette className="w-8 h-8" />,
              img: graphicImg
            },
          ].map((service, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 group-hover:border-orange-500/50 transition-all duration-500">
                <img 
                  src={service.img} 
                  alt={service.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-40 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent group-hover:from-orange-950/80 transition-all duration-500">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="text-orange-500 mb-4 group-hover:scale-110 transition-transform"
                  >
                    {service.icon}
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-2 tracking-tight group-hover:text-orange-500 transition-colors">{service.title}</h3>
                  <p className="text-sm opacity-60 leading-relaxed group-hover:opacity-100 transition-opacity">{service.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery Highlight */}
      <section id="gallery" ref={galleryRef} className="bg-white text-black py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <h2 className="text-7xl font-bold tracking-tighter leading-none">
              WORKS <span className="block text-4xl font-normal italic font-serif">Portfolio Showcase</span>
            </h2>
            <div className="flex flex-wrap gap-4">
              {["All", "Photography", "Flex Prints", "Graphics Design"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold border rounded-full transition-all ${
                    filter === cat 
                    ? "bg-black text-white border-black" 
                    : "border-black/10 hover:border-black/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="columns-2 md:columns-3 gap-6 space-y-6 min-h-[600px]">
            <AnimatePresence mode="popLayout">
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  viewport={{ once: true }}
                  className="relative group overflow-hidden rounded-xl brightness-95 hover:brightness-100 transition-all cursor-pointer bg-black/5 shadow-xl"
                >
                  {item.type === 'video' ? (
                    <video 
                      src={item.img}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-auto group-hover:scale-110 transition-all duration-1000 ease-out"
                    />
                  ) : (
                    <img 
                      src={item.img} 
                      alt={item.category} 
                      className="w-full h-auto group-hover:scale-110 transition-all duration-1000 ease-out"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end pb-8">
                    <p className="text-white text-[9px] uppercase tracking-[0.4em] font-black translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {item.category}
                    </p>
                    <div className="w-8 h-[1px] bg-orange-500 mt-3 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center opacity-30 text-sm italic">
                  Portfolio is being updated. Check back soon.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-6 bg-[#0a0a0a] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm uppercase tracking-[0.4em] text-orange-500 mb-4 font-bold">Client Feedback</h2>
            <p className="text-5xl font-bold tracking-tighter italic font-serif">Kind words from users</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-stretch">
            {/* Slider */}
            <div className="relative min-h-[350px] md:h-[450px]">
              <AnimatePresence mode="wait">
                {approvedTestimonials.length > 0 ? (
                  <motion.div 
                    key={currentTestimonialIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 p-8 md:p-12 bg-zinc-900/40 border border-white/5 rounded-[32px] md:rounded-[40px] flex flex-col justify-center"
                  >
                    <div className="flex gap-1 mb-6 text-orange-500">
                      {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3 h-3 md:w-4 md:h-4 fill-current" />)}
                    </div>
                    <Quote className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 md:w-16 md:h-16 text-white/5" />
                    <p className="text-lg md:text-2xl opacity-90 leading-relaxed mb-8 md:mb-10 italic">"{approvedTestimonials[currentTestimonialIndex].text}"</p>
                    <div>
                      <p className="text-lg md:text-xl font-bold tracking-tight">{approvedTestimonials[currentTestimonialIndex].author}</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">{approvedTestimonials[currentTestimonialIndex].role || "Verified Client"}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-20 italic bg-zinc-900/20 border border-dashed border-white/10 rounded-[32px]">No testimonials yet. Be the first!</div>
                )}
              </AnimatePresence>
            </div>

            {/* Submission Form */}
            <div className="p-8 md:p-10 bg-zinc-900/80 border border-white/5 rounded-[32px] md:rounded-[40px] max-w-lg lg:max-w-none mx-auto w-full self-start lg:self-center">
              <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Share your experience</h3>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <textarea 
                    value={userTestimonial.text}
                    onChange={(e) => setUserTestimonial({...userTestimonial, text: e.target.value})}
                    placeholder="Your Message..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 text-sm focus:border-orange-500 outline-none min-h-[100px] md:min-h-[120px] resize-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text"
                    value={userTestimonial.author}
                    onChange={(e) => setUserTestimonial({...userTestimonial, author: e.target.value})}
                    placeholder="Your Name"
                    className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 text-sm focus:border-orange-500 outline-none transition-all"
                  />
                  <input 
                    type="text"
                    value={userTestimonial.role}
                    onChange={(e) => setUserTestimonial({...userTestimonial, role: e.target.value})}
                    placeholder="Subject (Optional)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 text-sm focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={submitUserTestimonial}
                  disabled={submittingTestimonial}
                  className="w-full py-3.5 md:py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-widest text-[10px] md:text-xs rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/10"
                >
                  {submittingTestimonial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submittingTestimonial ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div>
            <h2 className="text-5xl font-bold tracking-tighter mb-12">GET IN TOUCH</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <MapPin className="w-6 h-6 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Location</p>
                  <p className="text-xl font-medium">R.T.C. Road, Koilkuntla,<br />Andhra Pradesh 518134</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <Phone className="w-6 h-6 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Phone</p>
                  <p className="text-xl font-medium hover:text-orange-500 transition-colors">
                    <a href="tel:8332883773">83328 83773</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-12 rounded-3xl border border-white/5">
            <h3 className="text-2xl font-bold mb-8 italic font-serif">Visit our studio today for a professional experience.</h3>
            <div className="flex gap-6">
              <motion.a 
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                href="https://www.instagram.com/siva_durgaphotography/" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                href="https://wa.me/918332883773" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 text-center border-t border-white/5 relative bg-black/30">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] opacity-30">
            © {new Date().getFullYear()} Sri Siva Durga Photo Studio. All Rights Reserved.
          </p>
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] opacity-20 mt-4 leading-relaxed">
            Crafted with passion by <a href="https://intraspherelabs.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors underline decoration-orange-500/20 underline-offset-4">Intrasphere Labs</a>
          </p>
          
          <div className="mt-8 md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2">
            <button 
              onClick={() => isAdmin ? setIsDashboardOpen(true) : setShowPinModal(true)}
              className="p-4 text-white/10 hover:text-orange-500 transition-all flex items-center gap-2 group"
              title="Admin Login"
            >
              <Camera className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              <span className="text-[8px] uppercase tracking-[0.1em] md:hidden">Admin Access</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Pin Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-900 p-10 rounded-3xl border border-white/10 text-center"
            >
              <Lock className="w-10 h-10 text-orange-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-2">Admin Entry</h3>
              <p className="text-sm opacity-50 mb-8 uppercase tracking-widest">Enter Credentials</p>
              
              <div className={`relative mb-6 ${pinError ? 'animate-shake' : ''}`}>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN CODE"
                  className={`w-full bg-black/50 border ${pinError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-4 text-center tracking-[1em] text-xl focus:outline-none focus:border-orange-500 transition-all`}
                  onKeyUp={(e) => e.key === 'Enter' && handlePinSubmit()}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-all font-sans"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePinSubmit}
                  className="flex-1 py-4 bg-orange-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-orange-600 transition-all font-sans"
                >
                  Enter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Dashboard */}
      <AnimatePresence>
        {isDashboardOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[400] bg-[#050505] p-4 md:p-12 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 md:mb-20">
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Admin Console</h2>
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-orange-500 font-bold">Manage Studio Assets</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setIsAdmin(false);
                      setIsDashboardOpen(false);
                    }}
                    className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/5 hover:bg-red-500/20 text-red-500 transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-white/5 hover:border-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                  <button 
                    onClick={() => setIsDashboardOpen(false)}
                    className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
                {/* Upload Section */}
                <div className="lg:col-span-4 lg:sticky lg:top-12 h-fit">
                  <div className="p-8 md:p-10 bg-zinc-900/50 backdrop-blur-xl rounded-[32px] border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <Plus className="w-5 h-5 text-orange-500" />
                      Add New Content
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold px-1">Category</label>
                        <select 
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-orange-500 outline-none appearance-none transition-all"
                        >
                          <option>Photography</option>
                          <option>Flex Prints</option>
                          <option>Graphics Design</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold px-1">Media File</label>
                        <div className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-orange-500/50 transition-all group bg-black/20">
                          {newImg ? (
                            <>
                              {newType === 'video' ? (
                                <video src={newImg} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                              ) : (
                                <img src={newImg} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform">
                                <button 
                                  onClick={() => setNewImg("")}
                                  className="w-full py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <X className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-6">
                              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8 opacity-20" />
                              </div>
                              <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest leading-relaxed">
                                Upload Image or <br/> Video (Max 1MB)
                              </p>
                              <input 
                                type="file" 
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={handleUpload}
                        disabled={!newImg || uploading}
                        className={`w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all ${
                          !newImg || uploading 
                          ? 'bg-white/5 opacity-50 cursor-not-allowed text-white/20' 
                          : 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 active:scale-95'
                        }`}
                      >
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {uploading ? 'Processing File...' : 'Publish to Gallery'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Management Section */}
                <div className="lg:col-span-8 flex flex-col gap-16 md:gap-24">
                  {/* Portfolio Manager */}
                  <section>
                    <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-6">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">Gallery Assets</h3>
                        <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Live Portfolio Items</p>
                      </div>
                      <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black tracking-widest opacity-60">
                        {items.length} TOTAL
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {items.map((item) => (
                        <motion.div 
                          layout
                          key={item.id} 
                          className="relative aspect-[3/4] rounded-2xl overflow-hidden group bg-zinc-900 border border-white/5"
                        >
                          {item.type === 'video' ? (
                            <video src={item.img} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" autoPlay muted loop playsInline />
                          ) : (
                             <img src={item.img} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                          <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                            <span className="text-[9px] uppercase font-bold tracking-[0.2em] bg-orange-500 px-3 py-1 rounded-full self-start shadow-xl">
                              {item.category}
                            </span>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-2xl"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {items.length === 0 && (
                        <div className="col-span-full py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
                          <Camera className="w-8 h-8 mb-4" />
                          <p className="text-sm font-medium">Gallery is empty</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Testimonial Manager */}
                  <section>
                    <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-6">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">User Reviews</h3>
                        <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Manage Testimonials</p>
                      </div>
                      <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black tracking-widest opacity-60">
                        {testimonials.length} SUBMISSIONS
                      </span>
                    </div>

                    <div className="space-y-4">
                      {testimonials.map((t) => (
                        <div 
                          key={t.id} 
                          className={`p-6 md:p-8 rounded-[32px] border transition-all duration-500 ${
                            t.approved 
                            ? 'bg-zinc-900/40 border-white/5 hover:border-white/10' 
                            : 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40'
                          } flex flex-col md:flex-row justify-between items-start md:items-center gap-8`}
                        >
                          <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-xl font-bold tracking-tight">{t.author}</p>
                              {!t.approved && (
                                <span className="text-[9px] bg-orange-500 px-3 py-1 rounded-full uppercase font-black tracking-widest text-black animate-pulse shadow-lg shadow-orange-500/20">
                                  Pending Review
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-4 opacity-40 uppercase tracking-[0.2em] text-[10px] font-bold">
                              <span>Rating: {t.rating} Stars</span>
                              <span>•</span>
                              <span>{t.role || 'Digital Visionary'}</span>
                            </div>
                            <p className="text-lg opacity-80 italic leading-relaxed font-serif">"{t.text}"</p>
                          </div>
                          <div className="flex flex-row md:flex-col items-center gap-3 shrink-0 w-full md:w-auto">
                            {!t.approved && (
                              <button 
                                onClick={() => approveTestimonial(t.id)}
                                className="flex-1 md:w-full px-8 py-4 bg-green-500 hover:bg-green-600 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-green-500/10 active:scale-95"
                              >
                                Approve
                              </button>
                            )}
                            <button 
                              onClick={() => deleteTestimonial(t.id)}
                              className="p-4 md:p-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/10 hover:border-red-500"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {testimonials.length === 0 && (
                        <div className="py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
                          <Quote className="w-8 h-8 mb-4" />
                          <p className="text-sm font-medium">No reviews to moderate</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
