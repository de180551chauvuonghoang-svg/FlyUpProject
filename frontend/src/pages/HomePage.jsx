import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Image URLs from the template
const IMAGES = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdVIP9ci5W3JDSF0ynyZ8un4p6elYAKnk8sVDb6tDVuDFsemmfG8-I74wwniUDziY6DSOY0zopCOR2JYhin-pmKV4nJ0Cre4_nB4cVL63TRRiinJXedkaXUJuF-XyVsYALnUI8j1-LOM2Gkyx2g1gXFR0m91Vt0lzgLay54YkDmPNHcKRnFSw4RepryP2vTZctf9eLxlhqZCITVle6v3Armek7xsOeaGINxa-Jh-w8v5NA0aSXF5opW9Y3OWNX1a_oMvgjMEC5E0I",
  student1: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTE_0chPEGpJYTZuDu2mDF8EbH6surjeQmKGbaQpRAQmZolc0u61Ujv_U49mK8OpX9VzqGSDQP1m8zQLFtaG-RnS9szE8571FQ84vshXoUd1ViqiiKSUn8fqujbmqocHPM7RZ8QS0opDVoIQ-jM29iyUYOGPZAO01KQAPIlpHgwpc7J9Lfv7NdMUhKKHd15YEgbUGa1HCrGK-NjDsATjrh-nnBIl7mF_RKUTFOG5EuwR-kc-xYuxHBt9Bj-j8IUzOGAp9Rp9srg2Q",
  student2: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXnpAvqQK2jJS--RRDv5jIMlzVheVdyDcXslHVcU2203bPRW5CKLPy1yBBWl_i43pMU-H3OoO17LYvtSNc8fSd5nCyVZWjYHgwNgythVbHsYuU1L1KB6UmHh6nbkntT0ojqkAjXm82OBS-sSK4muzUxaCZM4Fmqh9C0KZC6UTcs0fI08llhEV1U7LLJ6SQYPus4K565vkn7uvsi2viW-32dwTnKyMD-qt3lGaPNa0djlJT_z4_xgOYyyYyIr-xPFECgjTQTAMXkU",
  student3: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6mnzLbtRlv2p_u4nIV9fldGyk0pMMd1BNV9GMJNV3qujerYIeEq6Y_Iy13cZ_K0VIqSevDt-5d4DGK5IC2NETa3QJfXJXE2Zs2bCktJ9VqkLAjWHdllFsIB5k2X919bVDclJrEIl2bF28BXkcCjPmB7RQJ29HiPivr42_KyaJiIczcs9pSEGPClDTO89AG_EjHSapWX7bR3NDFx4t5coCungHK8T7PL1nqwGldsc-XDmZijKnL46wdgN5mBFgS-tiqBNe1cEEu60",
  course1: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-1F1ra35mjJAtiBbLBvFXfNBVDZdzKEQvVoOFSnjSFbIIHBtKdIY7-Rkjzy9CsL62mww8EsomAIgjszGteDPjv-z_s-Pee0G1NtjkLjLvIEPMmNQev3R4LtGKy9kl8FYDeB4YMyCmG4zUUGBl2r2lmlqfohhXDDhkAh3vjgRvBLzCGU2-nBZpx8bQeWNE9h62O6Ji8V2ZTfXPNAkY7jPrpqTZZh5enudpDvxwjXvz1T6Uci-0oha1IXO0MCrqY5jlJMeOR-BKt9Y",
  course2: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcyhlP-uV0D3fXyAt7TWsMWvF1BIRMwpaGGb1yIt-SXYdQc82oAj9IamZOeBO29xPYB1_bEHdHBDBcTkSGQtTeLdDeNKTus-c0qkMIArdm0ntva74m084LM4kfPRpnexRzsp1qgmBIv6DaY1vzKP5rH5K61tL-VSqcpOdoMqt3PSIgzUaDs0URLpWY7ygx3BUWKJHNVMq5QUMlVksBhbP_7GtjrQ_hhSB_GlSFl9eJaYOheaQ-PHbOSHNwuzfS9mqDaECZ46rMJX8",
  course3: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwJCJ2VVHHfJPeL8d-yqdgm3dQRxyZUyLHeEF5cLQ3mQ8qKC81d2yDcUZOhT3_GDsFnFVgX6mxJVP9wfacsrxkXxMx4AoeS3lZz1-PHgrCA-lgZOjhHmzBIHjYcZv10z7gyTSssGwYl19o4HVhC9sC3RbImhaj1dEde_9tXtzQfP2mpghW1OMu3nCWuEgGJ8EAAcqe_zT8tbjjf628bwgOB7flwSkj2Cf3HTg8h6ukBU0Tbg7xVjyfWdmyvjoJH1I8ReB6AYGnpNs",
  course4: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5DzK5jnnnAwJe1gS0GRc-HtXy1OFygdnrA3FO5wkv20PLxBranyKIVjzUFCZfYKyz2Ru75Srn1Rhia_jR3aaEqDHeGLr6hXur8OMHurPw6EsSHoo540nw83OKvcxy7J8ta_GCIIwTtcVRTriduDcuBQeMZhR2B2oYiBg_u2zhXLdH1J9_OZYc5ElNmMUG9eeT1wfwUMSpPHBGDd7tlb2oHxY_WJcVhoeWPMaiLPF-nOL-GsE_1K6ZwhXz2P1IijTjp31cupJeQMA",
  instructor1: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAJdsBnUu6ZxewqiiemzUwXSlD2hiogRA1Rp6e9Z1KL-gnmimlHVMmJKZoglkGKDGxD9WSpz6St9DHkZx7qzyRg3mXxhQttVEJIwHzl2iIAPPqFzjJvfL4IINAJHwNtQGOMdHRc59sEIMjYBnMcNFwgawjhcnnq1bkjPl5uMC-ok2cLFrLXELBTzgJKkrnGleck-FLLpG6q7HGEIEzgfV3BoXd02PRpzQaDF1HKZQvi8N9krNZSzbnJu4w72aSuCUHcMJCnq6kM1o",
  instructor2: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpzkMpLWtyj7_zT3oFboX7Ji9qgRYL1rW7E5A98VKC-AyjhxF87gNB8RHVkz9-PnHFxGSg4qeYyf7GdcGLbUyn9Q99lK9PF8DTuSHdVn4mfw9XWwLXbg4qqAduzit2O1SKIuMuR-BZRV9FjJyBpVPGvW-KcKGEVsql9MPKsmRqNOIPFoUWrW247vJ8HvuDMSl59gfexmZ1XJsyplepxXTr_sab_763-f6D3W-cT35mOdoDjYP2SCGNhXK5_oHijco896GzAQDpoZI",
  instructor3: "https://lh3.googleusercontent.com/aida-public/AB6AXuCangn10Baco07yOk0L-K5DmDpIBXx6-J0KuGD-2Jtno4N8Pq_MWR6ueKmEgqpyjjNWIPuKfujueIQ2O96vEiHLmDDOKGSiN56kW_HlcCziiS2qriqqvYmIu2Mu5g5o3ThJSzWTFq8OMF4ct5tVpHsz8-9ZRRwrL1iCVNdF2fEArI6qy7_wtm0x42DEAqPBC2LEGQtn705n_hxP36Q43G9cIc_WJHpsA_YZBNlGfnqh7WfWo67ZpJtptakyEFDCyhhV8gZUDWUAFp8",
  instructor4: "https://lh3.googleusercontent.com/aida-public/AB6AXuBe7LGmaE9POZkmz56UGBYlwReMOk0lcdeSFvhYlp5B1-6oiYSjQUfigjuE52tI7cYA33eqfijpYdGPFV-EEflWA3b3qBVUdIhlGuZ3HokNMnVkPF-KmZwubz9ww6AqQvIHdPPmHZqEksNRod6Do06TogzeKV0vjvFpLWlO8cqlggZ1UJym9GqW7LUZErqy8OjJ1m7f1pY3EfhJxPV_cZTCE3S-YwYYLclMKzb7zfy6igvQ0Cpg84lULOVU4jTqbG0qj_1eQMT11xM",
  whyChoose: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUlCH_E-R3arUem3fug_VGEmc6e_dycY21xljf0HBH_7OuKOKY7GysO7iNPmfcPbRQPqz_Dnc9F43hHtN2i5kAdVl7djwUWf-yt9t5dDINShHVNcxCUqWtqUkxgXUzk8G_stz9zRleMhMgPRSvbPvJ2EbC_nasXr_wn-sIVtNteJbIXqyzSgj2LOnMuAIbR4Gx8mnwyNDyi28ioSpNP9Xv_zpsdLM1EWj9NBHwCrRkMgJuqxOswZCh9amqBDC0j-sxvxpD_jDNOgg",
  testimonial1: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_xDSNMXTbTuVbAR6JGCJs_35puxeePac7v5cu3ASzVKLa-Ow9jbcoSO8RvzXZblN5qmlaJscvg3iNngHlcagXHOSX7mridjY9y6Y9U3kTjn_h0D0LX4zRS7JWsDAZcP1RMsWpQN_3B3XWBWzAYKppq6YqcML65xRi9YSoqrPc_puLGT9Gy7dI6PaFV0780aj3O4AEWzGHe6TXR7FQKzaX09iyalUnrYXWugFwIGVblgd2EpHzUJdgRE7mwz7FvBN74K0Qlg7zj_0",
  testimonial2: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNc2ros813-5l2pTETYRjWlsZzgijUgvNOpskqWSJvv_BNbpGbj-OhxJoQsEjyCK4OZ6ByanAm1nPCibHV2NUQUHH7bF7Q7Qm3Mm1RrAK_2WFLuKFsEnnm_y1wUbdq-4Z3u3kYLi9vVnqvj45vvuzHj0d9KhLvX7RmUoQq0eoiF5VrsKsfNXjC-jd6Iu7OTBNqZ40ugaprGMT2tRJzAZ2UN2TdB7Ma_SavmA5M2_R_n2rYTMQl2KiZqfuMfp4eSXCMclmIALZsSDg",
  testimonial3: "https://lh3.googleusercontent.com/aida-public/AB6AXuBs5MvUny-QnlwgPS1EXzw4rEAriMcvSS_t_1bLwFYqFs6WWWjeeH6HEfimUFLFdxpS_VkGDdMSzrftv0emh5_GxPNJSdi4CW-xE3UR-H8Maxhb8UBDAE_M3waANn3CSiXCtK3VdYTbNHkVZ49aIiSR69UfVt6ExIZXAHhBxJtVhMq_nEEwf64fSqXJkniD79kAYQAVVPDVDTe4N-_r1ZDtu2krOefld4uqzYaKgoMjsMOZwZS6rgBRyhDFgjnjxAeo3GY_X1wPpT8",
};

