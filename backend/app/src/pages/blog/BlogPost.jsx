import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, ChevronLeft, Loader2 } from 'lucide-react';
import ShareButtons from '../../components/Blog/ShareButtons';
import BlogCard from '../../components/Blog/BlogCard';
import { API_BASE } from '../../config/api';

const BlogPost = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/blogs/${slug}`);
        const data = await res.json();
        
        if (data.success) {
          setBlog(data.data);
          setError(null);
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Failed to fetch blog:', err);
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-8">{error || "The article you're looking for doesn't exist."}</p>
        <Link to="/blog" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  // Generate JSON-LD Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://apply4works.com/blog/${blog.slug}`
    },
    "headline": blog.title,
    "description": blog.metaDescription,
    "image": `https://apply4works.com${blog.featuredImage || '/og-image.jpg'}`,
    "author": {
      "@type": "Organization",
      "name": blog.author || "Apply4Works"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Apply4Works",
      "logo": {
        "@type": "ImageObject",
        "url": "https://apply4works.com/logo.jpg"
      }
    },
    "datePublished": blog.publishedDate,
    "dateModified": blog.updatedAt || blog.publishedDate
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>{blog.metaTitle}</title>
        <meta name="description" content={blog.metaDescription} />
        <link rel="canonical" href={blog.canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={blog.metaTitle} />
        <meta property="og:description" content={blog.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={blog.canonicalUrl} />
        <meta property="og:image" content={`https://apply4works.com${blog.featuredImage || '/og-image.jpg'}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.metaTitle} />
        <meta name="twitter:description" content={blog.metaDescription} />
        <meta name="twitter:image" content={`https://apply4works.com${blog.featuredImage || '/og-image.jpg'}`} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 pt-24 pb-16 px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-8 transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to all articles
          </Link>
          
          {blog.categories && blog.categories.length > 0 && (
            <div className="mb-6">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {blog.categories[0]}
              </span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            {blog.title}
          </h1>
          
          <div className="flex items-center text-gray-500 mb-8 space-x-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-3">
                {blog.author ? blog.author.charAt(0) : 'A'}
              </div>
              <span className="font-medium text-gray-900">{blog.author || 'Apply4Works'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              {new Date(blog.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {blog.readingTime || '5 min read'}
            </div>
          </div>
          
          <img 
            src={blog.featuredImage || '/og-image.jpg'} 
            alt={blog.title} 
            className="w-full h-[400px] object-cover rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* Content Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-12">
        <article className="flex-grow prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blog.content}
          </ReactMarkdown>
          
          <ShareButtons url={blog.canonicalUrl} title={blog.title} />
        </article>
      </main>

      {/* Related Posts */}
      {blog.relatedPosts && blog.relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-16 border-t border-gray-200 px-6">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {blog.relatedPosts.map(related => (
                <BlogCard key={related._id} blog={related} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Supercharge Your Career?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of professionals using our AI tools to build perfect resumes, ace interviews, and track job applications effortlessly.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/resume-builder" className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg">
              Build My Resume
            </Link>
            <Link to="/interview-prep" className="bg-blue-700 text-white border border-blue-500 px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-colors">
              Practice Interviews
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
