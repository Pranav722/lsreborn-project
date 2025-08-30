import React from 'react';
import Card from '../components/Card';

const NewsPage = () => (
    <div className="animate-fade-in">
        <Card>
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">News & Updates</h2>
            <div className="space-y-8">
                <div className="bg-gray-800/70 p-6 rounded-lg border border-cyan-500/20">
                    <h3 className="text-xl font-bold text-cyan-300">Major Server Update v1.2!</h3>
                    <p className="text-sm text-gray-400 mb-3">Posted on August 12, 2025</p>
                    <p className="text-gray-300">We're excited to announce our biggest update yet! This includes new custom vehicles, a revamped inventory system, and several new player-owned businesses. The Diamond Casino has also been opened for business. Check the #announcements channel in Discord for the full changelog!</p>
                </div>
                 <div className="bg-gray-800/70 p-6 rounded-lg border border-cyan-500/20">
                    <h3 className="text-xl font-bold text-cyan-300">Community Meeting This Friday</h3>
                    <p className="text-sm text-gray-400 mb-3">Posted on August 10, 2025</p>
                    <p className="text-gray-300">Join us this Friday at 8 PM EST for our monthly community meeting. We'll be discussing the recent update, future plans, and taking your feedback. The meeting will be held in the "Town Hall" stage channel on Discord.</p>
                </div>
                <div className="bg-gray-800/70 p-6 rounded-lg border border-cyan-500/20">
                    <h3 className="text-xl font-bold text-cyan-300">Latest from Twitter/X</h3>
                    <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-900">
                        <p className="text-gray-300">Our new police department vehicles are now live! 🚓 Who's ready to patrol the streets of Los Santos in style? #LSRebornRP #FiveM</p>
                        <a href="#" className="text-cyan-400 hover:underline text-sm mt-2 inline-block">View on X</a>
                    </div>
                </div>
            </div>
        </Card>
    </div>
);
export default NewsPage;