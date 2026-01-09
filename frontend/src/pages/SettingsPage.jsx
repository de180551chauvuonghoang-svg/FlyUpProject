import React, { useState, useEffect } from 'react';
import { Camera, User, Briefcase, Calendar, Phone, Mail, ChevronRight, Save, Shield, Settings as SettingsIcon, Bell, CreditCard } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import useAuth from '../hooks/useAuth';
import { updateUserProfile } from '../services/userService';
import toast from 'react-hot-toast';
import defaultAvatar from '../assets/default-avatar.png';

const InputField = ({ label, icon, value, onChange, type = "text", placeholder, readOnly = false, required = false }) => {
  const Icon = icon;
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          className={`w-full bg-[#16161e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
};

const ProfileTab = ({ user, refreshUser }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        role: user.role || 'Learner',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        phone: user.phone || '',
        email: user.email || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || defaultAvatar
      });
    }
  }, [user]);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', 'wo5grbii'); 
      data.append('cloud_name', 'dduyqntd6'); 

      const response = await fetch('https://api.cloudinary.com/v1_1/dduyqntd6/image/upload', {
        method: 'POST',
        body: data
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Upload failed');

      setFormData(prev => ({ ...prev, avatarUrl: result.secure_url }));
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        FullName: formData.fullName,
        Bio: formData.bio,
        Phone: formData.phone,
        DateOfBirth: formData.dateOfBirth,
        AvatarUrl: formData.avatarUrl
      };

      await updateUserProfile(user.id, payload);
      if (refreshUser) await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-white/5">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-violet-600 to-fuchsia-600">
            <div className="w-full h-full rounded-full border-4 border-[#1A1333] overflow-hidden bg-[#0D071E]">
              <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-[#0D071E] text-white p-2 rounded-full border border-white/10 hover:border-violet-500 transition-colors shadow-xl"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-center sm:text-left flex-1">
          <h3 className="text-lg font-bold text-white mb-1">Profile Picture</h3>
          <p className="text-slate-400 text-sm mb-4">Recommended: 400×400px. JPG, PNG or GIF.</p>
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium border border-white/10 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
            {formData.avatarUrl !== defaultAvatar && (
              <button 
                onClick={() => setFormData(prev => ({ ...prev, avatarUrl: defaultAvatar }))}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField 
          label="Full Name" 
          icon={User} 
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
        />
        <InputField 
          label="Role" 
          icon={Briefcase} 
          value={formData.role}
          readOnly={true}
        />
        <InputField 
          label="Date of Birth" 
          icon={Calendar} 
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
        />
        <InputField 
          label="Phone Number" 
          icon={Phone} 
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+123 456 789"
        />
        <div className="md:col-span-2">
          <InputField 
            label="Email Address" 
            icon={Mail} 
            value={formData.email}
            readOnly={true}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-slate-300">Bio</label>
          <textarea 
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Write a short bio..."
            className="w-full bg-[#16161e] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all min-h-[100px] resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-primary/20"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SecurityTab = ({ changePassword, user }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (formData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setLoading(true);
      const { error } = await changePassword(formData.newPassword);
      if (error) throw new Error(error.message);
      
      toast.success('Password updated successfully!');
      setFormData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (user?.loginProvider && !user?.hasPassword) {
     // Note: In real app, check if user was created via Google/Github
  }

  return (
    <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-2">Change Password</h3>
        <p className="text-slate-400 text-sm">Protect your account by using a unique password that you don't use elsewhere.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField 
          label="New Password" 
          icon={Shield} 
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
          required
        />
        <InputField 
          label="Confirm New Password" 
          icon={Shield} 
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          required
        />

        <div className="pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </form>

      <div className="mt-12 p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">Security Recommendations</h4>
            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special symbols</li>
              <li>Avoid using personal information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { user, refreshUser, changePassword } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const tabs = [
    { id: 'profile', label: 'Information', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] flex flex-col antialiased text-slate-300">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-72 space-y-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Settings</h1>
              <p className="text-slate-500 text-sm">Manage your account settings and preferences.</p>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    )}
                  </button>
                );
              })}
            </nav>
            
            <div className="pt-8 border-t border-white/5">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/10">
                    <div className="size-10 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                        <User className="size-5" />
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">Premium Member</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Enjoy all our content and features with your active subscription.</p>
                </div>
            </div>
          </aside>

          {/* Content Area */}
          <section className="flex-1 min-w-0">
            <div className="bg-[#12121e] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-12">
              {activeTab === 'profile' && (
                <ProfileTab user={user} refreshUser={refreshUser} />
              )}
              {activeTab === 'security' && (
                <SecurityTab changePassword={changePassword} user={user} />
              )}
              {(activeTab === 'notifications' || activeTab === 'billing') && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                  <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <SettingsIcon className="size-8 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
                  <p className="text-slate-500 max-w-xs">We're working hard to bring the {activeTab} settings to you soon!</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