// Categories data
const CATEGORIES = [
  { name: 'Design', icon: 'palette', bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-300' },
  { name: 'Development', icon: 'code', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-300' },
  { name: 'Marketing', icon: 'campaign', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-300' },
  { name: 'Business', icon: 'trending_up', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-300' },
  { name: 'Photography', icon: 'photo_camera', bgColor: 'bg-pink-100 dark:bg-pink-900/30', textColor: 'text-pink-600 dark:text-pink-300' },
  { name: 'Lifestyle', icon: 'self_improvement', bgColor: 'bg-teal-100 dark:bg-teal-900/30', textColor: 'text-teal-600 dark:text-teal-300' },
];

// Courses data
const COURSES = [
  {
    title: 'Complete Web Development Bootcamp 2024',
    category: 'Development',
    categoryColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    image: IMAGES.course1,
    rating: '4.9',
    instructor: 'Dr. Angela Yu',
    instructorImage: IMAGES.instructor1,
    price: '$89.99',
  },
  {
    title: 'UI/UX Design Masterclass: From Zero to Hero',
    category: 'Design',
    categoryColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    image: IMAGES.course2,
    rating: '4.8',
    instructor: 'Sarah Jones',
    instructorImage: IMAGES.instructor2,
    price: '$49.99',
  },
  {
    title: 'Business Strategy: Start Your Own Agency',
    category: 'Business',
    categoryColor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    image: IMAGES.course3,
    rating: '4.7',
    instructor: 'Michael Scott',
    instructorImage: IMAGES.instructor3,
    price: '$65.00',
  },
  {
    title: 'Digital Marketing & SEO Analytics',
    category: 'Marketing',
    categoryColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    image: IMAGES.course4,
    rating: '5.0',
    instructor: 'Emily Chen',
    instructorImage: IMAGES.instructor4,
    price: '$39.99',
  },
];

// Testimonials data
const TESTIMONIALS = [
  {
    name: 'Jessica Miller',
    image: IMAGES.testimonial1,
    rating: 5,
    text: '"I was skeptical about online courses, but this platform changed my mind. The instructors are engaging and the projects are very practical."',
  },
  {
    name: 'David Chen',
    image: IMAGES.testimonial2,
    rating: 4.5,
    text: '"The content is up-to-date and relevant. I used the skills I learned here to land my first job as a Junior Developer!"',
  },
  {
    name: 'Amanda Lee',
    image: IMAGES.testimonial3,
    rating: 5,
    text: '"Fantastic platform. The community is very supportive, and the ability to learn at my own pace was exactly what I needed."',
  },
];

// Hero Section Component
const HeroSection = () => (
  <section className="px-4 md:px-10 py-12 lg:py-20">
    <div className="@container">
      <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex flex-col gap-6 lg:w-1/2 items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New Courses Added Weekly
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight">
            Unlock Your Potential with <span className="text-primary">Expert-Led</span> Courses
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            Master new skills in design, coding, business, and more. Learn from industry leaders and start building your future today with our comprehensive curriculum.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button className="h-12 px-8 rounded-full bg-primary text-white font-bold text-base hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-1">
              Start Learning
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
            <button className="h-12 px-8 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent text-slate-900 dark:text-white font-bold text-base hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">grid_view</span>
              Browse Courses
            </button>
          </div>
          <div className="flex items-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex -space-x-3">
              <img alt="Student portrait" className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark" src={IMAGES.student1}/>
              <img alt="Student portrait" className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark" src={IMAGES.student2}/>
              <img alt="Student portrait" className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark" src={IMAGES.student3}/>
              <div className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 dark:bg-surface-dark flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white">
                +2k
              </div>
            </div>
            <p>Join over 2,000+ happy students</p>
          </div>
        </div>
        <div className="lg:w-1/2 w-full relative">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-50"></div>
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-surface-dark">
            <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: `url("${IMAGES.hero}")`}}></div>
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center gap-4 text-white">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl">play_circle</span>
              </div>
              <div className="flex-1">
                <div className="text-sm opacity-80">Continue Watching</div>
                <div className="font-bold">Advanced Web Development</div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full w-2/3 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Categories Section Component
const CategoriesSection = () => (
  <section className="px-4 md:px-10 py-8">
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">Explore Categories</h2>
        <a className="hidden md:flex items-center gap-1 text-primary font-bold text-sm hover:underline" href="#">View All <span className="material-symbols-outlined text-lg">arrow_forward</span></a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {CATEGORIES.map((category, index) => (
          <a key={index} className="snap-start shrink-0 group flex items-center gap-3 p-2 pr-6 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 transition-all" href="#">
            <div className={`w-10 h-10 rounded-full ${category.bgColor} ${category.textColor} flex items-center justify-center`}>
              <span className="material-symbols-outlined">{category.icon}</span>
            </div>
            <span className="font-bold text-sm">{category.name}</span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

// Course Card Component
const CourseCard = ({ course }) => (
  <article className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-all hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
    <div className="relative aspect-video overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{backgroundImage: `url('${course.image}')`}}></div>
      <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
        <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
        {course.rating}
      </div>
    </div>
    <div className="flex flex-col flex-1 p-5 gap-4">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${course.categoryColor} px-2 py-1 rounded`}>{course.category}</span>
      </div>
      <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-auto">
        <img alt="Instructor" className="w-6 h-6 rounded-full" src={course.instructorImage}/>
        <span>{course.instructor}</span>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
        <span className="text-xl font-bold text-slate-900 dark:text-white">{course.price}</span>
        <button className="bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-sm px-4 py-2 rounded-full transition-all">Enroll Now</button>
      </div>
    </div>
  </article>
);

// Featured Courses Section Component
const FeaturedCoursesSection = () => (
  <section className="px-4 md:px-10 py-12">
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
        <p className="text-gray-500 dark:text-gray-400">Hand-picked by our experts for you.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {COURSES.map((course, index) => (
          <CourseCard key={index} course={course} />
        ))}
      </div>
    </div>
  </section>
);

// Why Choose Section Component
const WhyChooseSection = () => (
  <section className="px-4 md:px-10 py-16 bg-white dark:bg-[#151421]">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="order-2 lg:order-1 relative">
        <div className="relative w-full aspect-square max-w-md mx-auto">
          <div className="absolute inset-4 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative h-full w-full bg-cover bg-center rounded-3xl shadow-2xl overflow-hidden" style={{backgroundImage: `url('${IMAGES.whyChoose}')`}}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
              <div className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-xl text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 h-2 w-2 rounded-full"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Live Now</span>
                </div>
                <p className="font-bold text-lg">"The future of learning is flexible and accessible."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="order-1 lg:order-2 flex flex-col gap-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Why Choose CoursePlatform?</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">We provide a seamless learning experience designed to help you succeed in your career and personal life.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h3 className="font-bold text-lg">Expert Instructors</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Learn from industry leaders who have real-world experience.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mb-2">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <h3 className="font-bold text-lg">Certified Learning</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Earn recognized certificates to boost your LinkedIn profile.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 mb-2">
              <span className="material-symbols-outlined">all_inclusive</span>
            </div>
            <h3 className="font-bold text-lg">Lifetime Access</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pay once, learn forever. Revisit course material anytime.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mb-2">
              <span className="material-symbols-outlined">devices</span>
            </div>
            <h3 className="font-bold text-lg">Learn Anywhere</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Switch seamlessly between your computer, tablet, and mobile.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Testimonial Card Component
const TestimonialCard = ({ testimonial }) => (
  <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm relative">
    <span className="material-symbols-outlined absolute top-6 right-6 text-primary/20 text-4xl">format_quote</span>
    <div className="flex items-center gap-4 mb-4">
      <img alt="User" className="w-12 h-12 rounded-full object-cover" src={testimonial.image}/>
      <div>
        <h4 className="font-bold text-sm">{testimonial.name}</h4>
        <div className="flex text-yellow-400 text-xs">
          {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
            <span key={i} className="material-symbols-outlined text-[16px] fill-current">star</span>
          ))}
          {testimonial.rating % 1 !== 0 && (
            <span className="material-symbols-outlined text-[16px] fill-current">star_half</span>
          )}
        </div>
      </div>
    </div>
    <p className="text-gray-600 dark:text-gray-300 text-sm italic">{testimonial.text}</p>
  </div>
);

// Testimonials Section Component
const TestimonialsSection = () => (
  <section className="px-4 md:px-10 py-20">
    <div className="text-center max-w-2xl mx-auto mb-12">
      <h2 className="text-3xl font-bold mb-4">What Our Students Say</h2>
      <p className="text-gray-500 dark:text-gray-400">Join a community of lifelong learners who are achieving their goals.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {TESTIMONIALS.map((testimonial, index) => (
        <TestimonialCard key={index} testimonial={testimonial} />
      ))}
    </div>
  </section>
);

// CTA Section Component
const CTASection = () => (
  <section className="px-4 md:px-10 py-12">
    <div className="relative rounded-3xl overflow-hidden bg-primary px-6 py-16 md:px-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl"></div>
      <div className="relative z-10 max-w-xl">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to start your learning journey?</h2>
        <p className="text-white/90 text-lg font-medium">Join thousands of students and start mastering new skills today. No credit card required for free courses.</p>
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row gap-4">
        <button className="h-14 px-8 rounded-full bg-white text-primary font-bold text-lg hover:shadow-xl hover:scale-105 transition-all">Sign Up for Free</button>
      </div>
    </div>
  </section>
);

// Main HomePage Component
const HomePage = () => {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col">
        <HeroSection />
        <CategoriesSection />
        <FeaturedCoursesSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
