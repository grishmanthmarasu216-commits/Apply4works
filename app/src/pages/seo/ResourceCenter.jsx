import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function ResourceCenter() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    // Dynamic import to prevent build errors if the file doesn't exist yet
    import('../../data/seo/blogs.json')
      .then(module => setBlogs(module.default || module))
      .catch(e => console.log('Blogs not generated yet.'));
  }, []);

  const grouped = blogs.reduce((acc, blog) => {
    if (!acc[blog.category]) acc[blog.category] = [];
    acc[blog.category].push(blog);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <SEO 
        title="Apply4Works Resource Center" 
        description="Master ATS optimization, resume tailoring, and interview prep with our expert guides." 
        canonical="/resources"
      />
      
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">Career Resource Center</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to navigate the modern job market, beat algorithms, and land more interviews.</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl border border-gray-200">
          <span className="loading loading-spinner text-primary"></span>
          <p className="mt-4 text-gray-500 font-medium">Generating AI SEO content...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(blog => (
                  <Link key={blog.slug} to={`/blog/${blog.slug}`} className="group block h-full">
                    <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col transition-all group-hover:shadow-md group-hover:border-primary/30">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{blog.title}</h3>
                      <p className="text-gray-600 text-sm flex-1 mb-4">{blog.excerpt}</p>
                      <div className="text-primary text-sm font-bold flex items-center gap-1">
                        Read Guide <span aria-hidden="true">&rarr;</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
