import React, { useState } from 'react';
import { ArrowLeft, LogOut, User, Globe, GraduationCap, Save, Check } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import './SettingsPage.css';

export default function SettingsPage({ user, profile, onBack, onUpdateProfile }) {
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    country: profile?.country || 'US',
    grade: profile?.grade || '6',
    age: profile?.age || ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const path_id = `${formData.country.toLowerCase()}_grade_${formData.grade}`;
    const updatedProfile = {
      ...formData,
      learning_path_id: path_id
    };

    try {
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setSaved(true);
      onUpdateProfile(updatedProfile);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="settings-page">
      <nav className="settings-nav">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1>Settings</h1>
        <div style={{ width: 24 }} />
      </nav>

      <div className="settings-content">
        <section className="settings-section profile-info">
          <div className="profile-header">
            <div className="avatar-large">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" />
              ) : (
                <User size={40} />
              )}
            </div>
            <div className="user-meta">
              <h2>{formData.name || 'Student'}</h2>
              <p>{user.email}</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="settings-form">
          <section className="settings-section">
            <h3 className="section-label">Account Details</h3>
            <div className="form-group">
              <label><User size={16} /> Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Your Name"
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                placeholder="Age"
              />
            </div>
          </section>

          <section className="settings-section">
            <h3 className="section-label">Education Path</h3>
            <div className="form-row">
              <div className="form-group">
                <label><Globe size={16} /> Country</label>
                <select 
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                >
                  <option value="US">United States</option>
                  <option value="INTERNATIONAL">International</option>
                </select>
              </div>
              <div className="form-group">
                <label><GraduationCap size={16} /> Grade Level</label>
                <select 
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="settings-actions">
            <button className={`save-btn ${saved ? 'success' : ''}`} type="submit" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : saved ? (
                <><Check size={20} /> Saved</>
              ) : (
                <><Save size={20} /> Save Changes</>
              )}
            </button>

            <button className="logout-btn" type="button" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
