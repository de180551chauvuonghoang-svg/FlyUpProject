import React, { useState, useEffect } from 'react';
import { Camera, User, Briefcase, Calendar, Phone, Mail, ChevronRight, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import useAuth from '../hooks/useAuth';
import { updateUserProfile } from '../services/userService';
import toast from 'react-hot-toast';
import defaultAvatar from '../assets/default-avatar.png';

const InputField = ({ label, icon, value, onChange, type = "text", placeholder, readOnly = false }) => {
  const Icon = icon;
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full bg-[#16161e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, refreshUser } = useAuth(); // signIn here acts as a way to refresh user context if needed, or we rely on re-fetch
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
        role: user.role || 'Student', // Default or user role
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
      data.append('upload_preset', 'wo5grbii'); // Unsigned preset provided by user
      data.append('cloud_name', 'dduyqntd6'); 

      const response = await fetch('https://api.cloudinary.com/v1_1/dduyqntd6/image/upload', {
        method: 'POST',
        body: data
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      setFormData(prev => ({ ...prev, avatarUrl: result.secure_url }));
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Construct payload for API
      const payload = {
        FullName: formData.fullName,
        Bio: formData.bio,
        Phone: formData.phone,
        DateOfBirth: formData.dateOfBirth,
        AvatarUrl: formData.avatarUrl // In real app, we handle file upload separately
      };

      await updateUserProfile(user.id, payload);
      
      // Refresh user context to ensure the new avatar is persisted and available even after navigation/reload
      if (refreshUser) await refreshUser();

      toast.success('Profile updated successfully!');
      // Ideally trigger a context refresh here, simpler way is to reload or refetch "me"
      // user object in useAuth might not update automatically without a reload
      // A quick hack for UX is often just changing local state or forcing a reload
    //   window.location.reload(); 
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D071E] font-display flex flex-col antialiased">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <span className="text-slate-400">Settings</span>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <span className="text-white font-medium">Information</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Information Settings</h1>
          <p className="text-slate-400 max-w-2xl">Manage your personal details and public profile information visible to other students and mentors.</p>
        </div>

        <div className="bg-[#1A1333] border border-white/5 rounded-2xl p-6 md:p-10 shadow-xl">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 pb-10 border-b border-white/5">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-violet-600 to-fuchsia-600">
                <div className="w-full h-full rounded-full border-4 border-[#1A1333] overflow-hidden bg-[#0D071E]">
                    <img 
                        src={formData.avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-[#16161e] text-white p-2 rounded-full border border-white/10 hover:border-violet-500/50 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Profile Picture</h3>
              <p className="text-slate-400 text-sm mb-4">Upload a new avatar. Recommended size: 400×400px.</p>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Avatar'}
                </button>
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, avatarUrl: defaultAvatar }))}
                  className="text-red-400 hover:text-red-300 px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
            <InputField 
              label="Full Name" 
              icon={User} 
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Your full name"
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
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />

            <InputField 
              label="Phone Number" 
              icon={Phone} 
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="mb-8">
            <InputField 
              label="Email Address" 
              icon={Mail} 
              value={formData.email}
              readOnly={true}
              type="email"
            />
          </div>

          <div className="mb-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bio</label>
              <div className="relative">
                <textarea 
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us a little about yourself..."
                  className="w-full bg-[#16161e] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-4 text-xs text-slate-500">
                  {500 - (formData.bio?.length || 0)} characters left
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/5">
            <button className="px-6 py-2.5 rounded-xl text-slate-300 hover:text-white font-medium hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
