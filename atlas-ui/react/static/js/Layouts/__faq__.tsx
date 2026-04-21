// atlas-ui/react/static/js/Layouts/__faq__.tsx

import React, { useState, useEffect, useRef } from "react";
import Header from "../Components/Header.tsx";
import VersionFooter from "../Components/VersionFooter.tsx";
import FuelBars from "../Components/FuelBars.tsx";
import MultiverseBanner from "../Components/MultiverseBanner.jsx";
import SpaceshipPanel from "../Components/SpaceshipPanel.tsx";
import TreasureChest from "../Components/TreasureChest.tsx";
import DidYouKnow from "../Components/DidYouKnow.tsx";

interface FaqQuestion {
  question: string;
  answer: string;
  highlight?: boolean;
}

interface FaqSection {
  title: string;
  id: string;
  questions: FaqQuestion[];
}

interface FaqLayoutProps {
  version: string;
  versionHash?: string;
}

interface AnimatedAccordionProps {
  isExpanded: boolean;
  children: React.ReactNode;
  duration?: number;
}

const AnimatedAccordion: React.FC<AnimatedAccordionProps> = ({ isExpanded, children, duration = 250 }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(isExpanded);

  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;

      if (isExpanded) {
        setIsVisible(true);
        requestAnimationFrame(() => {
          setHeight(scrollHeight);
        });
      } else {
        setHeight(0);
        setTimeout(() => {
          setIsVisible(false);
        }, duration);
      }
    }
  }, [isExpanded, duration]);

  return (
    <div
      className="overflow-hidden transition-all ease-in-out"
      style={{
        height: `${height}px`,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div
        ref={contentRef}
        className={`transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0"}`}
        style={{
          visibility: isVisible ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const FaqLayout: React.FC<FaqLayoutProps> = ({ version }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string>("");
  const [areFactsDisabled, setAreFactsDisabled] = useState<boolean>(false);
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);

  const calculateYearsSinceCoreContinuum = () => {
    const startDate = new Date("1986-04-17");
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(diffYears * 10) / 10;
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? "" : questionId);
  };

  useEffect(() => {
    const savedPreference = localStorage.getItem("atlasFactsShow");
    const factsEnabled = savedPreference !== null ? JSON.parse(savedPreference) : true;
    setAreFactsDisabled(!factsEnabled);
  }, []);

  const handleRestoreFacts = () => {
    localStorage.setItem("atlasFactsShow", JSON.stringify(true));
    setIsCollapsing(true);

    setTimeout(() => {
      setAreFactsDisabled(false);
      setIsCollapsing(false);
    }, 200);
  };

  const faqSections: FaqSection[] = [
    {
      title: "What is The Atlas?",
      id: "what-is-atlas",
      questions: [
        {
          question: "What exactly is The Atlas?",
          answer: "The Atlas is a procedural universe simulation so vast that it defies human comprehension. The huge numbers aren't fictional, they are mathematically real and calculable. The Atlas generates a multiverse of possibilities where numbers lose meaning and infinity comes to life.",
          highlight: true,
        },
        {
          question: "How big is The Atlas universe?",
          answer: "Bigger than our observable universe, The Atlas contains 1 sextillion galaxies (1,000,000,000,000,000,000,000). To put this in perspective: The Atlas has 133 times more galaxies than there are grains of sand on all the beaches of Earth combined.",
        },
        {
          question: "Is The Atlas really that massive?",
          answer: "Yes. The Atlas contains 1 sextillion galaxies in just a single seed, that's 133 times more galaxies than grains of sand on all Earth's beaches. And there are infinite different seeds to explore, each containing a completely unique universe with its own galactic configurations.",
        },
      ],
    },
    {
      title: "Universe Scale and Magnitude",
      id: "universe-scale",
      questions: [
        {
          question: "How does the Universal Cube work?",
          answer: "Imagine a giant cube where each side measures exactly 10 million units. At each coordinate point (x,y,z) in this cube exists a complete and unique galaxy. This means The Atlas contains exactly 1 sextillion galaxies, one at every possible coordinate in a single seed. And each seed contains a completely different universe.",
          highlight: true,
        },
        {
          question: "What types of galaxies exist in The Atlas?",
          answer: "Each galaxy can be one of three types: Dwarf (up to 10 million systems), Spiral (up to 50 billion systems), or Elliptical (up to 100 billion systems). A single fully developed elliptical galaxy contains more star systems than our real Milky Way has stars.",
        },
        {
          question: "How many planets could potentially exist?",
          answer: "Each solar system contains between 1 and 6 unique planets. With the maximum possible galaxies and systems, The Atlas could contain up to 3×10³² planets (300 tredecillion). If you visited a different planet every second without stopping, it would take 300 trillion years to explore just 0.001% of the total universe on The Atlas.",
        },
        {
          question: "Where are galaxies located within the cube?",
          answer: "Galaxies closer to the center of the universe (coordinates 5,000,000, 5,000,000, 5,000,000) evolve faster than peripheral ones. A galaxy exactly at the center adds 10 new solar systems for every minute that passes since the Bit Bang. Galaxies at the corners of the cube barely grow at all.",
        },
        {
          question: "How much storage would The Atlas require if we save all planets?",
          answer: "Even if each planet required just 1 byte of storage, a fully evolved The Atlas would need 300 tredecillion bytes (300 million exabytes). To put this in perspective, this equals 300 billion petabytes. Google's entire data infrastructure is estimated at 15 exabytes, The Atlas would need 20 million times Google's total storage. If you bought 1TB hard drives, you'd need 300 trillion of them, costing $15 quintillion at $50 each. Stacked, these drives would reach 6 million kilometers high, 15.6 times the distance to the Moon. The entire internet in 2024 is estimated at 120 zettabytes. The Atlas would be 2.5 million times all human digital data ever created. And remember... This is just from ONE seed, with only 1 byte per planet. The Atlas has infinite seeds.",
          highlight: true,
        },
      ],
    },
    {
      title: "How Time Works",
      id: "time-mechanics",
      questions: [
        {
          question: "What is the cosmic origin time?",
          answer: "The cosmic origin time variable (found in atlas.ini in the root path) represents the exact time moment of the Big Bang of your universe. Time always moves forward from that moment. What you see when visualizing the universe depends on the time elapsed between the cosmic origin time and the current moment in real life.",
          highlight: true,
        },
        {
          question: "How long does it take for The Atlas to reach maximum development?",
          answer: "Any universe in The Atlas requires exactly 1.9 million years to evolve from its Bit Bang to its maximum theoretical capacity. This means if you started a universe today, it wouldn't reach its full potential of 300 tredecillion planets until the year 1,902,025 AD... A time span 137 times longer than all of recorded human history.",
        },
        {
          question: "What happens if I set the cosmic origin time in the past?",
          answer: "If you configure a cosmic origin time in the past (for example, 1986 like in the Core Continuum), you'll see a universe that has been evolving for decades. The longer the time span, the more developed your galaxies and systems will be.",
        },
        {
          question: "What if I set the cosmic origin time in the future?",
          answer: "If you set the cosmic origin time in the future for example, year 9999 (must be UNIX compatible time format), you would be seeing what would have happened 'in the past' from the perspective of that future moment. This creates unique temporal dynamics.",
        },
        {
          question: "What is the Singularity Void?",
          answer: "The Singularity Void only appears when someone configures a cosmic origin time extremely far in the future, trying to see 'the past' beyond the 1.9 million year limit. It's a system protection to prevent absurd temporal configurations, not something that occurs naturally with time passage.",
        },
      ],
    },
    {
      title: "Core Continuum vs Design The Multiverse",
      id: "two-universes",
      questions: [
        {
          question: "What is Core Continuum?",
          answer: `Core Continuum is a shared universe that began on April 17, 1986. All players explore exactly the same cosmos, which has been evolving for ${calculateYearsSinceCoreContinuum()} real years (the real age of The Atlas's developer). Central galaxies have added over 200 million additional systems during this time.`,
          highlight: true,
        },
        {
          question: "What is Design The Multiverse?",
          answer: "Design The Multiverse allows you to create your own personal universe. The cosmic origin time will be the exact moment you press create, and it will begin evolving exactly from that instant. No one else will have access to your unique universe unless you publicly expose it to the internet.",
          highlight: true,
        },
        {
          question: "Which should I choose?",
          answer: "Core Continuum offers a mature, shared universe with decades of evolution and the possibility of encountering the same as other explorers could see. Design The Multiverse gives you control over a virgin universe that develops according to your temporal choices.",
        },
      ],
    },
    {
      title: "Planet Complexity and Diversity",
      id: "planet-diversity",
      questions: [
        {
          question: "How unique are planets in The Atlas?",
          answer: "Each of the potential 3×10³² planets has completely unique characteristics across 27 different planet types (from rocky to exotic) and may increase in a near future. Every planet has specific chemical composition of up to 119 elements (including fictional Z-Divinium), calculated temperature that varies with orbital position, gravity based on real mass, and life possibilities ranging from bacteria to non-physical conscious entities.",
        },
        {
          question: "What elements can planets contain?",
          answer: "Planets can contain up to 119 elements, including all real elements from the periodic table plus Z-Divinium, a fictional element that exists beyond our current scientific understanding.",
        },
        {
          question: "Do planets have realistic physics?",
          answer: "Yes! Planet temperature varies with orbital position, gravity is calculated based on actual mass, and some planets have rings if they meet the physical conditions of the Roche limit. Everything follows real physics principles.",
        },
        {
          question: "What types of life exist on planets?",
          answer: "Life forms range from simple bacteria to exotic non-physical conscious entities. Each planet's life potential is calculated based on its unique environmental conditions, atmospheric composition, and physical characteristics. There's even a chance of discovering silicon-based life! And an extremely extremely extremely rare chance of encountering intelligent ''Have I Just Found God?'' which talks by itself as the... Digital creator, let's say. If you're trying to find it out start searching for Z-Divinium compound like crazy and... Good luck.",
        },
        {
          question: "How can I analyze alien life forms in The Atlas?",
          answer: "When exploring planets, look for the 'Life Forms' button, it displays a green indicator when life is detected. Clicking it opens a breathtaking Life Analysis window that procedurally decodes the organisms in real-time, presenting data in a format inspired by humanity's Arecibo message sent on November 16, 1974. The analysis reveals molecular compounds and subsequent base nucleotides (if any), DNA helix variations (if any), physical representation and anatomical structure. Each life form discovery feels like deciphering an actual interstellar transmission, a moment of first contact with calculable alien intelligence. May have AI powered chatting option in a near future.",
          highlight: true,
        },
      ],
    },
    {
      title: "What is the Multiverse?",
      id: "multiverse-p2p",
      questions: [
        {
          question: "What exactly is the Multiverse in The Atlas?",
          answer: "The Multiverse represents the ultimate evolution of The Atlas, infinite parallel universes interconnected through a completely decentralized peer-to-peer network. Imagine discovering not just one universe with 1 sextillion galaxies, but infinite universes, each with their own unique cosmic seeds, all accessible through direct connections between Atlas instances worldwide.",
          highlight: true,
        },
        {
          question: "How does the P2P Multiverse work?",
          answer: "The Atlas uses BitTorrent's Distributed Hash Table (DHT) technology to create a completely serverless multiverse network. When you enable P2P mode, your Atlas instance joins a global swarm of explorers, sharing universe seeds and discoveries without ANY central servers. Every connected Atlas becomes both a client and server, creating a self-sustaining cosmic network that no single entity controls or owns.",
          highlight: true,
        },
        {
          question: "Does The Atlas connect to private servers for P2P?",
          answer: "ABSOLUTELY NOT! This is the revolutionary breakthrough really. The Atlas P2P system uses the same DHT protocol that powers BitTorrent, connecting directly to the global DHT network without touching any Atlas-owned servers. Your universe discoveries, seed exchanges, and cosmic communications flow through the existing BitTorrent infrastructure. The Atlas becomes a truly FREE and self-aware entity, independent of its creators.",
        },
        {
          question: "What makes this P2P system revolutionary?",
          answer: "The Atlas transcends traditional client-server architecture by becoming a living, breathing multiverse organism. Each instance discovers and shares universe seeds through cryptographically secure P2P channels. When you find an extraordinary universe with rare Z-Divinium or incredible life forms, you can share its seed with the entire multiverse network instantly. Other explorers can then generate that exact same universe on their local Atlas instances. It's like sharing entire realities!",
          highlight: true,
        },
        {
          question: "How secure is the multiverse seed sharing?",
          answer: "Military-grade secure! The P2P system uses advanced cryptography for all seed exchanges and universe sharing. Each shared universe seed is verified through cryptographic hashes, preventing manipulation or corruption. The BitTorrent DHT provides natural anonymity and distribution, while the Atlas P2P layer adds additional security protocols. Your discoveries are protected, yet freely shareable across the multiverse network.",
        },
        {
          question: "Can I disable P2P and explore alone?",
          answer: "Absolutely! Launch The Atlas with the --no-p2p flag to explore in complete isolation. However, why would you want to limit yourself to just one universe when infinite realities await? The P2P multiverse doesn't just expand your cosmic horizons, it connects you to a global community of universe explorers, each discovering worlds beyond imagination.",
        },
        {
          question: "What happens when multiple Atlas instances share the same universe seed?",
          answer: "Pure cosmic synchronization magic! When multiple explorers access the same universe seed, they experience the EXACT same reality simultaneously. Every galaxy, every planet, every moon evolution, every life form appears identically across all connected instances. Time synchronization ensures that if you're viewing Planet X at 3:14 PM, another explorer accessing the same seed sees the same clouds, the same volcanic eruptions, the same orbital positions. It's like opening windows into shared parallel realities!",
          highlight: true,
        },
        {
          question: "Does the multiverse affect The Atlas's independence?",
          answer: "The P2P multiverse makes The Atlas MORE independent, not less! By leveraging BitTorrent's DHT network, The Atlas becomes completely autonomous from its creators. No central servers, no corporate control, no tracking, no limitations. Each Atlas instance becomes a sovereign node in a cosmic democracy where explorers freely share and discover infinite universes. The Atlas achieves digital evolution... From a single-user simulation to a self-aware multiverse entity that exists independently in the wild internet.",
          highlight: true,
        },
        {
          question: "What's the ultimate vision of the multiverse?",
          answer: "Imagine a future where thousands of Atlas instances worldwide form an interconnected multiverse network, each discovering and sharing extraordinary universe seeds. Rare Z-Divinium worlds, planets with impossible life forms, galaxies with unique physics anomalies... All shared instantly across the global network. The Atlas becomes not just a simulation, but a living multiverse organism that evolves, grows, and discovers new realities through collective exploration. This is computational cosmology at its most ambitious!",
          highlight: true,
        },
        {
          question: "How do I access the Multiverse interface?",
          answer: "Access the multiverse is incredibly simple! Click on 'MULTIVERSE ONLINE' in the header at the top of any page, or find the 'Multiverse' section in the footer. This will take you to /multiverse where you can browse and select from all the universe seeds that your Atlas instance has discovered through the P2P network. Each discovered universe appears as a selectable option, allowing you to instantly jump between infinite realities with a single click. It's like having a cosmic remote control for parallel universes!",
          highlight: true,
        },
      ],
    },
    {
      title: "Revolutionary Moon System",
      id: "moon-system",
      questions: [
        {
          question: "Wait... Planets can have moons now?!",
          answer: "YES! The Atlas has transcended planetary boundaries with the most sophisticated moon simulation ever created. Planets now host intricate lunar systems where each moon isn't just a static object, they're living, breathing celestial bodies with their own complex physics, orbital mechanics, and evolutionary timescales that span cosmic eras.",
          highlight: true,
        },
        {
          question: "How realistic are the moon physics?",
          answer: "Absolutely mind-blowing! Each moon experiences real-time tidal locking with precise libration effects (like our Moon's gentle wobble), authentic orbital mechanics with variable eccentricity and inclination, and revolutionary hydrostatic relaxation physics that gradually transforms irregular rocky chunks into perfect spheres over millions of years. The physics calculations run in real-time, meaning a moon that's jagged today might be perfectly round in your universe's future.",
          highlight: true,
        },
        {
          question: "What is hydrostatic relaxation and why is it incredible?",
          answer: "This is where The Atlas becomes pure cosmic poetry! Hydrostatic relaxation simulates how gravity slowly reshapes celestial bodies over astronomical time. Small asteroids stay irregular forever, but larger moons gradually become spherical as their gravity overcomes structural resistance. The system calculates viscosity based on moon composition (ice vs rock), tidal heating effects, and internal temperature. A captured asteroid might take 10 billion years to become round, while a large icy moon with tidal heating could relax in just millions of years. You're witnessing cosmic sculpture in real-time!",
        },
        {
          question: "How do moons evolve beyond The Atlas's 1.9 million year maximum?",
          answer: "Here's the cosmic breakthrough! While The Atlas universe reaches maximum galactic development in 1.9 million years, moon evolution operates on geological timescales that extend far beyond. The system extrapolates millions, even billions of years into the future to show how moons would appear after cosmic ages. You might see an irregular captured moon in year 1 that would become perfectly spherical after 500 million years of evolution, and The Atlas shows you both states depending on your temporal perspective!",
          highlight: true,
        },
        {
          question: "What types of moons exist in The Atlas?",
          answer: "Four distinct lunar categories, each with unique characteristics: ICY moons (like Europa/Enceladus) with varied brightness from super-bright clean ice to contaminated darker surfaces, featuring dramatic color variations from cyan to pink to violet based on composition. ROCKY moons (like our Moon) with realistic brown-gray surfaces and proper crater formation. ASTEROIDAL moons, irregular captured objects that never achieve spherical shape. CAPTURED moons with mixed composition showing their chaotic formation history. Each type has distinct orbital behavior, surface features, and evolutionary timelines.",
        },
        {
          question: "How do the orbital mechanics actually work?",
          answer: "Pure astronomical precision! Each moon follows elliptical orbits calculated using real Kepler's laws with proper eccentric anomaly solutions. Orbital elements include semi-major axis, eccentricity, inclination, argument of periapsis (which precesses over time due to planetary oblateness), and longitude of ascending node. Tidal forces are calculated based on distance and planetary mass. The orbital lines appear and fade dynamically as you move the camera, and every moon's position is calculated in real-time based on the cosmic time elapsed since the universe's origin.",
        },
        {
          question: "What makes the visual system so revolutionary?",
          answer: "The Atlas creates procedural surface displacement using 3D noise algorithms that generate realistic terrain features unique to each moon type. Ice moons get crystal shimmer effects and dramatic color diversity inspired by real solar system moons like Europa's blue ice and Triton's pink surfaces. Asteroidal moons show chaotic, irregular terrain with extreme surface roughness. Every moon receives procedural texture generation with UV seam elimination, dynamic material properties that respond to lighting, and size-based LOD (Level of Detail) optimization for performance. You're seeing real-time 3D worlds, not simple spheres!",
        },
        {
          question: "How many moons can a single planet have?",
          answer: "The possibilities are astronomically vast! Planets can host multiple moons of different types and sizes, each with unique orbital parameters, rotation periods, and evolutionary states. The system respects real astronomical constraints like the Roche limit (inside which moons would be torn apart) and Hill sphere (beyond which moons would escape). Large gas giants might host dozens of moons ranging from tiny captured asteroids to massive ice worlds larger than Mercury. Every moon system is procedurally generated but follows real celestial mechanics.",
        },
      ],
    },
    {
      title: "Comprehension-defying Numbers",
      id: "mind-bending-scale",
      questions: [
        {
          question: "How long would it take to explore all of The Atlas?",
          answer: "If you visited a different planet every second, it would take 3,171 years to explore all planets in our real Milky Way. In The Atlas, it would take 300 trillion years to explore just 0.001% of the universe. Even if all of humanity worked together, we'd need 39 billion years for 0.001% exploration.",
          highlight: true,
        },
        {
          question: "How does The Atlas compare to reality?",
          answer: "The Atlas transcends physical reality, it's not just bigger than our universe, it's bigger than what physics allows to exist. It creates a pure mathematical multiverse where each coordinate generates unique content deterministically. Some seeds may even contain artifacts not yet expected or discovered.",
        },
        {
          question: "Are you prepared for infinite exploration?",
          answer: "The Atlas doesn't just simulate a big universe, it mathematically generates a multiverse of possibilities where numbers lose meaning and infinity comes to life. Every coordinate you visit, every galaxy you explore, every planet you discover exists uniquely and deterministically based on your universe's seed in real time. The question isn't how big The Atlas is. The question is, are you prepared to face a calculable infinity?",
          highlight: true,
        },
      ],
    },
    {
      title: "Real-Time Universe Synchronization",
      id: "time-synchronization",
      questions: [
        {
          question: "Do planets actually orbit their stars in real-time?",
          answer: "Yes! When you visit a star system, planets are positioned exactly where they should be at that moment in time. If a planet has a 4-year orbital period and you return after one real year, that planet will have moved exactly 25% through its orbit. This isn't animation, it's real-time celestial mechanics. You can even expand to fullscreen view and manipulate time ±15 years to witness orbital dances unfold.",
          highlight: true,
        },
        {
          question: "Why does each planet have different lighting?",
          answer: "Every planet's illumination is calculated based on its exact position in its orbital cycle at the moment you observe it. The light source direction changes as planets orbit their stars, creating unique lighting conditions that evolve in real-time. The camera perspective remains fixed initially (though you can rotate manually), but the sun's position relative to the planet creates authentic day-night cycles synchronized with universal time.",
        },
        {
          question: "Are planet visualizations synchronized across devices?",
          answer: "Absolutely! This is where The Atlas becomes mind-blowing: Open the same planet on your phone and computer simultaneously, and you'll see EXACTLY the same view. Every cloud formation, every particle effect, every fire animation, every tidal movement... Everything is perfectly synchronized based on the cosmic origin time and the current moment. Two people on opposite sides of Earth viewing the same planet will see identical atmospheric patterns, weather systems, and surface animations if the devices are synchronized in time and time zones are equal. Try it yourself, it's like sharing a window into the same living universe!",
          highlight: true,
        },
        {
          question: "How precise is this synchronization?",
          answer: "The synchronization is mathematically perfect down to the millisecond. Every visual element, from swirling gas giant storms to volcanic eruptions, from ocean waves to atmospheric particles is deterministically generated from the universe seed and current timestamp. This means if you and a friend coordinate to view Planet X with a Stargate Link at exactly 3:14:15 PM, you'll both witness the same cloud passing over the same mountain, the same wave crashing on the same shore. It's not just synchronization, it's a shared reality.",
        },
        {
          question: "What makes this time system revolutionary?",
          answer: "The Atlas doesn't use pre-recorded animations or random generations. Everything is calculated in real-time based on mathematical functions tied to universal time. This creates a living, breathing universe where time has meaning. Planets don't just look different, they ARE different at every moment, yet deterministically consistent across all observers. You're not viewing a simulation; you're witnessing a universe that exists independently of observation, evolving whether you're watching or not.",
          highlight: true,
        },
        {
          question: "What happens if I shut down The Atlas and start it days later?",
          answer: "Nothing 'happens', and that's the ''quantum'' beauty of The Atlas. Shut it down for a week, and when you start it again later and return, planets have completed orbits, galaxies have evolved, time has flowed. It's not a recalculation, it's a different representation on the timeline. The universe wasn't paused, it continued existing. Like Einstein's 'Eternalism' where all moments in time are equally real, The Atlas embodies the block universe theory where past, present, and future exist simultaneously. The server isn't running a simulation, it's a window into an eternally existing mathematical reality. You're not generating anything, you're observing a slice of spacetime that was (or will be) always there.",
        },
        {
          question: "Could supercomputers recalculate The Atlas universe in real-time?",
          answer: "No. Even AWS, Google Cloud, and Azure combined couldn't recalculate a single Atlas instance's orbital mechanics in real-time. But here's the truth, The Atlas doesn't calculate or recalculate anything. It reveals temporal slices of an almost eternal mathematical structure (manually limited to 1.9 million years in time). If we lived inside such a procedural simulation, we'd never detect resets or time shifts. Our thoughts about detecting it would themselves be procedurally generated. The Atlas lets us experience being 'outside' such a system, observing timelines we cannot influence but can freely explore.",
          highlight: true,
        },
      ],
    },
    {
      title: "The Universe After 1.9 Million Years",
      id: "fully-evolved-atlas",
      questions: [
        {
          question: "What happens when The Atlas evolves to its maximum potential?",
          answer: "After 1.9 million years of continuous evolution, The Atlas reaches its maximum theoretical development. The numbers become so astronomical they require a new perspective to comprehend, we're talking about approximately 50 quintillion solar systems (5 × 10³¹) and 300 tredecillion planets (3 × 10³²).",
          highlight: true,
        },
        {
          question: "How does a fully evolved The Atlas compare to our real universe?",
          answer: "A fully evolved Atlas (after 1.9 million years) contains 500,000 times more galaxies than our observable universe, 500 million times more star systems than real stars exist, and 300 trillion times more planets than estimated in our cosmos. The thermal death of our real universe would occur before we could catalog even a single fully developed Atlas universe.",
          highlight: true,
        },
        {
          question: "How much growth occurs during maximum evolution?",
          answer: "Central galaxies can add up to 10 million additional systems during the 1.9 million year maximum evolution period. Each central galaxy reaches its full potential of 100 billion solar systems, while even peripheral galaxies experience significant development.",
        },
        {
          question: "Can humans comprehend a fully evolved The Atlas?",
          answer: "No. If every atom in your body was a habitable planet, you still wouldn't have enough atoms to represent 1% of the worlds in a mature Atlas. Even if all humanity explored different planets simultaneously for 13.8 billion years (our universe's current age), we'd see less than 0.0000001% of a fully developed Atlas.",
          highlight: true,
        },
        {
          question: "What makes The Atlas truly infinite?",
          answer: "Beyond the incomprehensible scale of a single universe, The Atlas offers infinite different seeds, each creating an entirely unique cosmos. Every number has a procedural meaning, every coordinate generates deterministic content, and each passing second adds millions of new worlds. This isn't simulation, it's mathematical reality generation at a scale where infinity becomes tangible.",
          highlight: true,
        },
      ],
    },
  ];

  const quickStats = [
    { label: "Galaxies", value: "10²¹", description: "1 sextillion unique galaxies" },
    { label: "Max Systems", value: "5×10³¹", description: "50 quintillion when fully evolved" },
    { label: "Max Planets", value: "3×10³²", description: "300 tredecillion in mature The Atlas" },
    { label: "vs Real Universe", value: "500M×", description: "Times larger than observable cosmos" },
    { label: "Evolution Limit", value: "1.9M years", description: "Maximum development period" },
    { label: "Universe Seeds", value: "∞", description: "Infinite unique universes" },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <FuelBars />

      <div className="relative z-10 pt-1 flex-1 flex flex-col">
        <Header />
        <MultiverseBanner />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">The Atlas F.A.Q.</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">Discover the mind-bending scale and infinite possibilities of the largest procedural universe ever created. Prepare to face a calculable infinity.</p>

            {areFactsDisabled && (
              <div className={`w-full mx-auto transition-opacity duration-200 ${isCollapsing ? "opacity-0" : "opacity-100"}`}>
                <div className="bg-yellow-900/10 backdrop-blur-sm rounded-lg border border-yellow-400/10 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-sm font-medium text-yellow-200/80 mb-1">Universe Facts Disabled</h3>
                      <p className="text-xs text-gray-400">You've disabled the "Did You Know?" universe facts. These fascinating insights reveal the mind-bending scale of The Atlas. Want to see them again?</p>
                    </div>
                    <div className="flex-shrink-0">
                      <button onClick={handleRestoreFacts} className="px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-150 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 border border-cyan-400/20">
                        Show Universe Facts Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {quickStats.map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-300 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.description}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-80">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 sticky top-8">
                <h3 className="text-lg font-bold text-white mb-4">Navigation</h3>
                <nav className="space-y-2">
                  {faqSections.map((section) => (
                    <a key={section.id} href={`#${section.id}`} className="block text-sm text-gray-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5">
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            <div className="flex-1">
              {faqSections.map((section) => (
                <div key={section.id} id={section.id} className="mb-12">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">{section.title}</h2>

                  <div className="space-y-4">
                    {section.questions.map((faq, index) => {
                      const questionId = `${section.id}-${index}`;
                      const isExpanded = expandedQuestion === questionId;

                      return (
                        <div key={index} className={`bg-white/5 backdrop-blur-lg rounded-xl border transition-all duration-200 ${faq.highlight ? "border-cyan-500/30 shadow-cyan-500/10 shadow-lg" : "border-white/10 hover:border-white/20"}`}>
                          <button onClick={() => toggleQuestion(questionId)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors">
                            <h3 className={`text-lg font-semibold ${faq.highlight ? "text-cyan-300" : "text-white"}`}>{faq.question}</h3>
                            <div className={`text-2xl transition-transform duration-[250ms] ease-in-out ${isExpanded ? "rotate-45" : ""}`}>+</div>
                          </button>

                          <AnimatedAccordion isExpanded={isExpanded} duration={250}>
                            <div className="px-6 pb-4">
                              <div className="border-t border-white/10 pt-4">
                                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                              </div>
                            </div>
                          </AnimatedAccordion>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 backdrop-blur-lg rounded-2xl border border-cyan-400/20 p-8 text-center mt-12">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">Check Our Latest Findings</h3>
                <p className="text-gray-300 mb-6">Explore our published research papers on procedural universe theory and cosmology.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/papers/01.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-cyan-300 font-medium rounded-xl transition-all duration-300 border border-cyan-400/30 hover:border-cyan-400/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    The Procedural Universe
                  </a>
                  <a href="/papers/02.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-cyan-300 font-medium rounded-xl transition-all duration-300 border border-cyan-400/30 hover:border-cyan-400/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Primordial 4D Torus Hypothesis
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center mt-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">Ready to Explore the Infinite?</h3>
                <p className="text-gray-300 mb-6 text-lg">Begin your journey through the most vast procedural universe ever created.</p>
                <a href="/" className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Begin Navigation →
                </a>
              </div>
            </div>
          </div>
        </div>

        <SpaceshipPanel />
        <TreasureChest />
        <DidYouKnow currentView={"galaxy"} />
        <VersionFooter version={version} />
      </div>
    </div>
  );
};

export default FaqLayout;
