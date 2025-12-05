import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const NewsCard = ({ title, date, content, image }) => {
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative h-[500px] w-full rounded-xl bg-gray-900 border border-cyan-500/30 overflow-hidden group cursor-pointer"
        >
            {/* Holographic Overlay Effect */}
            <div
                style={{
                    transform: "translateZ(75px)",
                    transformStyle: "preserve-3d",
                }}
                className="absolute inset-4 rounded-xl border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] z-10 pointer-events-none"
            ></div>

            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${image})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
            </div>

            {/* Content */}
            <div
                style={{ transform: "translateZ(50px)" }}
                className="absolute bottom-0 left-0 p-8 w-full"
            >
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded uppercase tracking-wider">News</span>
                    <span className="text-gray-400 text-xs">{date}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors leading-tight">{title}</h3>
                <p className="text-gray-300 text-sm line-clamp-3 mb-4">{content}</p>

                <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                    Read Full Article <span className="ml-2">→</span>
                </div>
            </div>
        </motion.div>
    );
};

const NewsPage = () => {
    // Using the generated image path (assuming it's served correctly or imported)
    // For now, I'll use a placeholder URL that represents the generated image concept if local file serving isn't set up, 
    // but since I generated it, I should use the artifact path if I could, but webapp can't access local artifacts directly usually.
    // I will use a reliable placeholder for the demo that matches the description.
    const techNewsImage = "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop";

    const newsData = [
        {
            title: "Major Server Update v2.5: The LSR Winter Update",
            date: "December 05, 2025",
            content: "We're excited to announce our biggest update yet! This includes new custom vehicles, a revamped inventory system, and several new player-owned businesses. The Diamond Casino has also been opened for business with a high-tech security system.",
            image: "/Media/Update_1.png"
        },
        {
            title: "Community Meeting: Future of LS Reborn",
            date: "August 10, 2025",
            content: "Join us this Friday at 8 PM EST for our monthly community meeting. We'll be discussing the recent update, future plans for the gang territories, and taking your feedback on the new economy balance.",
            image: "/Media/Community_Meeting_1.gif"
        },
        {
            title: "New Police Fleet Deployed",
            date: "December 05, 2025",
            content: "The LSPD has received a shipment of state-of-the-art pursuit vehicles. These new interceptors are equipped with the latest tracking tech. Criminals beware, the streets just got a lot safer.",
            image: "/Media/PD_Fleet_1.png"
        }
    ];

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">LS Reborn News</h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Stay up to date with the latest developments, server updates, and community events in Los Santos.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
                {newsData.map((news, index) => (
                    <NewsCard key={index} {...news} />
                ))}
            </div>
        </div>
    );
};

export default NewsPage;