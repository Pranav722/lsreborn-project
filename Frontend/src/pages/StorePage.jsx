import React from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';

const StorePage = () => {
    const storeItems = [
        { name: 'VIP Package (Monthly)', price: '$25.00', image: '[https://placehold.co/600x400/0d1117/00aaff?text=VIP](https://placehold.co/600x400/0d1117/00aaff?text=VIP)' },
        { name: 'Custom Import Car', price: '$50.00', image: '[https://placehold.co/600x400/0d1117/00aaff?text=Exotic+Car](https://placehold.co/600x400/0d1117/00aaff?text=Exotic+Car)' },
        { name: '$500k In-Game Cash', price: '$10.00', image: '[https://placehold.co/600x400/0d1117/00aaff?text=%24500K](https://placehold.co/600x400/0d1117/00aaff?text=%24500K)' },
        { name: 'Player-Owned Business', price: '$100.00', image: '[https://placehold.co/600x400/0d1117/00aaff?text=Business](https://placehold.co/600x400/0d1117/00aaff?text=Business)' },
    ];

    return (
        <div className="animate-fade-in">
            <Card>
                <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Community Store</h2>
                <p className="text-center text-gray-400 mb-10">Support the server and get exclusive in-game perks. All purchases go towards server maintenance and development.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {storeItems.map(item => (
                        <div key={item.name} className="group relative overflow-hidden rounded-lg border border-cyan-500/20 bg-gray-800/50 shadow-lg transition-all duration-300 hover:shadow-cyan-500/20 hover:-translate-y-2">
                           <img src={item.image} alt={item.name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
                           <div className="p-4">
                               <h3 className="text-lg font-bold text-white">{item.name}</h3>
                               <p className="text-cyan-400 text-xl font-semibold mt-1">{item.price}</p>
                               <a href="[https://ls-reborn-store.tebex.io/](https://ls-reborn-store.tebex.io/)" target="_blank" rel="noopener noreferrer">
                                   <AnimatedButton className="w-full mt-4 !py-2 text-sm bg-cyan-600">
                                       Buy Now
                                   </AnimatedButton>
                               </a>
                           </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
export default StorePage;
