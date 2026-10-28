import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

const BlogCard = ({ blog }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <Link to={`/blog/${blog.slug}`} className="block relative overflow-hidden group h-48">
        <img 
          src={blog.featuredImage || '/og-image.jpg'} 
          alt={blog.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {blog.categories && blog.categories.length > 0 && (
          <div className="absolute top-4 left-4">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {blog.categories[0]}
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(blog.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {blog.readingTime || '5 min read'}
          </div>
        </div>
        
        <Link to={`/blog/${blog.slug}`} className="block group mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 mb-6 line-clamp-3 text-sm flex-grow">
          {blog.metaDescription}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {blog.author ? blog.author.charAt(0) : 'A'}
            </div>
            <span className="text-sm font-medium text-gray-700">{blog.author || 'Apply4Works'}</span>
          </div>
          
          <Link to={`/blog/${blog.slug}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center transition-colors">
            Read <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
