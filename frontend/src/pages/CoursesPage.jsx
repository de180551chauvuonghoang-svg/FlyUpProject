import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header/Header';
import { 
    cardStagger, 
    cardItem, 
    slideInFromBottom, 
    scaleInWithBounce,
    chipHover,
    chipTap,
    sidebarSlide
} from '../utils/animations';

const CoursesPage = () => {
    const [selectedLevel, setSelectedLevel] = useState('Intermediate');
    const [selectedPrice, setSelectedPrice] = useState('Paid');
    const [selectedCategory, setSelectedCategory] = useState('All Courses');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const categories = ['All Courses', 'UI/UX Design', 'Space Science', 'VR/AR Dev', 'Astrophysics', 'Cybernetics'];

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white">
            <Header />

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters - Desktop */}
                <motion.aside 
                    variants={sidebarSlide}
                    initial="hidden"
                    animate="visible"
                    className="hidden w-64 flex-col overflow-y-auto border-r border-white/5 bg-[#0D071E] p-6 lg:flex"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Filters</h3>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs text-primary hover:text-white transition-colors"
                        >
                            Reset
                        </motion.button>
                    </div>

                    {/* Difficulty */}
                    <FilterSection title="Level">
                        <div className="space-y-3">
                            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                <CheckboxFilter
                                    key={level}
                                    label={level}
                                    checked={selectedLevel === level}
                                    onChange={() => setSelectedLevel(level === selectedLevel ? '' : level)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Price */}
                    <FilterSection title="Price">
                        <div className="space-y-3">
                            {['All Prices', 'Free', 'Paid'].map((price) => (
                                <RadioFilter
                                    key={price}
                                    label={price}
                                    name="price"
                                    checked={selectedPrice === price}
                                    onChange={() => setSelectedPrice(price)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Ratings */}
                    <FilterSection title="Rating" isLast>
                        <div className="space-y-2">
                            <CheckboxFilter
                                label={
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        {[1, 2, 3, 4].map(i => (
                                            <span key={i} className="material-symbols-outlined text-[16px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        ))}
                                        <span className="material-symbols-outlined text-[16px]">star</span>
                                        <span className="text-xs text-slate-400 ml-1">& Up</span>
                                    </div>
                                }
                            />
                        </div>
                    </FilterSection>
                </motion.aside>

                {/* Mobile Filter Overlay */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                                onClick={() => setIsFilterOpen(false)}
                            />
                            <motion.div
                                initial={{ x: -300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="fixed left-0 top-0 bottom-0 w-64 bg-[#0D071E] border-r border-white/5 p-6 z-50 overflow-y-auto lg:hidden"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="font-semibold text-white">Filters</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsFilterOpen(false)}
                                        className="text-white"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </motion.button>
                                </div>
                                {/* Same filter content as desktop */}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0D071E] p-6 lg:p-10">
                    <div className="mx-auto max-w-7xl">
                        {/* Header Banner */}
                        <motion.div 
                            variants={slideInFromBottom}
                            initial="hidden"
                            animate="visible"
                            className="relative mb-10 overflow-hidden rounded-3xl bg-[#1A1333] px-8 py-10 shadow-2xl"
                        >
                            <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUOloh5Q5m38qNJ5SmcVyl67k6vu60Iat38B7pqJBIJrB9XIYkKuLISnex6wnMzadRuAkeIaJaFXtInqfO-K_116kmRx3p2-geH06POmNAzre5ByPZiz2BB1XKob3mnR4h5Th-UfGS2im32R1-coxPQykArNZnVNhvOUA1FpEWyQMQc-T9mH0S61CCsJplJSHioWiBBWNSkpnlR0NRToOxIE8Fy3ea2mW58jDnZ8sDxG1GpEdPwMy6MpC5W9unMdR-g1LA7ozu64I')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-[#0D071E] via-[#0D071E]/80 to-transparent z-0"
                                animate={{
                                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }}
                                transition={{
                                    duration: 10,
                                    ease: "linear",
                                    repeat: Infinity
                                }}
                            ></motion.div>
                            <div className="relative z-10 max-w-2xl">
                                <motion.div 
                                    variants={scaleInWithBounce}
                                    initial="hidden"
                                    animate="visible"
                                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    New Courses Added
                                </motion.div>
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    className="mb-2 text-4xl font-bold text-white tracking-tight"
                                >
                                    Explore the Universe of Knowledge
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="text-lg text-slate-300"
                                >
                                    Master the skills of tomorrow. From deep space navigation to advanced UI systems.
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* Category Chips */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="mb-8 flex flex-wrap items-center gap-3 overflow-x-auto pb-2 scrollbar-hide"
                        >
                            {categories.map((cat, index) => (
                                <motion.button
                                    key={cat}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                                    whileHover={chipHover}
                                    whileTap={chipTap}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
                                            : 'border border-white/5 bg-[#1A1333] text-slate-300 hover:border-primary/50 hover:bg-[#2e2447] hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* Filter Sort Mobile */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mb-6 flex items-center justify-between"
                        >
                            <p className="text-sm text-slate-400">Showing <span className="text-white font-semibold">24</span> courses</p>
                            <div className="flex items-center gap-2 lg:hidden">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsFilterOpen(true)}
                                    className="flex items-center gap-2 rounded-lg bg-[#1A1333] px-3 py-2 text-sm text-white border border-white/5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                    Filters
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Course Grid */}
                        <motion.div 
                            variants={cardStagger}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            <CourseCard 
                                image="https://lh3.googleusercontent.com/aida-public/AB6AXuC3Zu31-FoGKP_my4-Lafk2xqfyDukuhjCj7FpcMNe7svCReqUCx1F9FaMLeExAtzjEJ_L9OXpLZ7jhczYS17nJsZzAukJHLhRzsfjDWm5XHfeA4-PR3oqRmn4YhCz166UbZqNzuDDkV7fy1r2e_WHBugM-QOw__MsCJBjUaQkxAIoDQoRQtVBasS8wY1YkJATQ96hCtyiRn05yL9nn2JPXY-HXMAY0qx9WBPHvENbXqOv05ky5YNPCN1a2TkfrHd5lMLNbp6qkfos"
                                category="UI/UX"
                                rating="4.9"
                                reviews="1.2k"
                                duration="12h 30m"
                                title="Advanced UI Strategy for Deep Space Systems"
                                desc="Learn to design mission-critical interfaces for zero-gravity environments."
                                instructorName="Sarah Jenks"
                                instructorRole="Lead Designer"
                                instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuDhXVsUn1W6DrL46qXgUu8HGckfDEjHc9bsoOZGICe-WCaGI-WBm8ddIrrGF2dbEmOdGqaymLwv3HAuieOO1fX0l-1Lh1pJEeGkG-cs2VtCBw4n2axEGrTtjpJdleY8qJt5oBB2VsPAG-seZvHdUlA__2y3HIII66qKcsOgAn2sMlD1x5NMkv2kkjjYIb4gekCK-45uvJBrj1gCdSXyiRQEKI1sICDvq-jJKEkAyXHWO88ix6NZFmun_FvU1Axv0K9s6-50R4sGPxY"
                                price="49.99"
                            />
                            <CourseCard 
                                image="https://lh3.googleusercontent.com/aida-public/AB6AXuBBpV8VhxHAccGyYNQSgwcERpMD6XhqIkAM4hun3kbzSwDjDIiqBWKFKdl0os_-82XPmXaIdJdLM9ej7MXMU9fsFguA6Og0UYV5Yy3U2qHcPHKAb6MIj5gy3YFbSuc_0riJXHKfiCXURh4GqWu4-V0Jvm7llNg-vij3Mcog51drnjt9rMKsc7VG1tdFxEUBzVuMFiyajnVS_qttAAWxi6opYscBbG5CT7WEADRi6zNhbHTKt2dJdQytFe8OdX4RDNoqztwoWPVKMLw"
                                category="Science"
                                rating="4.8"
                                reviews="850"
                                duration="8h 15m"
                                title="Nebula Photography Masterclass"
                                desc="Capture the cosmos with advanced telescopic photography techniques."
                                instructorName="Dr. A. Stone"
                                instructorRole="Astrophysicist"
                                instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuBMPJt06NuUJQmzmof1mEQKqr6yW6CZtk3krop_Q0SFsO5v6ED4mwWZQoZGYguLLKliafJLROpMOd3qVHNLEeCByOihnDpV3X-_DdQQWMA3U-tFbZhrqoGwvh0locJqyxh4hWaCMUZ9dBIgBbUlk3kSM7PYFM921ZfaHfNWadsBkCkM6n5rqq87mWng6NK1FiE8DRIfUkPdDPTpkUcLZTPqVgmcuXrY6vxsUp576DP7_hoUYB3oYblmY4Ch44kyvrq-0p6Px_QTnk4"
                                price="89.99"
                            />
                            <CourseCard 
                                image="https://lh3.googleusercontent.com/aida-public/AB6AXuCgYBlUW-I7C0tvtdmAs0PgnVDyz09gXk4cGVcPmCCX_d7qepORN8n8He3qzGzapAQXKYXpBhgJkSqgjCG5gVmfyGC8sOI87wKXnH90ZuzfzZb89fshjfmhUSqjpQ4umo0HGQEFH-lu04F0Hmrul4VOKXcyOd0AzXvH1DsoB_hh8fkVf4Np1z1EgUA_xMjiEImFcPJLVJaOHTke4KrmbbLzjlVWV3cUud2LS1DZmgvCooX-50noIAOYUFyUtWOGUgd-xnC4idkhCOY"
                                category="VR/AR"
                                rating="4.7"
                                reviews="2.3k"
                                duration="24h 00m"
                                title="React for VR Environments"
                                desc="Build immersive 3D web applications using React Three Fiber."
                                instructorName="Devon Lane"
                                instructorRole="Senior Dev"
                                instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuDk5gDw8EY5q9yjBBTtRCEAns73Pf7QQEJ-ELP1AjlxDjdAPMX22Txcuw45elXk2-zoHp0F83joIU-B3FuaxjqX6C4WaLQ2S9WhmNU2lpmpYDDXAdki-X72JrDZSXLnccu1tH3udRQB30hqubYmi5se2umO2w8TRrZcfhuwdpj2VxS46A83Ga1wfJtLXm0GAKsT2CBpf1RGvibga7BheTELAcRCKTHOVqtTTsHVVFOAGGHFq4dKcJ8u9VT1ie-x8UEbFoLD8DKL9i4"
                                price="29.99"
                            />
                            <CourseCard 
                                image="https://lh3.googleusercontent.com/aida-public/AB6AXuBtRoOlauygUo-A6rdv7v-N5DzNALaUqp8Q_1R-YVRofeZglJVLSAOKTSq9-dYd84KHVgrncmekx7Vg6NKbE3KS9gngJ6lb6GPkMrWonQykRBae4SUEHQ_dm76Ma5_jvzZxLooe6v_PMVdx031Z5oslU7nHFDNIlpiqCgT01qI0pJeA2o78Wx9jW2-_UQUHyw8h2wqpObIqpdG4Zl1O3b6CKuJjCbhRrMcjaKJPqSYVpziJSWMrWnH8f7Pa4WwxNrc6vOeB5d68Vyc"
                                category="Cybernetics"
                                rating="5.0"
                                reviews="150"
                                duration="16h 45m"
                                title="Neural Networks 101"
                                desc="Introduction to building AI models that mimic human cognition."
                                instructorName="Dr. K. Sato"
                                instructorRole="AI Researcher"
                                instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuD_uhT2atQVb-1pVqQdrLOIB8-W3LHKxP8wRamEL9yLWduHQIcreGqIGAhYAXLATgsnmX3XRFbXv5nIy5kUIreHNN20PzwhsEV6o3tzM26sP219UzuzQhJn79FcJNte9_DH2Xy_tqYIP35PhdGJuc7jDOAzpom8tUzD6DaGyds6xgGk0r8zWaqwsa2OzATC5f09LIf0keBOCAHFncxWO5Xp9Lpb1V1ccPQqIi_Yv6ecX_kCZ97ZXHXUcSkPtoyn6ev2eqoc5AocDO0"
                                price="65.00"
                            />
                            <CourseCard 
                                image="https://lh3.googleusercontent.com/aida-public/AB6AXuAHYSoR8d6_DR90sFegjKnU8D9RMfkF-jaENTxgH8vVb84KnTn727kUijRqxoYVfrzABAhXsmtdP6YScEPDnicQ2FMGdRql46bt0MGwqI9ttdJknFkPnvAwDYDpzuS0rXDrEJm9BnNefvM4Fsm5bHAB_PlXhtgFSzpCukc8JMZCg56K9W4cXjD6jWdUgAyNWkSxL2N_c6C7mDl25bjvC0t11-Kbk3JH9X06gMdya_1pQYOBa3pGNtW7S4Qz_uhdA75FOTFp44rpFt8"
                                category="Astrophysics"
                                rating="4.6"
                                reviews="540"
                                duration="6h 30m"
                                title="Exoplanet Habitability"
                                desc="Analyzing atmospheric data to find life beyond Earth."
                                instructorName="Mark T."
                                instructorRole="Astronomer"
                                instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuAbFGnF3C61YJGjXgxE8pj3dseqju2K2TYW0zxJNOKVFJ3_dUrY58zofrpyXI0HkPg2W8u18YgMTFuBB_rQ1mctAVzxnQS0Pqu1T78VcZ5y4OZvouPEckXW72T42RWcQCotTpF_-YXthHjarnrqKZr4WD4RaS9XAK_P_w9HU9G2deyMJHTnuSs-2w5hpmGSGKeX5B1TE4mGf82O4Eu7w4poqLznSObtH2wBsc3g9ikke6Xq6H4ZT3SC32Q9w_slrihnHIq3jK8wNWA"
                                price="34.99"
                            />
                            <CourseCard 
                                image="https://lh3.googleusercontent.com/aida-public/AB6AXuAWxENdZPzrdLDD0BDidTbeLVd96MxM9eDxrwv1JKEIYPsbG-LSjKFfjWCXWJ1ynY1TXx42CR34aWInwktca4vGPGuASJBrx3bcrnuSvloV0z-8zEb9LjQD4G3BepEvRbsnyUI6AHvCey7lMHlZsS_Gbfy6z7C8ztQ17g6kwvAG0ezZyt3gAjIc0cPiLu9HoLo6k9NK4-UjhZ6V6DFDbB5zspAFQA8U8szKY_bJK5oy4Dl_ug1QmpP7Oiulug3v6LJckJiDeXX_TMU"
                                category="Data"
                                rating="4.9"
                                reviews="2.1k"
                                duration="45h 00m"
                                title="Big Data Visualization"
                                desc="Turning millions of data points into beautiful, actionable stories."
                                instructorName="Elena R."
                                instructorRole="Data Scientist"
                                instructorImg="https://lh3.googleusercontent.com/aida-public/AB6AXuA8OngGDuWU2UhnF-MhoCu4dhfWJ3CuPekrcLaawBeKTFq1qJ8UElNilakbfSIQm-yYtqXNOasNUzMEIJahwMnK_clT2ax1Zbkp0d-2g13z-LGq2zm6BWDcUf2e3L_i22BD2dsMpRW2sVRZY_YdAOZ3YwpuXX6r2Kuun8xLUsPOm1TXJDUMnz8vI-LUKU5k2BdwJVebAYvKy0yyUQNgeORHPDOxSqaP8XAT-Nr0x9OoyEGjgVZuj6YthMwXl5sKADXZihMyI6B8vzM"
                                price="99.99"
                            />
                        </motion.div>

                        {/* Pagination */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="mt-12 flex items-center justify-center gap-2 pb-10"
                        >
                            <PaginationButton>
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </PaginationButton>
                            <PaginationButton active>1</PaginationButton>
                            <PaginationButton>2</PaginationButton>
                            <PaginationButton>3</PaginationButton>
                            <span className="text-slate-500">...</span>
                            <PaginationButton>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </PaginationButton>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};

// Filter Section Component
const FilterSection = ({ title, children, isLast = false }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-8 ${!isLast ? 'border-b border-white/5 pb-6' : ''}`}
    >
        <button className="flex w-full items-center justify-between text-sm font-medium text-slate-200 mb-4">
            <span>{title}</span>
            <motion.span 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="material-symbols-outlined text-slate-500 text-sm"
            >
                expand_less
            </motion.span>
        </button>
        {children}
    </motion.div>
);

// Checkbox Filter Component
const CheckboxFilter = ({ label, checked, onChange }) => (
    <motion.label 
        whileHover={{ x: 4 }}
        className="flex items-center gap-3 cursor-pointer group"
    >
        <div className="relative flex items-center">
            <motion.input 
                type="checkbox"
                checked={checked}
                onChange={onChange}
                whileTap={{ scale: 0.9 }}
                className="peer h-4 w-4 appearance-none rounded border border-slate-600 bg-[#1A1333] checked:border-primary checked:bg-primary focus:ring-0 focus:ring-offset-0 transition-all" 
            />
            <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: checked ? 1 : 0 }}
                transition={{ duration: 0.2, ease: "backOut" }}
                className="material-symbols-outlined absolute left-0 top-0 text-white text-[16px] pointer-events-none"
            >
                check
            </motion.span>
        </div>
        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
            {label}
        </span>
    </motion.label>
);

// Radio Filter Component
const RadioFilter = ({ label, name, checked, onChange }) => (
    <motion.label 
        whileHover={{ x: 4 }}
        className="flex items-center gap-3 cursor-pointer group"
    >
        <motion.input 
            whileTap={{ scale: 0.9 }}
            className="h-4 w-4 border-slate-600 bg-[#1A1333] text-primary focus:ring-0 focus:ring-offset-0" 
            name={name} 
            type="radio" 
            checked={checked}
            onChange={onChange}
        />
        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </motion.label>
);

// Pagination Button Component
const PaginationButton = ({ children, active = false }) => (
    <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
            active 
                ? 'bg-primary text-white font-medium shadow-lg shadow-primary/20' 
                : 'border border-white/5 bg-[#1A1333] text-slate-400 hover:bg-[#2e2447] hover:text-white'
        }`}
    >
        {children}
    </motion.button>
);

// Enhanced Course Card Component
const CourseCard = ({ image, category, rating, reviews, duration, title, desc, instructorName, instructorRole, instructorImg, price }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div 
            variants={cardItem}
            whileHover={{ 
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1A1333] transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
        >
            {/* Animated gradient border effect */}
            <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(45deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3), rgba(168,85,247,0.3))',
                    backgroundSize: '200% 200%',
                }}
                animate={isHovered ? {
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                } : {}}
                transition={{
                    duration: 3,
                    ease: "linear",
                    repeat: Infinity
                }}
            />

            <div className="relative aspect-video w-full overflow-hidden">
                <motion.img 
                    alt={title} 
                    className="h-full w-full object-cover" 
                    src={image}
                    animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                />
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="absolute right-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10"
                >
                    {category}
                </motion.div>
            </div>

            <div className="flex flex-1 flex-col p-5 relative z-10">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <span className="material-symbols-outlined text-[16px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-xs font-bold text-white ml-1">{rating}</span>
                        <span className="text-xs text-slate-500">({reviews})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        {duration}
                    </div>
                </div>

                <motion.h3 
                    className="mb-2 text-lg font-bold leading-tight text-white transition-colors"
                    animate={{ color: isHovered ? '#a855f7' : '#ffffff' }}
                >
                    {title}
                </motion.h3>
                <p className="mb-4 text-xs text-slate-400 line-clamp-2">{desc}</p>

                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                        <motion.img 
                            whileHover={{ scale: 1.1 }}
                            alt={instructorName} 
                            className="h-8 w-8 rounded-full border border-white/10 object-cover" 
                            src={instructorImg} 
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-300">{instructorName}</span>
                            <span className="text-[10px] text-slate-500">{instructorRole}</span>
                        </div>
                    </div>
                    <motion.span 
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                        className="text-lg font-bold text-white"
                    >
                        ${price}
                    </motion.span>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:brightness-110 cursor-pointer relative overflow-hidden"
                >
                    <span className="relative z-10">Add to Cart</span>
                    <span className="material-symbols-outlined text-[18px] relative z-10">add_shopping_cart</span>
                    
                    {/* Shine effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                    />
                </motion.button>
            </div>
        </motion.div>
    );
};

export default CoursesPage;
