import React, { useState, useEffect } from 'react';
import { X, UserPlus, Info, Trash2, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTreeInfo } from '../store/TreeContext';
import ConfirmModal from './ConfirmModal';

/* ------------------------------------------------------------------ */
/*  Small helper — "chip" showing an existing relation with delete btn  */
/* ------------------------------------------------------------------ */
const RelationChip = ({ label, onDelete }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
    borderRadius: '8px', padding: '6px 10px', fontSize: '13px',
    color: 'var(--text-secondary)',
  }}>
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
    <button
      title="Usuń powiązanie"
      onClick={onDelete}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#ef4444', marginLeft: '8px', padding: '2px', lineHeight: 1,
        flexShrink: 0,
      }}
    >
      <X size={14} />
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */
const ProfilePanel = ({ isOpen }) => {
  const {
    nodes, edges,
    selectedNodeId, setIsPanelOpen,
    updateNode, addNode, addEdge, removeNode, removeEdge,
  } = useTreeInfo();

  const [formData, setFormData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // "link existing" sub-panel state
  const [linkMode, setLinkMode] = useState(null); // 'parent'|'child'|'partner'|null
  const [linkSearch, setLinkSearch] = useState('');

  // Keep formData in sync when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId && nodes[selectedNodeId]) {
      setFormData(nodes[selectedNodeId]);
    } else {
      setFormData(null);
    }
    setLinkMode(null);
    setLinkSearch('');
  }, [selectedNodeId, nodes]);

  if (!isOpen || !formData) {
    return (
      <div className="glass-panel" style={{
        width: '380px', height: '100%', position: 'absolute', right: '-400px', top: 0,
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 100,
      }} />
    );
  }

  /* ---- helpers ---- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    updateNode(formData.id, { [name]: value });
  };

  /* Returns edges connected to current node grouped by role */
  const getRelations = () => {
    const parents  = [];
    const children = [];
    const partners = [];

    Object.values(edges).forEach(edge => {
      if (edge.type === 'parent-child') {
        if (edge.targetId === formData.id) {
          // sourceId is the parent
          if (nodes[edge.sourceId]) parents.push({ edge, person: nodes[edge.sourceId] });
        } else if (edge.sourceId === formData.id) {
          // targetId is the child
          if (nodes[edge.targetId]) children.push({ edge, person: nodes[edge.targetId] });
        }
      } else if (edge.type === 'partner') {
        if (edge.sourceId === formData.id && nodes[edge.targetId]) {
          partners.push({ edge, person: nodes[edge.targetId] });
        } else if (edge.targetId === formData.id && nodes[edge.sourceId]) {
          partners.push({ edge, person: nodes[edge.sourceId] });
        }
      }
    });

    return { parents, children, partners };
  };

  /* IDs already connected to this node (to exclude from link picker) */
  const connectedIds = () => {
    const ids = new Set([formData.id]);
    Object.values(edges).forEach(edge => {
      if (edge.sourceId === formData.id) ids.add(edge.targetId);
      if (edge.targetId === formData.id) ids.add(edge.sourceId);
    });
    return ids;
  };

  /* Add brand-new person + edge */
  const handleAddNew = (relationType) => {
    const isParent  = relationType === 'parent';
    const isPartner = relationType === 'partner';

    const offsetX = isPartner ? 280 : 0;
    const offsetY = isParent ? -150 : (relationType === 'child' ? 150 : 0);

    const newNodeId = addNode({
      firstName: 'Nowa',
      lastName:  'Osoba',
      maidenName: '',
      birthDate:  '',
      deathDate:  '',
      bio:        '',
      gender: isPartner ? (formData.gender === 'male' ? 'female' : 'male') : 'male',
      x: formData.x + offsetX,
      y: formData.y + offsetY,
    });

    if (isParent) {
      addEdge(newNodeId, formData.id, 'parent-child');
    } else if (isPartner) {
      addEdge(formData.id, newNodeId, 'partner');
    } else {
      addEdge(formData.id, newNodeId, 'parent-child');
    }
  };

  /* Link existing person */
  const handleLinkExisting = (personId) => {
    if (!linkMode) return;
    if (linkMode === 'parent') {
      addEdge(personId, formData.id, 'parent-child');
    } else if (linkMode === 'child') {
      addEdge(formData.id, personId, 'parent-child');
    } else if (linkMode === 'partner') {
      addEdge(formData.id, personId, 'partner');
    }
    setLinkMode(null);
    setLinkSearch('');
  };

  const handleDeleteConfirmed = () => {
    setShowDeleteModal(false);
    removeNode(formData.id);
  };

  const { parents, children, partners } = getRelations();
  const excluded = connectedIds();

  const personLabel = (p) =>
    `${p.firstName || ''} ${p.lastName || ''}`.trim() || '(brak imienia)';

  /* Persons available for linking (exclude already connected) */
  const availableForLink = Object.values(nodes).filter(n => {
    if (excluded.has(n.id)) return false;
    if (!linkSearch.trim()) return true;
    const q = linkSearch.toLowerCase();
    return personLabel(n).toLowerCase().includes(q);
  });

  /* ---- Label helpers for the "link" button ---- */
  const linkLabel = {
    parent:  'Powiąż z istniejącym rodzicem',
    child:   'Powiąż z istniejącym dzieckiem',
    partner: 'Powiąż z istniejącym partnerem',
  };

  /* ---- RelationGroup sub-component (inline) ---- */
  const RelationGroup = ({ title, items, relType }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-muted, #6b7280)',
        marginBottom: '6px',
      }}>{title}</div>

      {items.length === 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)', fontStyle: 'italic' }}>
          brak
        </div>
      )}
      {items.map(({ edge, person }) => (
        <div key={edge.id} style={{ marginBottom: '4px' }}>
          <RelationChip
            label={personLabel(person)}
            onDelete={() => removeEdge(edge.id)}
          />
        </div>
      ))}

      {/* Add new + link existing buttons */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <button
          className="btn secondary"
          style={{ flex: 1, fontSize: '12px', padding: '6px 8px', justifyContent: 'center' }}
          onClick={() => handleAddNew(relType)}
        >
          <UserPlus size={13} /> Nowa osoba
        </button>
        <button
          className="btn secondary"
          style={{ flex: 1, fontSize: '12px', padding: '6px 8px', justifyContent: 'center' }}
          onClick={() => setLinkMode(prev => prev === relType ? null : relType)}
        >
          <Link2 size={13} />
          {linkMode === relType ? 'Anuluj' : 'Istniejąca'}
          {linkMode === relType ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Link picker */}
      {linkMode === relType && (
        <div style={{
          marginTop: '8px', background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--glass-border)', borderRadius: '10px',
          padding: '10px', animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {linkLabel[relType]}:
          </div>
          <input
            type="text"
            placeholder="Szukaj osoby..."
            value={linkSearch}
            onChange={e => setLinkSearch(e.target.value)}
            style={{ width: '100%', marginBottom: '8px', fontSize: '13px' }}
          />
          <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {availableForLink.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)', fontStyle: 'italic' }}>
                Brak pasujących osób
              </div>
            )}
            {availableForLink.map(p => (
              <button
                key={p.id}
                className="btn secondary"
                style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '6px 10px' }}
                onClick={() => handleLinkExisting(p.id)}
              >
                {personLabel(p)}
                {p.birthDate ? ` (ur. ${p.birthDate.slice(0, 4)})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ---- Render ---- */
  return (
    <>
      <div className="glass-panel" style={{
        width: '380px', height: '100%', position: 'absolute', right: 0, top: 0,
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 100,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={20} color="var(--accent-color)" /> Profil Osoby
          </h2>
          <button className="btn icon-only secondary" onClick={() => setIsPanelOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {/* Basic info */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Imię</label>
              <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nazwisko</label>
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Nazwisko rodowe</label>
            <input type="text" name="maidenName" value={formData.maidenName || ''} onChange={handleChange} placeholder="Opcjonalne" />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data ur.</label>
              <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data śm.</label>
              <input type="date" name="deathDate" value={formData.deathDate || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Płeć</label>
            <select name="gender" value={formData.gender || 'male'} onChange={handleChange}>
              <option value="male">Mężczyzna</option>
              <option value="female">Kobieta</option>
            </select>
          </div>

          <div className="form-group">
            <label>Biografia</label>
            <textarea name="bio" rows="3" value={formData.bio || ''} onChange={handleChange} placeholder="Krótki życiorys..." />
          </div>

          <div className="form-group">
            <label>URL Avatara</label>
            <input type="text" name="avatar" value={formData.avatar || ''} onChange={handleChange} placeholder="https://..." />
          </div>

          {/* ---- Relations section ---- */}
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--glass-border)',
          }}>
            <div style={{
              fontSize: '14px', fontWeight: 600, marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Link2 size={16} color="var(--accent-color)" /> Powiązania
            </div>

            <RelationGroup title="👨‍👩‍👧 Rodzice" items={parents}  relType="parent"  />
            <RelationGroup title="💑 Partnerzy" items={partners} relType="partner" />
            <RelationGroup title="👶 Dzieci"    items={children} relType="child"   />
          </div>

          {/* Delete button */}
          <div style={{ marginTop: '32px' }}>
            <button
              className="btn"
              style={{
                width: '100%', justifyContent: 'center',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} /> Usuń Osobę
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Usuń osobę"
        message={`Czy na pewno chcesz usunąć ${formData.firstName} ${formData.lastName}? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default ProfilePanel;
