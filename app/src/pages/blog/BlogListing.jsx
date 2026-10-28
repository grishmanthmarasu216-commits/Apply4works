import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Loader2 } from 'lucide-react';
import BlogCard from '../../components/Blog/BlogCard';
import { API_BASE } from '../../config/api';

const BlogListing = () => {
  const [blogs, setBlogs] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState('');

  const categories = ['All', 'Resume Tips', 'Interview Prep', 'Career Growth', 'AI Tools', 'Job Search'];

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        // Fetch featured blogs (assuming top 3)
        const featuredRes = await fetch(`${API_BASE}/blogs/featured`);
        const featuredData = await featuredRes.json();
        if (featuredData.success) {
          setFeatured(featuredData.data.featured);
        }

        // Fetch paginated blogs
        let url = `${API_BASE}/blogs?page=${page}&limit=9`;
        if (search) url += `&search=${search}`;
        if (activeCategory && activeCategory !== 'All') url += `&category=${activeCategory}`;

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
          setBlogs(data.data);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [page, search, activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Helmet>
        <title>Career Advice & Resume Tips Blog | Apply4Works</title>
        <meta name="description" content="Expert advice on resume writing, interview preparation, career growth, and using AI tools to land your dream job." />
        <link rel="canonical" href="https://apply4works.com/blog" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Career Insights & Resource Hub</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Expert advice, proven strategies, and AI-powered tips to accelerate your career growth and land your dream job.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Search articles, topics, or keywords..." 
              className="w-full py-4 pl-12 pr-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-colors">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                (activeCategory === cat || (cat === 'All' && !activeCategory))
                  ? 'bg-blue-600 text-white border-transparent'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Featured Posts (Only show on page 1 with no active search/category) */}
        {!loading && page === 1 && !search && activeCategory === 'All' && featured.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map(blog => <BlogCard key={blog._id} blog={blog} />)}
            </div>
          </div>
        )}

        {/* All Posts */}
        {!loading && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">
              {search ? `Search Results for "${search}"` : activeCategory && activeCategory !== 'All' ? `${activeCategory} Articles` : 'Latest Articles'}
            </h2>
            
            {blogs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">No articles found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map(blog => <BlogCard key={blog._id} blog={blog} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-16 space-x-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 font-medium transition-colors"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListing;
