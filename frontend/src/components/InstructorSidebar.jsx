import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", path: "/instructor/dashboard" },
  { icon: "group", label: "Students", path: "/instructor/students" },
  { icon: "forum", label: "Communication", path: "/instructor/communication" },
  { icon: "database", label: "Question Bank", path: "/instructor/question-banks" },
  { icon: "build", label: "Tool", path: "/instructor/tools" },
];

export default function InstructorSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login?role=instructor");
  };

  return (
    <aside className="hidden lg:fixed left-0 top-0 w-64 h-screen z-50 lg:flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/5 p-6">
      {/* Logo */}
      <div
        className="mb-12 flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate("/")}
      >
        <div className="h-10 w-auto">
          <img
            src="/FlyUpTeam.png"
            alt="FlyUp Logo"
            className="h-full w-auto object-contain transition-transform group-hover:scale-110"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
            FlyUp
          </h1>
          <p className="text-xs font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent leading-tight tracking-wide">
            Edu & Tech
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={
              user?.avatar ||
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDXE54T7SHzGeKbXXXlUxacKM7rFAAcrgZVpdd_-2TAuAz9Ux1K211OsyMyrlnV02DzXeuR3UqebcbQh48zeyPWIC0vk_SEj8mWfVnBhEaDAfpvmgpu-tfoqhf1sZy8MwHSNSQoPveBoK-PmRL90gzW18t7OHAEnHhoX0CrSXHdwoZs0DwW0pUhSRR8ZfcGKI8rYQE6eARtf3WUO9zVrR4VvcBTy-HKGmDcSPufUImWl52N8-ODbbGsWsJ_P4pmAXI0ykRDwvcrCGg"
            }
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-purple-500/50 object-cover"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold text-white truncate">
              {user?.name || "Instructor"}
            </p>
            <p className="text-xs text-slate-400">
              {user?.email || "instructor@flyup.com"}
            </p>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
          className="w-full relative z-[100] flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all cursor-pointer pointer-events-auto shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
