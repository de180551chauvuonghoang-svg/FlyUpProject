import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../services/courseService';
import { getImageUrl } from '../utils/imageUtils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StatsSection from '../components/StatsSection';
import LearningPathsSection from '../components/LearningPathsSection';
import CourseBenefitsSection from '../components/CourseBenefitsSection';
import HeroSection from '../components/HeroSection';

// ... (remaining imports)
// I will just replace the top imports and the CourseCard/FeaturedCoursesSection
// functionality. Wait, `replace_file_content` works on contiguous blocks.
// I'll do imports first, then the sections.

// Actually I can do one `replace_file_content` for imports, and another for the components if they are far apart.
// Lines 1-9 are imports.
// Lines 42-83 are COURSES constant.
// Lines 194-218 are CourseCard.
// Lines 221-235 are FeaturedCoursesSection.

// I will do imports first.

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
  { name: 'Design', icon: 'palette', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  { name: 'Development', icon: 'code', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' },
  { name: 'Marketing', icon: 'campaign', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  { name: 'Business', icon: 'trending_up', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
  { name: 'Photography', icon: 'photo_camera', bgColor: 'bg-pink-500/20', textColor: 'text-pink-400' },
  { name: 'Lifestyle', icon: 'self_improvement', bgColor: 'bg-teal-500/20', textColor: 'text-teal-400' },
];

// Courses data


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



// Categories Section Component
const CategoriesSection = () => (
  <section className="px-4 md:px-10 py-8">
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Explore Categories</h2>
        <a className="hidden md:flex items-center gap-1 text-primary font-bold text-sm hover:underline" href="#">View All <span className="material-symbols-outlined text-lg">arrow_forward</span></a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {CATEGORIES.map((category, index) => (
          <a key={index} className="snap-start shrink-0 group flex items-center gap-3 p-2 pr-6 rounded-full bg-[#16161e] border border-[#2a2a3a] hover:border-primary/50 transition-all" href="#">
            <div className={`w-10 h-10 rounded-full ${category.bgColor} ${category.textColor} flex items-center justify-center`}>
              <span className="material-symbols-outlined">{category.icon}</span>
            </div>
            <span className="font-bold text-sm text-white">{category.name}</span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

const formatVNPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('vi-VN');
};

// Course Card Component
const CourseCard = ({ course }) => {
    const navigate = useNavigate();

    return (
      <div 
        onClick={() => navigate(`/courses/${course.id}`)}
        className="group flex flex-col bg-[#16161e] rounded-2xl overflow-hidden border border-[#2a2a3a] hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20 cursor-pointer h-full"
      >
        <div className="relative aspect-video overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{backgroundImage: `url('${getImageUrl(course.image)}')`}}></div>
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 text-white">
            <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            {course.rating}
          </div>
        </div>
        <div className="flex flex-col flex-1 p-5 gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 px-2 py-1 rounded`}>{course.category}</span>
          </div>
          <h3 className="text-lg font-bold leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-auto">
            <span>{course.instructorName}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#2a2a3a]">
            <span className="text-xl font-bold text-white">{formatVNPrice(course.price)}₫</span>
            <button className="bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-sm px-4 py-2 rounded-full transition-all">Enroll Now</button>
          </div>
        </div>
      </div>
    );
};

// Featured Courses Section Component
const FeaturedCoursesSection = () => {
    const { data: coursesData, isLoading, error } = useQuery({
        queryKey: ['featuredCourses'],
        queryFn: () => fetchCourses({ page: 1, limit: 4 }), // Fetch top 4 courses
        staleTime: 1000 * 60 * 5,
    });

    const courses = coursesData?.courses || [];

    return (
      <section className="px-4 md:px-10 py-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Featured Courses</h2>
            <p className="text-gray-400">Hand-picked by our experts for you.</p>
          </div>
          
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-[#16161e] rounded-2xl overflow-hidden border border-[#2a2a3a] h-[380px] animate-pulse">
                        <div className="h-48 bg-white/5"></div>
                        <div className="p-5 space-y-4">
                            <div className="h-4 bg-white/5 rounded w-1/3"></div>
                            <div className="h-6 bg-white/5 rounded w-3/4"></div>
                            <div className="h-4 bg-white/5 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
             </div>
          ) : error ? (
              <div className="text-center py-10 text-red-400">Failed to load courses. Please try again later.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
                ))}
            </div>
          )}
        </div>
      </section>
    );
};

// Why Choose Section Component
const WhyChooseSection = () => (
  <section className="px-4 md:px-10 py-16 bg-[#0d0d16]">
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
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">Why Choose FlyUp?</h2>
          <p className="text-gray-400 text-lg">We provide a seamless learning experience designed to help you succeed in your career and personal life.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#16161e] border border-[#2a2a3a] hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h3 className="font-bold text-lg text-white">Expert Instructors</h3>
            <p className="text-sm text-gray-400">Learn from industry leaders who have real-world experience.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#16161e] border border-[#2a2a3a] hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mb-2">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <h3 className="font-bold text-lg text-white">Certified Learning</h3>
            <p className="text-sm text-gray-400">Earn recognized certificates to boost your LinkedIn profile.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#16161e] border border-[#2a2a3a] hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 mb-2">
              <span className="material-symbols-outlined">all_inclusive</span>
            </div>
            <h3 className="font-bold text-lg text-white">Lifetime Access</h3>
            <p className="text-sm text-gray-400">Pay once, learn forever. Revisit course material anytime.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#16161e] border border-[#2a2a3a] hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mb-2">
              <span className="material-symbols-outlined">devices</span>
            </div>
            <h3 className="font-bold text-lg text-white">Learn Anywhere</h3>
            <p className="text-sm text-gray-400">Switch seamlessly between your computer, tablet, and mobile.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Testimonial Card Component
const TestimonialCard = ({ testimonial }) => (
  <div className="bg-[#16161e] p-6 rounded-2xl border border-[#2a2a3a] shadow-sm relative">
    <span className="material-symbols-outlined absolute top-6 right-6 text-primary/20 text-4xl">format_quote</span>
    <div className="flex items-center gap-4 mb-4">
      <img alt="User" className="w-12 h-12 rounded-full object-cover" src={testimonial.image}/>
      <div>
        <h4 className="font-bold text-sm text-white">{testimonial.name}</h4>
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
    <p className="text-gray-400 text-sm italic">{testimonial.text}</p>
  </div>
);

// Testimonials Section Component
const TestimonialsSection = () => (
  <section className="px-4 md:px-10 py-20">
    <div className="text-center max-w-2xl mx-auto mb-12">
      <h2 className="text-3xl font-bold mb-4 text-white">What Our Students Say</h2>
      <p className="text-gray-400">Join a community of lifelong learners who are achieving their goals.</p>
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
        <StatsSection />
        <CategoriesSection />
        <LearningPathsSection />
        <FeaturedCoursesSection />
        <CourseBenefitsSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
