import React, { useEffect, useState } from "react";
import "./Feed.css";
import { IoSearchOutline } from "react-icons/io5";

const IS_PROD = process.env.NODE_ENV === 'production';
const NEWS_API_KEY = "3d032423eddf4fceb282e7c7e72dfce1";

const CATEGORIES = [
  { key: 'Sports',          icon: '⚽', label: 'Sports' },
  { key: 'Technology',      icon: '💻', label: 'Technology' },
  { key: 'Entertainment',   icon: '🎬', label: 'Entertainment' },
  { key: 'Business',        icon: '💼', label: 'Business' },
  { key: 'Health',          icon: '🏥', label: 'Health' },
  { key: 'Politics',        icon: '🏛️', label: 'Politics' },
  { key: 'Science',         icon: '🔬', label: 'Science' },
  { key: 'Bitcoin',         icon: '₿', label: 'Crypto' },
];

const COUNTRIES = [
  { code: 'in', name: 'India' },
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'au', name: 'Australia' },
  { code: 'ca', name: 'Canada' },
  { code: 'jp', name: 'Japan' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'cn', name: 'China' },
  { code: 'br', name: 'Brazil' },
  { code: 'ae', name: 'UAE' },
  { code: 'ru', name: 'Russia' },
  { code: 'sa', name: 'Saudi Arabia' },
];

const SAMPLE_ARTICLES = [
  {
    source: { name: 'AR Hub News' },
    title: 'Welcome to AR Hub — Your Professional News Feed',
    description: 'Configure your NewsAPI key to see live articles here. This is a placeholder showing how the news feed will look.',
    urlToImage: null,
    publishedAt: new Date().toISOString(),
    url: '#',
    author: 'AR Hub'
  },
  {
    source: { name: 'Demo Source' },
    title: 'News Feed Ready — Add Your API Key for Live Articles',
    description: 'Once a valid NewsAPI key is configured, this feed will show real articles filtered by category and country in real time.',
    urlToImage: null,
    publishedAt: new Date().toISOString(),
    url: '#',
    author: 'System'
  }
];

function NewsCard({ article }) {
  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <a
      href={article.url !== '#' ? article.url : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card-pro"
      style={{ cursor: article.url === '#' ? 'default' : 'pointer' }}
    >
      {article.urlToImage
        ? <img className="news-card-img" src={article.urlToImage} alt="" onError={e => e.target.style.display='none'} />
        : <div className="news-card-img-placeholder">📰</div>
      }
      <div className="news-card-body">
        <div className="news-card-source">{article.source?.name}</div>
        <div className="news-card-title">{article.title}</div>
        {article.description && <div className="news-card-desc">{article.description}</div>}
        <div className="news-card-meta">
          <span className="news-card-date">{fmtDate(article.publishedAt)}</span>
          {article.url && article.url !== '#' && (
            <span className="news-card-link">Read more →</span>
          )}
        </div>
      </div>
    </a>
  );
}

function Feed() {
  const [category, setCategory] = useState('Sports');
  const [country, setCountry] = useState('in');
  const [catSearch, setCatSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  const fetchNews = async () => {
    if (IS_PROD) {
      setArticles(SAMPLE_ARTICLES);
      setApiError(true);
      return;
    }
    setLoading(true);
    setApiError(false);
    try {
      // /everything doesn't support country; use top-headlines for country filter
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?country=${country}&category=${category.toLowerCase()}&apiKey=${NEWS_API_KEY}&pageSize=20`
      );
      const data = await res.json();
      if (data.status === 'error' || !data.articles?.length) {
        // Fallback: everything endpoint with keyword
        const res2 = await fetch(
          `https://newsapi.org/v2/everything?q=${category}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=20`
        );
        const data2 = await res2.json();
        if (data2.status === 'error') { setApiError(true); setArticles(SAMPLE_ARTICLES); }
        else setArticles(data2.articles || SAMPLE_ARTICLES);
      } else {
        setArticles(data.articles);
      }
    } catch {
      setApiError(true);
      setArticles(SAMPLE_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, [category, country]);

  const filteredCats = CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="feed-page">
      <div className="feed-inner">
        <div className="feed-header">
          <div className="feed-title">News Feed</div>
          <div className="feed-subtitle">Stay informed with the latest headlines</div>
        </div>

        {/* Production / API key notice */}
        {(IS_PROD || apiError) && (
          <div className="feed-api-notice" style={{ marginBottom: '1.25rem' }}>
            <div className="feed-api-notice-icon">🔑</div>
            <div className="feed-api-notice-text">
              <h3>NewsAPI Key Required for Live Articles</h3>
              <p>
                NewsAPI restricts browser requests in production. To enable live news, you need a server-side
                proxy or a paid plan. Get your key at <code>newsapi.org</code> and set{' '}
                <code>REACT_APP_NEWS_KEY</code> in your environment. Showing sample articles for now.
              </p>
            </div>
          </div>
        )}

        <div className="feed-layout">
          {/* Sidebar */}
          <aside className="feed-categories">
            <div className="feed-cat-title">Category</div>
            <div className="feed-cat-search">
              <IoSearchOutline style={{ color: 'var(--text-tertiary)', fontSize: '.9rem' }} />
              <input
                placeholder="Search…"
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
              />
            </div>
            {filteredCats.map(c => (
              <button
                key={c.key}
                className={`feed-cat-btn ${category === c.key ? 'active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                <span className="feed-cat-icon">{c.icon}</span>
                {c.label}
              </button>
            ))}
            <div className="feed-cat-title" style={{ marginTop: '.85rem' }}>Country</div>
            <select
              className="feed-country-select"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </aside>

          {/* Articles */}
          <main className="feed-main">
            <div className="feed-section-header">
              <span className="feed-section-title">
                {CATEGORIES.find(c => c.key === category)?.icon}{' '}
                {category}
              </span>
              {articles.length > 0 && (
                <span className="feed-section-badge">{articles.length} articles</span>
              )}
            </div>

            {loading ? (
              <div className="feed-loading"><div className="feed-spinner" /></div>
            ) : (
              <div className="feed-articles">
                {articles.map((article, i) => (
                  <NewsCard key={i} article={article} />
                ))}
                {articles.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '3rem', fontSize: '.9rem' }}>
                    No articles found. Try a different category.
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Feed;
