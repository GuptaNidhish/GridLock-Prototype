import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, TrendingUp, AlertCircle, Plus, Smile, Frown, Check, ExternalLink } from 'lucide-react';
import { Incident } from '../data/mockDatabase';

interface CitizenPulseProps {
  onAddIncidentFromPulse: (title: string, desc: string, location: string, lat: number, lon: number, type: string) => void;
  activeIncidents: Incident[];
}

interface PulsePost {
  id: string;
  user: string;
  source: 'Twitter' | 'Reddit' | 'Maps Review';
  text: string;
  location: string;
  lat: number;
  lon: number;
  type: string;
  sentiment: 'angry' | 'neutral' | 'frustrated';
  time: string;
  urgency: number; // 0.0 to 1.0
  isLogged: boolean;
}

export const CitizenPulse: React.FC<CitizenPulseProps> = ({
  onAddIncidentFromPulse,
  activeIncidents,
}) => {
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string | null>(null);
  const [posts, setPosts] = useState<PulsePost[]>([
    {
      id: 'post_0',
      user: '@BengalCommuter',
      source: 'Twitter',
      text: 'Major accident near Tin Factory, traffic completely stopped! Where are the cops? 🚨',
      location: 'Tin Factory Junction',
      lat: 12.9995,
      lon: 77.6827,
      type: 'accident',
      sentiment: 'angry',
      time: 'Just now',
      urgency: 0.92,
      isLogged: false,
    },
    {
      id: 'post_1',
      user: 'u/silkboard_survivor',
      source: 'Reddit',
      text: 'ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಭಾರಿ ಟ್ರಾಫಿಕ್ ಜಾಮ್ ಆಗಿದೆ. (Heavy traffic jam at Silk Board junction. Crawling at 2km/h.)',
      location: 'Silk Board Junction',
      lat: 12.9176,
      lon: 77.6244,
      type: 'vehicle_breakdown',
      sentiment: 'frustrated',
      time: '4 mins ago',
      urgency: 0.78,
      isLogged: false,
    },
    {
      id: 'post_2',
      user: '@NammaBLR',
      source: 'Twitter',
      text: 'Water logging starting at ORR East underpass near Whitefield. Avoid service roads!',
      location: 'Whitefield',
      lat: 12.9995,
      lon: 77.6827,
      type: 'water_logging',
      sentiment: 'frustrated',
      time: '12 mins ago',
      urgency: 0.85,
      isLogged: false,
    },
  ]);

  // Sync isLogged state if the incident gets added to activeIncidents
  useEffect(() => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        const matchingIncident = activeIncidents.some(
          (inc) =>
            inc.status === 'active' &&
            inc.locality.toLowerCase().includes(post.location.split(' ')[0].toLowerCase()) &&
            inc.incident_type === post.type
        );
        return { ...post, isLogged: matchingIncident };
      })
    );
  }, [activeIncidents]);

  // Add random incoming post simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const randomPosts = [
        {
          id: `post_${Date.now()}`,
          user: '@TrafficTragedy',
          source: 'Twitter' as const,
          text: 'Pothole repairs at Peenya lane causing massive bottleneck on Tumkur Road. Need signal timings adjusted!',
          location: 'Peenya',
          lat: 13.0400,
          lon: 77.5181,
          type: 'road_work',
          sentiment: 'frustrated' as const,
          time: 'Just now',
          urgency: 0.65,
          isLogged: false,
        },
        {
          id: `post_${Date.now() + 1}`,
          user: '@LalbaghDriver',
          source: 'Twitter' as const,
          text: 'Cement blocks lying on road near Wilson Garden, almost hit one! Blocked right lane.',
          location: 'Wilson Garden',
          lat: 12.9568,
          lon: 77.5875,
          type: 'road_work',
          sentiment: 'angry' as const,
          time: 'Just now',
          urgency: 0.70,
          isLogged: false,
        },
      ];

      const newPost = randomPosts[Math.floor(Math.random() * randomPosts.length)];
      setPosts((prev) => [newPost, ...prev.slice(0, 4)]); // Limit to 5 posts
    }, 25000); // Trigger every 25 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogIncident = (post: PulsePost) => {
    onAddIncidentFromPulse(
      `Citizen Alert: ${post.type.replace('_', ' ')} at ${post.location}`,
      post.text,
      post.location,
      post.lat,
      post.lon,
      post.type
    );

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isLogged: true } : p))
    );
  };

  const filteredPosts = selectedLocationFilter
    ? posts.filter((post) => post.location.toLowerCase().includes(selectedLocationFilter.toLowerCase()))
    : posts;

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Citizen Pulse Sentiment Monitor
          </h2>
          <p className="text-[10px] text-slate-400">Scraping social media alerts for unreported disruptions</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-red-400">
            <Frown className="w-3.5 h-3.5" />
            <span>78% ANGRY/FRUSTRATED</span>
          </div>
          <button
            onClick={() => window.open('/pulse', '_blank')}
            title="Open in new tab"
            className="p-1 hover:bg-slate-900 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-slate-950/60 border border-slate-900/60 p-2.5 rounded-lg mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Trending Alert Locations</span>
          </div>
          {selectedLocationFilter && (
            <button
              onClick={() => setSelectedLocationFilter(null)}
              className="text-[8px] text-red-400 hover:text-red-300 font-black uppercase tracking-wider cursor-pointer transition"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '1. Silk Board (342 posts)', query: 'Silk Board' },
            { label: '2. ORR Marathahalli (189 posts)', query: 'ORR' },
            { label: '3. Tin Factory (156 posts)', query: 'Tin Factory' },
          ].map((loc) => {
            const isActive = selectedLocationFilter === loc.query;
            return (
              <button
                key={loc.query}
                onClick={() => setSelectedLocationFilter(isActive ? null : loc.query)}
                className={`text-[9px] border px-2 py-0.5 rounded font-medium cursor-pointer transition ${
                  isActive
                    ? 'bg-sky-500 border-sky-400 text-slate-950 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {loc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Stream */}
      <div className="flex-1 space-y-3 max-h-[190px] overflow-y-auto pr-1">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className={`border rounded-lg p-3 transition flex flex-col justify-between ${
              post.isLogged
                ? 'border-emerald-950 bg-emerald-950/5'
                : 'border-slate-900 bg-slate-950/40'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] mb-1.5">
              <div className="flex items-center space-x-1">
                <span className="text-sky-400 font-bold">{post.user}</span>
                <span className="text-slate-500 font-medium">via {post.source}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium">{post.time}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    post.urgency > 0.8
                      ? 'bg-red-950/40 text-red-400 border border-red-900/60'
                      : 'bg-yellow-950/30 text-yellow-400 border border-yellow-900/60'
                  }`}
                >
                  {(post.urgency * 100).toFixed(0)}% Urgency
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-normal font-medium mb-2">{post.text}</p>

            <div className="flex justify-between items-center pt-1 border-t border-slate-900/80">
              <span className="text-[10px] text-slate-400 font-semibold italic">
                📍 Loc: {post.location}
              </span>

              {post.isLogged ? (
                <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>LOGGED IN SYSTEM</span>
                </div>
              ) : (
                <button
                  onClick={() => handleLogIncident(post)}
                  className="bg-sky-950/60 border border-sky-800 text-sky-400 hover:bg-sky-500 hover:text-slate-950 flex items-center space-x-1 py-1 px-2.5 rounded font-extrabold text-[9px] uppercase tracking-wider transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>CREATE INCIDENT</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
