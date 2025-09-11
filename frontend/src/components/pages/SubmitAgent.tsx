import React, { useState, useEffect } from 'react';
import { Send, Bot, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import { useAgents } from '../../hooks/useAgents';
import { apiService } from '../../services/api';
import { Category, AgentCreateRequest } from '../../types';
import { VALIDATION_RULES } from '../../utils/constants';

const SubmitAgent: React.FC = () => {
  const [formData, setFormData] = useState<AgentCreateRequest>({
    name: '',
    description: '',
    app_url: '',
    category: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const { createAgent } = useAgents();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoryData = await apiService.getCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (formData.name.length < VALIDATION_RULES.agentName.minLength) {
      newErrors.name = VALIDATION_RULES.agentName.message;
    } else if (formData.name.length > VALIDATION_RULES.agentName.maxLength) {
      newErrors.name = VALIDATION_RULES.agentName.message;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < VALIDATION_RULES.agentDescription.minLength) {
      newErrors.description = VALIDATION_RULES.agentDescription.message;
    } else if (formData.description.length > VALIDATION_RULES.agentDescription.maxLength) {
      newErrors.description = VALIDATION_RULES.agentDescription.message;
    }

    // URL validation
    if (!formData.app_url.trim()) {
      newErrors.app_url = 'Application URL is required';
    } else if (!VALIDATION_RULES.agentUrl.pattern.test(formData.app_url)) {
      newErrors.app_url = VALIDATION_RULES.agentUrl.message;
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear success message when user makes changes
    if (submitSuccess) {
      setSubmitSuccess(false);
      setSubmitMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await createAgent(formData);
      setSubmitSuccess(true);
      setSubmitMessage('Agent submitted successfully! Your submission is now pending admin approval.');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        app_url: '',
        category: '',
      });
    } catch (error: any) {
      setSubmitSuccess(false);
      setSubmitMessage(error.message || 'Failed to submit agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCount = (text: string, max: number) => {
    const count = text.length;
    const isOverLimit = count > max;
    return (
      <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
        {count}/{max}
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Submit Your AI Agent</h1>
      </div>

      {/* Success/Error Message */}
      {submitMessage && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          submitSuccess 
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {submitSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p>{submitMessage}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Agent Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Enter a descriptive name for your AI agent"
              maxLength={VALIDATION_RULES.agentName.maxLength}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
              <div className="ml-auto">
                {getCharacterCount(formData.name, VALIDATION_RULES.agentName.maxLength)}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Provide a detailed description of what your AI agent does, its capabilities, and how it can help users..."
              maxLength={VALIDATION_RULES.agentDescription.maxLength}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
              <div className="ml-auto">
                {getCharacterCount(formData.description, VALIDATION_RULES.agentDescription.maxLength)}
              </div>
            </div>
          </div>

          {/* Application URL */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Application URL *
            </label>
            <input
              type="url"
              name="app_url"
              value={formData.app_url}
              onChange={handleChange}
              className={`w-full p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.app_url ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="https://your-agent-app.com"
            />
            {errors.app_url && <p className="text-sm text-red-400 mt-2">{errors.app_url}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Provide the URL where users can access and interact with your AI agent
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full p-4 bg-gray-800 border rounded-lg text-white focus:outline-none transition-colors relative z-50 ${
                errors.category ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-400 mt-2">{errors.category}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Choose the category that best describes your AI agent's primary function
            </p>
          </div>


          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormData({ name: '', description: '', app_url: '', category: '' });
                setErrors({});
                setSubmitMessage('');
                setSubmitSuccess(false);
              }}
              disabled={isSubmitting}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="flex-1"
            >
              <Send className="w-5 h-5 mr-2" />
              Submit Agent for Review
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default SubmitAgent;