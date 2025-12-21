import { useState } from 'react';
import Header from '../components/Header/Header';

const CoursesPage = () => {
    // State to simulate filter selections and active page (for visual feedback)
    const [selectedLevel, setSelectedLevel] = useState('Intermediate');
    const [selectedPrice, setSelectedPrice] = useState('Paid');

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white">
            <Header />

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <aside className="hidden w-64 flex-col overflow-y-auto border-r border-white/5 bg-[#0D071E] p-6 lg:flex">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Filters</h3>
                        <button className="text-xs text-primary hover:text-white transition-colors">Reset</button>
                    </div>
                    {/* Difficulty */}
                    <div className="mb-8 border-b border-white/5 pb-6">
                        <button className="flex w-full items-center justify-between text-sm font-medium text-slate-200 mb-4">
                            <span>Level</span>
                            <span className="material-symbols-outlined text-slate-500 text-sm">expand_less</span>
                        </button>
                        <div className="space-y-3">
                            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                <label key={level} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox"
                                            checked={selectedLevel === level}
                                            onChange={() => setSelectedLevel(level === selectedLevel ? '' : level)}
                                            className="peer h-4 w-4 appearance-none rounded border border-slate-600 bg-[#1A1333] checked:border-primary checked:bg-primary focus:ring-0 focus:ring-offset-0 transition-all" 
                                        />
                                        <span className="material-symbols-outlined absolute left-0 top-0 hidden text-white text-[16px] peer-checked:block pointer-events-none">check</span>
                                    </div>
                                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Price */}
                    <div className="mb-8 border-b border-white/5 pb-6">
                        <button className="flex w-full items-center justify-between text-sm font-medium text-slate-200 mb-4">
                            <span>Price</span>
                            <span className="material-symbols-outlined text-slate-500 text-sm">expand_less</span>
                        </button>
                        <div className="space-y-3">
                            {['All Prices', 'Free', 'Paid'].map((price) => (
                                <label key={price} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        className="h-4 w-4 border-slate-600 bg-[#1A1333] text-primary focus:ring-0 focus:ring-offset-0" 
                                        name="price" 
                                        type="radio" 
                                        checked={selectedPrice === price}
                                        onChange={() => setSelectedPrice(price)}
                                    />
                                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{price}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Ratings */}
                    <div>
                        <button className="flex w-full items-center justify-between text-sm font-medium text-slate-200 mb-4">
                            <span>Rating</span>
                            <span className="material-symbols-outlined text-slate-500 text-sm">expand_less</span>
                        </button>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input className="h-4 w-4 rounded border-slate-600 bg-[#1A1333] text-primary focus:ring-0 focus:ring-offset-0" type="checkbox" />
                                <div className="flex items-center gap-1 text-yellow-400">
                                    {[1, 2, 3, 4].map(i => <span key={i} className="material-symbols-outlined text-[16px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                                    <span className="material-symbols-outlined text-[16px]">star</span>
                                    <span className="text-xs text-slate-400 ml-1 group-hover:text-white">& Up</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0D071E] p-6 lg:p-10">
                    <div className="mx-auto max-w-7xl">
                        {/* Header Banner */}
                        <div className="relative mb-10 overflow-hidden rounded-3xl bg-[#1A1333] px-8 py-10 shadow-2xl">
                            <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUOloh5Q5m38qNJ5SmcVyl67k6vu60Iat38B7pqJBIJrB9XIYkKuLISnex6wnMzadRuAkeIaJaFXtInqfO-K_116kmRx3p2-geH06POmNAzre5ByPZiz2BB1XKob3mnR4h5Th-UfGS2im32R1-coxPQykArNZnVNhvOUA1FpEWyQMQc-T9mH0S61CCsJplJSHioWiBBWNSkpnlR0NRToOxIE8Fy3ea2mW58jDnZ8sDxG1GpEdPwMy6MpC5W9unMdR-g1LA7ozu64I')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0D071E] via-[#0D071E]/80 to-transparent z-0"></div>
                            <div className="relative z-10 max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    New Courses Added
                                </div>
                                <h1 className="mb-2 text-4xl font-bold text-white tracking-tight">Explore the Universe of Knowledge</h1>
                                <p className="text-lg text-slate-300">Master the skills of tomorrow. From deep space navigation to advanced UI systems.</p>
                            </div>
                        </div>

                        {/* Category Chips */}
                        <div className="mb-8 flex flex-wrap items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            <button className="flex h-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-500/20">
                                All Courses
                            </button>
                            {['UI/UX Design', 'Space Science', 'VR/AR Dev', 'Astrophysics', 'Cybernetics'].map((cat) => (
                                <button key={cat} className="flex h-10 shrink-0 items-center justify-center rounded-full border border-white/5 bg-[#1A1333] px-6 text-sm font-medium text-slate-300 hover:border-primary/50 hover:bg-[#2e2447] hover:text-white transition-all">
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Filter Sort Mobile */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-slate-400">Showing <span className="text-white font-semibold">24</span> courses</p>
                            <div className="flex items-center gap-2 lg:hidden">
                                <button className="flex items-center gap-2 rounded-lg bg-[#1A1333] px-3 py-2 text-sm text-white border border-white/5">
                                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                    Filters
                                </button>
                            </div>
                        </div>

                        {/* Course Grid */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {/* Card 1 */}
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
                            {/* Card 2 */}
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
                            {/* Card 3 */}
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
                            {/* Card 4 */}
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
                            {/* Card 5 */}
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
                             {/* Card 6 */}
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
                        </div>

                        {/* Pagination */}
                        <div className="mt-12 flex items-center justify-center gap-2 pb-10">
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#1A1333] text-slate-400 hover:bg-[#2e2447] hover:text-white transition-all">
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-medium shadow-lg shadow-primary/20">1</button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#1A1333] text-slate-400 hover:bg-[#2e2447] hover:text-white transition-all">2</button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#1A1333] text-slate-400 hover:bg-[#2e2447] hover:text-white transition-all">3</button>
                            <span className="text-slate-500">...</span>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#1A1333] text-slate-400 hover:bg-[#2e2447] hover:text-white transition-all">
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const CourseCard = ({ image, category, rating, reviews, duration, title, desc, instructorName, instructorRole, instructorImg, price }) => (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1A1333] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative aspect-video w-full overflow-hidden">
            <img 
                alt={title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                src={image} 
            />
            <div className="absolute right-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                {category}
            </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
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
            <h3 className="mb-2 text-lg font-bold leading-tight text-white group-hover:text-primary transition-colors">{title}</h3>
            <p className="mb-4 text-xs text-slate-400 line-clamp-2">{desc}</p>
            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                    <img alt={instructorName} className="h-8 w-8 rounded-full border border-white/10 object-cover" src={instructorImg} />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-300">{instructorName}</span>
                        <span className="text-[10px] text-slate-500">{instructorRole}</span>
                    </div>
                </div>
                <span className="text-lg font-bold text-white">${price}</span>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:brightness-110 cursor-pointer">
                Add to Cart
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            </button>
        </div>
    </div>
);

export default CoursesPage;
