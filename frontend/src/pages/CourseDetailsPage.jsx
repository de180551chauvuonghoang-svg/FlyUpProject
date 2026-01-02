import { useState } from 'react';
import { useParams } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { 
  Rocket, ChevronRight, Star, StarHalf, Clock, Globe, Video, 
  FileDown, Infinity as InfinityIcon, Smartphone, Award, Check, ChevronDown, 
  Play, Users, PlayCircle 
} from 'lucide-react';
import { 
  fadeIn, 
  slideInFromBottom, 
  slideInLeft, 
  slideInRight, 
  scaleIn,
  staggerContainer, 
  staggerItem
} from '../utils/animations';
import Header from '../components/Header';

// Mock course data
const coursesData = {
  '1': {
    id: '1',
    title: 'Advanced UI Strategy for Deep Space Systems',
    description: 'Learn to design mission-critical interfaces for zero-gravity environments.',
    fullDescription: 'Embark on a journey through the cosmos of user experience design. This course is not for the faint of heart; it is designed for those who wish to push the boundaries of what is possible on a screen. We will dive deep into the aesthetics of the future, exploring how to create interfaces that feel like they belong on a starship bridge.',
    category: 'UI/UX Design',
    rating: 4.9,
    ratingCount: 1200,
    price: 49.99,
    originalPrice: 149.99,
    discount: 67,
    lastUpdated: 'August 2024',
    language: 'English',
    duration: '12h 30m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Zu31-FoGKP_my4-Lafk2xqfyDukuhjCj7FpcMNe7svCReqUCx1F9FaMLeExAtzjEJ_L9OXpLZ7jhczYS17nJsZzAukJHLhRzsfjDWm5XHfeA4-PR3oqRmn4YhCz166UbZqNzuDDkV7fy1r2e_WHBugM-QOw__MsCJBjUaQkxAIoDQoRQtVBasS8wY1YkJATQ96hCtyiRn05yL9nn2JPXY-HXMAY0qx9WBPHvENbXqOv05ky5YNPCN1a2TkfrHd5lMLNbp6qkfos',
    instructor: {
      name: 'Sarah Jenks',
      role: 'Lead Designer & Space UI Expert',
      rating: 4.9,
      students: 45000,
      courses: 12,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhXVsUn1W6DrL46qXgUu8HGckfDEjHc9bsoOZGICe-WCaGI-WBm8ddIrrGF2dbEmOdGqaymLwv3HAuieOO1fX0l-1Lh1pJEeGkG-cs2VtCBw4n2axEGrTtjpJdleY8qJt5oBB2VsPAG-seZvHdUlA__2y3HIII66qKcsOgAn2sMlD1x5NMkv2kkjjYIb4gekCK-45uvJBrj1gCdSXyiRQEKI1sICDvq-jJKEkAyXHWO88ix6NZFmun_FvU1Axv0K9s6-50R4sGPxY',
      bio: 'Sarah is a pioneer in spatial computing interfaces and has worked with leading aerospace companies to design next-gen cockpit displays. She loves teaching the art of the possible.'
    },
    learningPoints: [
      "Master advanced UX principles for immersive environments",
      "Design futuristic interfaces using glassmorphism and neon glows",
      "Understand spatial computing constraints",
      "Build comprehensive design systems for dark mode",
      "Strategy for VR/AR user flows",
      "Accessibility in high-contrast interfaces"
    ]
  },
  '2': {
    id: '2',
    title: 'Nebula Photography Masterclass',
    description: 'Capture the cosmos with advanced telescopic photography techniques.',
    fullDescription: 'Discover the art and science of astrophotography. This comprehensive course will teach you how to capture stunning images of nebulae, galaxies, and other deep-sky objects using modern telescopes and imaging equipment.',
    category: 'Science',
    rating: 4.8,
    ratingCount: 850,
    price: 89.99,
    originalPrice: 199.99,
    discount: 55,
    lastUpdated: 'July 2024',
    language: 'English',
    duration: '8h 15m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBpV8VhxHAccGyYNQSgwcERpMD6XhqIkAM4hun3kbzSwDjDIiqBWKFKdl0os_-82XPmXaIdJdLM9ej7MXMU9fsFguA6Og0UYV5Yy3U2qHcPHKAb6MIj5gy3YFbSuc_0riJXHKfiCXURh4GqWu4-V0Jvm7llNg-vij3Mcog51drnjt9rMKsc7VG1tdFxEUBzVuMFiyajnVS_qttAAWxi6opYscBbG5CT7WEADRi6zNhbHTKt2dJdQytFe8OdX4RDNoqztwoWPVKMLw',
    instructor: {
      name: 'Dr. A. Stone',
      role: 'Astrophysicist & Photography Expert',
      rating: 4.9,
      students: 32000,
      courses: 8,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMPJt06NuUJQmzmof1mEQKqr6yW6CZtk3krop_Q0SFsO5v6ED4mwWZQoZGYguLLKliafJLROpMOd3qVHNLEeCByOihnDpV3X-_DdQQWMA3U-tFbZhrqoGwvh0locJqyxh4hWaCMUZ9dBIgBbUlk3kSM7PYFM921ZfaHfNWadsBkCkM6n5rqq87mWng6NK1FiE8DRIfUkPdDPTpkUcLZTPqVgmcuXrY6vxsUp576DP7_hoUYB3oYblmY4Ch44kyvrq-0p6Px_QTnk4',
      bio: 'Dr. Stone has spent over 20 years studying celestial phenomena and capturing their beauty through advanced imaging techniques.'
    },
    learningPoints: [
      "Master telescope setup and alignment",
      "Understand deep-sky imaging techniques",
      "Learn advanced image stacking and processing",
      "Capture stunning nebula formations",
      "Post-processing in specialized software",
      "Plan imaging sessions based on celestial events"
    ]
  },
  '3': {
    id: '3',
    title: 'React for VR Environments',
    description: 'Build immersive 3D web applications using React Three Fiber.',
    fullDescription: 'Dive into the world of virtual reality web development. Learn how to create stunning 3D experiences using React Three Fiber, combining the power of React with the capabilities of Three.js for immersive VR applications.',
    category: 'VR/AR Development',
    rating: 4.7,
    ratingCount: 2300,
    price: 29.99,
    originalPrice: 99.99,
    discount: 70,
    lastUpdated: 'September 2024',
    language: 'English',
    duration: '24h 00m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgYBlUW-I7C0tvtdmAs0PgnVDyz09gXk4cGVcPmCCX_d7qepORN8n8He3qzGzapAQXKYXpBhgJkSqgjCG5gVmfyGC8sOI87wKXnH90ZuzfzZb89fshjfmhUSqjpQ4umo0HGQEFH-lu04F0Hmrul4VOKXcyOd0AzXvH1DsoB_hh8fkVf4Np1z1EgUA_xMjiEImFcPJLVJaOHTke4KrmbbLzjlVWV3cUud2LS1DZmgvCooX-50noIAOYUFyUtWOGUgd-xnC4idkhCOY',
    instructor: {
      name: 'Devon Lane',
      role: 'Senior VR Developer',
      rating: 4.8,
      students: 55000,
      courses: 15,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk5gDw8EY5q9yjBBTtRCEAns73Pf7QQEJ-ELP1AjlxDjdAPMX22Txcuw45elXk2-zoHp0F83joIU-B3FuaxjqX6C4WaLQ2S9WhmNU2lpmpYDDXAdki-X72JrDZSXLnccu1tH3udRQB30hqubYmi5se2umO2w8TRrZcfhuwdpj2VxS46A83Ga1wfJtLXm0GAKsT2CBpf1RGvibga7BheTELAcRCKTHOVqtTTsHVVFOAGGHFq4dKcJ8u9VT1ie-x8UEbFoLD8DKL9i4',
      bio: 'Devon has pioneered VR development techniques and has built immersive experiences for major tech companies worldwide.'
    },
    learningPoints: [
      "Set up React Three Fiber projects",
      "Create 3D scenes and interactions",
      "Implement VR controls and navigation",
      "Optimize performance for VR",
      "Build interactive 3D user interfaces",
      "Deploy VR web applications"
    ]
  },
  '4': {
    id: '4',
    title: 'Neural Networks 101',
    description: 'Introduction to building AI models that mimic human cognition.',
    fullDescription: 'Begin your journey into artificial intelligence and machine learning. This course provides a comprehensive introduction to neural networks, teaching you the fundamentals of building AI systems that can learn and adapt.',
    category: 'Cybernetics',
    rating: 5.0,
    ratingCount: 150,
    price: 65.00,
    originalPrice: 179.99,
    discount: 64,
    lastUpdated: 'October 2024',
    language: 'English',
    duration: '16h 45m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtRoOlauygUo-A6rdv7v-N5DzNALaUqp8Q_1R-YVRofeZglJVLSAOKTSq9-dYd84KHVgrncmekx7Vg6NKbE3KS9gngJ6lb6GPkMrWonQykRBae4SUEHQ_dm76Ma5_jvzZxLooe6v_PMVdx031Z5oslU7nHFDNIlpiqCgT01qI0pJeA2o78Wx9jW2-_UQUHyw8h2wqpObIqpdG4Zl1O3b6CKuJjCbhRrMcjaKJPqSYVpziJSWMrWnH8f7Pa4WwxNrc6vOeB5d68Vyc',
    instructor: {
      name: 'Dr. K. Sato',
      role: 'AI Researcher & Neural Networks Expert',
      rating: 5.0,
      students: 28000,
      courses: 6,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_uhT2atQVb-1pVqQdrLOIB8-W3LHKxP8wRamEL9yLWduHQIcreGqIGAhYAXLATgsnmX3XRFbXv5nIy5kUIreHNN20PzwhsEV6o3tzM26sP219UzuzQhJn79FcJNte9_DH2Xy_tqYIP35PhdGJuc7jDOAzpom8tUzD6DaGyds6xgGk0r8zWaqwsa2OzATC5f09LIf0keBOCAHFncxWO5Xp9Lpb1V1ccPQqIi_Yv6ecX_kCZ97ZXHXUcSkPtoyn6ev2eqoc5AocDO0',
      bio: 'Dr. Sato is a leading researcher in artificial intelligence with numerous publications on neural network architectures and deep learning.'
    },
    learningPoints: [
      "Understand neural network fundamentals",
      "Build your first neural network from scratch",
      "Learn backpropagation and gradient descent",
      "Implement convolutional neural networks",
      "Apply networks to real-world problems",
      "Optimize and fine-tune model performance"
    ]
  },
  '5': {
    id: '5',
    title: 'Exoplanet Habitability',
    description: 'Analyzing atmospheric data to find life beyond Earth.',
    fullDescription: 'Explore the fascinating field of exoplanet research and astrobiology. Learn how scientists analyze atmospheric composition and environmental conditions to determine which planets might harbor life beyond our solar system.',
    category: 'Astrophysics',
    rating: 4.6,
    ratingCount: 540,
    price: 34.99,
    originalPrice: 89.99,
    discount: 61,
    lastUpdated: 'June 2024',
    language: 'English',
    duration: '6h 30m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHYSoR8d6_DR90sFegjKnU8D9RMfkF-jaENTxgH8vVb84KnTn727kUijRqxoYVfrzABAhXsmtdP6YScEPDnicQ2FMGdRql46bt0MGwqI9ttdJknFkPnvAwDYDpzuS0rXDrEJm9BnNefvM4Fsm5bHAB_PlXhtgFSzpCukc8JMZCg56K9W4cXjD6jWdUgAyNWkSxL2N_c6C7mDl25bjvC0t11-Kbk3JH9X06gMdya_1pQYOBa3pGNtW7S4Qz_uhdA75FOTFp44rpFt8',
    instructor: {
      name: 'Mark T.',
      role: 'Astronomer & Exoplanet Specialist',
      rating: 4.7,
      students: 18000,
      courses: 5,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbFGnF3C61YJGjXgxE8pj3dseqju2K2TYW0zxJNOKVFJ3_dUrY58zofrpyXI0HkPg2W8u18YgMTFuBB_rQ1mctAVzxnQS0Pqu1T78VcZ5y4OZvouPEckXW72T42RWcQCotTpF_-YXthHjarnrqKZr4WD4RaS9XAK_P_w9HU9G2deyMJHTnuSs-2w5hpmGSGKeX5B1TE4mGf82O4Eu7w4poqLznSObtH2wBsc3g9ikke6Xq6H4ZT3SC32Q9w_slrihnHIq3jK8wNWA',
      bio: 'Mark has dedicated his career to the search for habitable worlds, using advanced spectroscopy to analyze distant planetary atmospheres.'
    },
    learningPoints: [
      "Understand the habitable zone concept",
      "Learn spectroscopic analysis techniques",
      "Identify biosignature gases",
      "Evaluate planetary habitability factors",
      "Study exoplanet detection methods",
      "Explore the latest discoveries in the field"
    ]
  },
  '6': {
    id: '6',
    title: 'Big Data Visualization',
    description: 'Turning millions of data points into beautiful, actionable stories.',
    fullDescription: 'Master the art and science of data visualization. Learn how to transform complex datasets into compelling visual narratives that drive insight and decision-making across organizations.',
    category: 'Data Science',
    rating: 4.9,
    ratingCount: 2100,
    price: 99.99,
    originalPrice: 249.99,
    discount: 60,
    lastUpdated: 'August 2024',
    language: 'English',
    duration: '45h 00m',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWxENdZPzrdLDD0BDidTbeLVd96MxM9eDxrwv1JKEIYPsbG-LSjKFfjWCXWJ1ynY1TXx42CR34aWInwktca4vGPGuASJBrx3bcrnuSvloV0z-8zEb9LjQD4G3BepEvRbsnyUI6AHvCey7lMHlZsS_Gbfy6z7C8ztQ17g6kwvAG0ezZyt3gAjIc0cPiLu9HoLo6k9NK4-UjhZ6V6DFDbB5zspAFQA8U8szKY_bJK5oy4Dl_ug1QmpP7Oiulug3v6LJckJiDeXX_TMU',
    instructor: {
      name: 'Elena R.',
      role: 'Data Scientist & Visualization Expert',
      rating: 4.9,
      students: 67000,
      courses: 18,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8OngGDuWU2UhnF-MhoCu4dhfWJ3CuPekrcLaawBeKTFq1qJ8UElNilakbfSIQm-yYtqXNOasNUzMEIJahwMnK_clT2ax1Zbkp0d-2g13z-LGq2zm6BWDcUf2e3L_i22BD2dsMpRW2sVRZY_YdAOZ3YwpuXX6r2Kuun8xLUsPOm1TXJDUMnz8vI-LUKU5k2BdwJVebAYvKy0yyUQNgeORHPDOxSqaP8XAT-Nr0x9OoyEGjgVZuj6YthMwXl5sKADXZihMyI6B8vzM',
      bio: 'Elena has worked with Fortune 500 companies to transform their data into actionable insights through beautiful and effective visualizations.'
    },
    learningPoints: [
      "Master D3.js and modern visualization libraries",
      "Design effective charts and graphs",
      "Create interactive dashboards",
      "Tell compelling stories with data",
      "Optimize visualizations for performance",
      "Apply design principles to data viz"
    ]
  }
};

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const course = coursesData[courseId] || coursesData['1']; // Fallback to course 1 if not found
  
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    intro: true,
    psychology: false,
    neon: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="bg-[#0D071E] text-white font-display overflow-x-hidden min-h-screen flex flex-col antialiased">
      <Header />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8 lg:gap-10">
        {/* Left Column */}
        <div className="flex flex-col min-w-0">
          {/* Breadcrumb */}
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2 items-center mb-6"
          >
            <a className="text-slate-400 hover:text-violet-400 text-sm font-medium transition-colors" href="#">Home</a>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <a className="text-slate-400 hover:text-violet-400 text-sm font-medium transition-colors" href="#">Design</a>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-violet-400 text-sm font-medium">UI/UX Strategy</span>
          </motion.div>

          {/* Course Title */}
          <motion.div 
            variants={slideInFromBottom}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-white text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-4" style={{ textShadow: '0 0 20px rgba(167, 139, 250, 0.4)' }}>
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="font-bold text-white mr-1">{course.rating}</span>
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                <StarHalf className="w-4 h-4 fill-current text-yellow-500" />
                <span className="text-slate-400 ml-1">({course.ratingCount.toLocaleString()} ratings)</span>
              </div>
              <span className="hidden sm:inline text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Last updated {course.lastUpdated}</span>
              </div>
              <span className="hidden sm:inline text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>{course.language}</span>
              </div>
            </div>
          </motion.div>

          {/* Video Preview */}
          <motion.div 
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group mb-10 shadow-2xl shadow-violet-900/10"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-70 transition-opacity duration-500" 
              style={{ backgroundImage: `url('${course.image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="flex items-center justify-center size-20 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
                Preview Course
              </div>
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
                02:14
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="border-b border-white/10 mb-8"
          >
            <nav aria-label="Tabs" className="flex space-x-8 min-w-max overflow-x-auto pb-px">
              {['Overview', 'Curriculum', 'Instructor', 'Reviews'].map((tab, index) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? 'border-violet-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </nav>
          </motion.div>

          {/* Tab Content */}
          <div className="space-y-10">
            {/* What you'll learn */}
            <motion.div 
              variants={slideInFromBottom}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="bg-[#1A1333] border border-white/5 rounded-2xl p-6 lg:p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">What you'll learn</h3>
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {course.learningPoints.map((item, index) => (
                  <motion.div 
                    key={index} 
                    variants={staggerItem}
                    className="flex gap-3 items-start"
                  >
                    <Check className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Description */}
            <motion.div 
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
              className="text-slate-300 leading-relaxed space-y-4"
            >
              <h3 className="text-xl font-bold text-white mb-2">Description</h3>
              <p>{course.fullDescription}</p>
              <p>You will learn to balance high-fidelity visuals with usability, ensuring that even the most complex data visualizations are intuitive and accessible. From the psychology of color in dark environments to the physics of motion in zero-gravity UIs, we cover it all.</p>
            </motion.div>

            {/* Course Content */}
            <motion.div
              variants={slideInFromBottom}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-bold text-white mb-6">Course Content</h3>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                {[
                  { id: 'intro', title: 'Introduction to Deep Space Design', lectures: '3 lectures • 14min' },
                  { id: 'psychology', title: 'The Psychology of Dark Mode', lectures: '5 lectures • 42min' },
                  { id: 'neon', title: 'Neon & Glow: Advanced CSS Effects', lectures: '8 lectures • 1hr 15min' }
                ].map((section, index) => (
                  <motion.div 
                    key={section.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`bg-[#1A1333] ${index !== 2 ? 'border-b border-white/5' : ''}`}
                  >
                    <motion.button
                      onClick={() => toggleSection(section.id)}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      className="w-full flex items-center justify-between p-4 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        {expandedSections[section.id] ? (
                          <ChevronDown className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                        )}
                        <span className="font-semibold text-white">{section.title}</span>
                      </div>
                      <span className="text-sm text-slate-400">{section.lectures}</span>
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Instructor */}
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-xl font-bold text-white mb-6">Instructor</h3>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#1A1333] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="size-20 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20"
                >
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Portrait of instructor" 
                    src={course.instructor.image}
                  />
                </motion.div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">{course.instructor.name}</h4>
                  <p className="text-violet-400 text-sm mb-3 font-medium">{course.instructor.role}</p>
                  <div className="flex gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> {course.instructor.rating} Rating
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {course.instructor.students.toLocaleString()} Students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5" /> {course.instructor.courses} Courses
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {course.instructor.bio}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <motion.div 
          variants={slideInRight}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <motion.div 
            whileHover={{ y: -4 }}
            className="sticky top-24 bg-[#1A1333] border border-white/5 rounded-2xl p-6 shadow-xl shadow-black/40"
          >
            {/* Pricing */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-white">${course.price.toFixed(2)}</span>
              <span className="text-lg text-slate-500 line-through mb-1.5">${course.originalPrice.toFixed(2)}</span>
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-500 text-sm font-bold mb-2 ml-auto border border-pink-500/20">{course.discount}% OFF</span>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-6 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <Clock className="w-4 h-4" />
              <span>5 hours left at this price!</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ 
                  boxShadow: [
                    '0 10px 30px rgba(168, 85, 247, 0.3)',
                    '0 10px 40px rgba(168, 85, 247, 0.5)',
                    '0 10px 30px rgba(168, 85, 247, 0.3)'
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-full h-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 flex items-center justify-center gap-2"
              >
                Add to Cart
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 rounded-full bg-transparent border border-white/20 text-white font-bold text-base transition-colors"
              >
                Buy Now
              </motion.button>
            </div>

            {/* Money-back guarantee */}
            <div className="text-center text-xs text-slate-400 mb-6">
              30-Day Money-Back Guarantee
            </div>

            {/* Course Includes */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h4 className="font-bold text-white text-sm">This course includes:</h4>
              <ul className="space-y-3">
                {[
                  { icon: Video, text: '12 hours on-demand video' },
                  { icon: FileDown, text: '15 downloadable resources' },
                  { icon: InfinityIcon, text: 'Full lifetime access' },
                  { icon: Smartphone, text: 'Access on mobile and TV' },
                  { icon: Award, text: 'Certificate of completion' }
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-slate-400">
                    <item.icon className="w-4 h-4 text-violet-400 shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center px-1">
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Share</button>
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Gift course</button>
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Coupons</button>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 bg-[#1A1333] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Rocket className="w-5 h-5 text-violet-400" />
            <span className="font-bold tracking-tight">Cosmos Learn</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 Cosmos Learn Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
