export function ArtistProfile() {
  return (
    <div className="bg-[#4A5568] rounded-lg overflow-hidden shadow-lg">
      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
        <div className="text-white text-6xl font-bold">hybrid.</div>
      </div>

      {/* Bio Content */}
      <div className="p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Hybrid</h2>
        <div className="space-y-4 text-sm leading-relaxed text-white/90">
          <p>
            Hybrid is a British electronic music duo consisting of Mike and Charlotte Truman. 
            The group was formed in 1995 by Mike Truman, Chris Healings, and Lee Mullin.
          </p>
          <p>
            At the time they were primarily known as a breakbeat collective, although they 
            overlapped considerably with progressive house and trance.
          </p>
          <p>
            The group is well known for their single "Finished Symphony" which was released 
            in 1999 and featured the vocals of Julee Cruise. The track was used in various 
            commercials and TV shows, bringing the group mainstream recognition.
          </p>
          <p>
            Over the years, Hybrid has released several albums and has performed at major 
            festivals and venues around the world, maintaining a dedicated following in the 
            electronic music scene.
          </p>
        </div>
      </div>
    </div>
  );
}
