import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { blogPosts } from './blogData';

export default function BlogIndex() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SEO 
        title="Jobright AI Blog - Career Advice & Resume Tips" 
        description="Read the latest articles on how to optimize your resume, beat the ATS, and land more interviews." 
        canonical="/blog"
      />
      
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold mb-4 text-gray-900">The Jobright AI Blog</h1>
        <p className="text-xl text-gray-600">Expert advice on navigating the modern job market.</p>
      </div>

      <div className="grid gap-8">
        {blogPosts.map((post) => (
          <article key={post.slug} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{post.category}</span>
              <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                {post.title}
              </Link>
            </h2>
            
            <p className="text-gray-600 mb-6 line-clamp-3">
              {post.excerpt}
            </p>
            
            <Link to={`/blog/${post.slug}`} className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              Read article <span aria-hidden="true">&rarr;</span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
