import React, { useState } from "react";
import { updateUserField } from "../../lib/db";
import { RxPencil1 } from "react-icons/rx";
import { AiOutlineCheck } from "react-icons/ai";
import "./friends1.css";

function Myprofile({ uid, me }) {
  const [editName, setEditName] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [name, setName] = useState(me?.name || '');
  const [bio, setBio] = useState(me?.bio || '');
  const save = async (field, value) => {
    if (!uid) return;
    await updateUserField(uid, { [field]: value });
  };

  return (
    <div className="friends-panel">
      <div className="friends-panel-header">
        <div className="friends-panel-title">My Profile</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {me?.avatar
            ? <img src={me.avatar} alt="avatar" style={{
                width: 110, height: 110, borderRadius: '50%', objectFit: 'cover',
                border: '3px solid var(--accent)'
              }} />
            : <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #3498db)',
                color: '#fff', fontSize: '2rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {(name || '?').slice(0, 2).toUpperCase()}
              </div>
          }
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{
            background: 'var(--accent-light)', color: 'var(--accent)',
            padding: '.25rem .85rem', borderRadius: '12px', fontSize: '.78rem', fontWeight: 600
          }}>
            ● online
          </span>
        </div>

        {/* Name field */}
        <div className="profile-field-card">
          <div className="profile-field-label">Display Name</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {editName ? (
              <input
                autoFocus
                className="profile-edit-input"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { save('name', name); setEditName(false); }
                }}
              />
            ) : (
              <span className="profile-field-value">{name}</span>
            )}
            <button className="profile-edit-btn" onClick={() => {
              if (editName) { save('name', name); setEditName(false); }
              else setEditName(true);
            }}>
              {editName ? <AiOutlineCheck style={{ color: 'var(--accent)' }} /> : <RxPencil1 />}
            </button>
          </div>
        </div>

        {/* Bio field */}
        <div className="profile-field-card">
          <div className="profile-field-label">About</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {editBio ? (
              <input
                autoFocus
                className="profile-edit-input"
                value={bio}
                onChange={e => setBio(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { save('bio', bio); setEditBio(false); }
                }}
              />
            ) : (
              <span className="profile-field-value" style={{ color: 'var(--text-secondary)' }}>
                {bio || 'Add a bio…'}
              </span>
            )}
            <button className="profile-edit-btn" onClick={() => {
              if (editBio) { save('bio', bio); setEditBio(false); }
              else setEditBio(true);
            }}>
              {editBio ? <AiOutlineCheck style={{ color: 'var(--accent)' }} /> : <RxPencil1 />}
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="profile-field-card">
          <div className="profile-field-label">Email</div>
          <span className="profile-field-value" style={{ color: 'var(--text-secondary)', fontSize: '.875rem' }}>
            {me?.email || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Myprofile;
