const TerminalPanel = ({ title, children, className = '' }) => (
  <div className={`terminal-window ${className}`}>
    <div className="terminal-window-header flex justify-between items-center">
      <span>{title}</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-[#004d20]" />
        <div className="w-1.5 h-1.5 bg-[#004d20]" />
      </div>
    </div>
    <div className="terminal-window-content">{children}</div>
  </div>
);

export default TerminalPanel;
