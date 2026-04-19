import React from 'react';
import { Download, Upload, GitBranch } from 'lucide-react';
import { useTreeInfo } from '../store/TreeContext';

const Header = () => {
  const { nodes, edges, setNodes, setEdges } = useTreeInfo();

  const handleExport = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'gentree-export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const { nodes: newNodes, edges: newEdges } = JSON.parse(event.target.result);
        if (newNodes && newEdges) {
          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (error) {
        console.error('Błąd importu:', error);
        alert("Nieprawidłowy plik z danymi drzewa.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="glass" style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 10,
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/logNew2.webp"
            alt="GenTree Logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain'
            }}
          />
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            GenTree
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Premium Family Tree</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <label className="btn secondary" style={{ cursor: 'pointer', margin: 0 }}>
          <Upload size={18} />
          <span>Importuj JSON</span>
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </label>
        <button className="btn" onClick={handleExport}>
          <Download size={18} />
          <span>Eksportuj</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
