import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Download, AlertCircle, FileText, BookOpen, ShieldAlert, Clock } from 'lucide-react';
import diseasesData from './data/diseases.json';
import reportingTimes from './data/reporting_times.json';
import './index.css';

// Sub-component: DiseaseExpandableCard
const DiseaseCard = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 嘗試從手動覆寫資料中抓取通報時效，如果沒有特別寫明就預設為「參考工作手冊」
  const getReportingTime = (diseaseName) => {
    // 過濾掉名稱中的英文括號等以方便精準對比
    const cleanName = diseaseName.split(' ')[0].replace(/\(.*\)/, '');
    return reportingTimes[diseaseName] || reportingTimes[cleanName] || '立即通報或參考法規';
  };

  const getCategoryClass = (cat) => {
    if (cat.includes('一')) return 'cat-1';
    if (cat.includes('二')) return 'cat-2';
    if (cat.includes('三')) return 'cat-3';
    if (cat.includes('四')) return 'cat-4';
    if (cat.includes('五')) return 'cat-5';
    return 'cat-other';
  };

  return (
    <div className="disease-card">
      <div className="card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="card-title-area">
          <span className={`category-badge ${getCategoryClass(data.category)}`}>
            {data.category}
          </span>
          <h3 className="disease-name">{data.name}</h3>
          <span className="updated-badge" style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
             <Clock size={14} /> 通報: {getReportingTime(data.name)}
          </span>
          {data.isRecentlyUpdated && (
            <span className="updated-badge">
              <AlertCircle size={14} /> 剛更新
            </span>
          )}
        </div>
        <ChevronDown 
          size={20} 
          className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
        />
      </div>
      
      <div className={`card-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="content-grid">
          <div className="info-section">
            <h4>臨床條件</h4>
            <p>{data.caseDefinitions.clinicalCriteria}</p>
          </div>
          <div className="info-section">
            <h4>檢驗條件</h4>
            <p>{data.caseDefinitions.labCriteria}</p>
          </div>
          <div className="info-section">
            <h4>流行病學條件</h4>
            <p>{data.caseDefinitions.epidemiologyCriteria}</p>
          </div>
          <div className="info-section">
            <h4>通報定義</h4>
            <p>{data.caseDefinitions.reportingCriteria}</p>
          </div>
          <div className="info-section">
            <h4>疾病分類</h4>
            <p>{data.caseDefinitions.caseClassification}</p>
          </div>

          <div className="links-section">
            <h4>相關指引與附檔連結</h4>
            <div className="links-grid">
              {data.referenceLinks?.workManual && (
                <a href={data.referenceLinks.workManual} target="_blank" rel="noreferrer" className="doc-link">
                  <BookOpen size={16} /> 防制工作手冊
                </a>
              )}
              {data.referenceLinks?.infectionControl && (
                <a href={data.referenceLinks.infectionControl} target="_blank" rel="noreferrer" className="doc-link">
                  <ShieldAlert size={16} /> 感染管制指引
                </a>
              )}
              {data.referenceLinks?.biosafetyGuideline && (
                <a href={data.referenceLinks.biosafetyGuideline} target="_blank" rel="noreferrer" className="doc-link">
                  <FileText size={16} /> 實驗室生物安全指引
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', '第一類', '第二類', '第三類', '第四類', '第五類', '其他'];

  const filteredDiseases = useMemo(() => {
    return diseasesData.filter(d => {
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchTerm, activeCategory, diseasesData]);

  const recentUpdates = diseasesData.filter(d => d.isRecentlyUpdated).map(d => d.name);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-title-container">
          <h1>法定傳染病病例定義總覽</h1>
          <div className="header-subtitle">
            最後更新：{new Date().toLocaleString()} (系統模擬)
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Download size={16} /> 全部手冊下載
          </button>
        </div>
      </header>

      {/* Notice Banner */}
      {recentUpdates.length > 0 && (
        <div className="notice-banner">
          <strong>剛更新 (最近30天內)：</strong> {recentUpdates.join('、')}
        </div>
      )}

      {/* Controls */}
      <div className="controls-container">
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? '全部類別' : cat}
            </button>
          ))}
        </div>
        
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜尋疾病名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="cards-list">
        {filteredDiseases.length > 0 ? (
          filteredDiseases.map(disease => (
            <DiseaseCard key={disease.id} data={disease} />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            找不到符合條件的疾病資料
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
