import { Folder, FileCode } from 'lucide-react';

const FileIcon = ({ type, name, isHidden, onClick }) => (
  <div
    onClick={onClick}
    className={`flex flex-col items-center gap-1 group cursor-pointer transition-all hover:scale-105 active:scale-95 ${isHidden ? 'opacity-40' : ''}`}
  >
    {type === 'dir' ? (
      <Folder
        size={24}
        className="text-(--text-primary) group-hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]"
      />
    ) : (
      <FileCode
        size={24}
        className="text-(--text-bits) group-hover:drop-shadow-[0_0_8px_rgba(102,204,255,0.5)]"
      />
    )}
    <span className="text-[10px] uppercase text-center break-words max-w-[80px] px-1 overflow-hidden">
      {name}
    </span>
  </div>
);

export default FileIcon;
