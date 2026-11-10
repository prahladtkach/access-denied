import { useState } from 'react';
import type { ReactNode } from 'react';
import type { FileId } from './game';
import { files } from './story';

type Folder = 'interno' | 'archivo';
const folders: Record<Folder, { label: string; file: FileId }> = {
  interno: { label: 'Correo interno', file: 'mail' },
  archivo: { label: 'Archivo técnico', file: 'report' },
};

export function FileExplorer({ mounted, archive, onRead, renderFile }: {
  mounted: boolean;
  archive: boolean;
  onRead: (file: FileId) => void;
  renderFile: (file: FileId) => ReactNode;
}) {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [document, setDocument] = useState<FileId | null>(null);
  const current = folder && folders[folder];

  if (!mounted) return <>
    <p className="eyebrow">NEXUS / VOLUMEN NO MONTADO</p>
    <h2>Explorador de archivos</h2>
    <p>Volumen bloqueado. Montá el servidor para leer su contenido.</p>
  </>;

  return <>
    <div className="file-path"><span>VOLUMEN NEXUS</span> / {folder ?? 'raíz'} {document && '/ ' + files[document].name}</div>
    <div className="file-layout">
      <nav aria-label="Carpetas del servidor">
        <button className="file-root" aria-pressed={!folder} onClick={() => { setFolder(null); setDocument(null); }}>⌂ Raíz</button>
        {(['interno', 'archivo'] as const).filter(id => id !== 'archivo' || archive).map(id =>
          <button key={id} aria-pressed={folder === id} onClick={() => { setFolder(id); setDocument(null); }}>
            <span aria-hidden="true">▰ </span>{folders[id].label}
          </button>)}
      </nav>
      <div className="file-list">
        {!current ? <><h2>Volumen NEXUS</h2><p>Elegí una carpeta para ver sus documentos.</p></> : <>
          <button className="file-document" onClick={() => { setDocument(current.file); onRead(current.file); }}>
            <span aria-hidden="true">▤ </span>{files[current.file].name}
          </button>
          {document && renderFile(document)}
        </>}
      </div>
    </div>
  </>;
}

