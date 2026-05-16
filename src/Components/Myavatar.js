import React, { useState } from 'react';
import { updateUserField } from '../lib/db';
import { IoImageOutline } from 'react-icons/io5';
import './Chat_component/friends.css';

function Myavatar({ uid, me }) {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = async () => {
    if (!url.trim() || !uid) return;
    setSaving(true);
    await updateUserField(uid, { avatar: url.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="friends-panel">
      <div className="friends-panel-header">
        <div className="friends-panel-title">Set Avatar</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          {(url || me?.avatar)
            ? <img
                src={url || me?.avatar}
                alt="avatar preview"
                style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            : <div style={{
                width: 140, height: 140, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #3498db)',
                color: '#fff', fontSize: '3rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <IoImageOutline />
              </div>
          }
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '.5rem' }}>
            Avatar Image URL
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input
              style={{
                flex: 1, background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '.6rem .85rem', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '.875rem', outline: 'none', transition: 'border-color .2s'
              }}
              placeholder="Paste image URL here…"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onKeyDown={e => e.key === 'Enter' && handleUpdate()}
            />
            <button
              onClick={handleUpdate}
              disabled={!url.trim() || saving}
              style={{
                background: saved ? 'var(--online)' : 'var(--accent)',
                border: 'none', borderRadius: 10, color: '#fff',
                padding: '.6rem 1rem', fontFamily: 'inherit', fontSize: '.875rem',
                fontWeight: 600, cursor: 'pointer', transition: 'background .2s', whiteSpace: 'nowrap'
              }}
            >
              {saving ? '…' : saved ? '✓ Saved!' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', width: '100%' }}>
          <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            💡 <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> You can use any direct image URL. Try{' '}
            <a href="https://pravatar.cc" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Pravatar</a>
            {' '}for quick avatars.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Myavatar;
