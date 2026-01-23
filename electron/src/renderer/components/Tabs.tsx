import './Tabs.css';

interface TabsProps {
  activeTab: 'files' | 'logs';
  onTabChange: (tab: 'files' | 'logs') => void;
}

function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="tabs">
      <button
        className={`tab ${activeTab === 'files' ? 'active' : ''}`}
        onClick={() => onTabChange('files')}
      >
        Processing Queue
      </button>
      <button
        className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
        onClick={() => onTabChange('logs')}
      >
        Logs
      </button>
    </div>
  );
}

export default Tabs;
