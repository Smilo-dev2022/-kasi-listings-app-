import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './CreateAd.css';

const CreateAd = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const durationDays = watch('durationDays', 7);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  const onSubmit = async (data) => {
    setUploading(true);
    setError(null);

    try {
      // Create the advertisement
      const adData = {
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        durationDays: parseInt(data.durationDays),
        imageUrl: imagePreview // In production, upload to cloud storage
      };

      const response = await axios.post('http://localhost:5000/api/advertisements', adData);
      const adId = response.data._id;

      // Redirect to payment
      const paymentResponse = await axios.post(`http://localhost:5000/api/advertisements/${adId}/checkout`);
      
      // Redirect to Stripe Checkout
      window.location.href = paymentResponse.data.url;
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create advertisement');
      setUploading(false);
    }
  };

  const calculatePrice = () => {
    const pricePerDay = 10; // $10 per day
    return (durationDays * pricePerDay).toFixed(2);
  };

  return (
    <div className="create-ad-container">
      <div className="create-ad-header">
        <h1>Create New Advertisement</h1>
        <p>Reach your target audience with a professional advertisement</p>
      </div>

      <div className="create-ad-content">
        <form onSubmit={handleSubmit(onSubmit)} className="ad-form">
          <div className="form-section">
            <h3>Advertisement Details</h3>
            
            <div className="form-group">
              <label htmlFor="title">Advertisement Title *</label>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Enter your advertisement title"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="content">Advertisement Content *</label>
              <textarea
                id="content"
                {...register('content', { 
                  required: 'Content is required',
                  minLength: { value: 10, message: 'Content must be at least 10 characters' }
                })}
                placeholder="Describe your advertisement content..."
                rows="4"
                className={errors.content ? 'error' : ''}
              />
              {errors.content && <span className="error-message">{errors.content.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="targetAudience">Target Audience</label>
              <select
                id="targetAudience"
                {...register('targetAudience')}
              >
                <option value="all">All Users</option>
                <option value="renters">Renters</option>
                <option value="job_seekers">Job Seekers</option>
                <option value="businesses">Businesses</option>
                <option value="landlords">Landlords</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Advertisement Image</h3>
            <div
              {...getRootProps()}
              className={`image-upload ${isDragActive ? 'drag-active' : ''}`}
            >
              <input {...getInputProps()} />
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <p>Click or drag to replace image</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <i className="upload-icon">📷</i>
                  <p>{isDragActive ? 'Drop the image here' : 'Click or drag to upload image'}</p>
                  <span>Supports: JPG, PNG, GIF (Max 5MB)</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Campaign Duration & Pricing</h3>
            
            <div className="form-group">
              <label htmlFor="durationDays">Duration (Days) *</label>
              <input
                type="number"
                id="durationDays"
                {...register('durationDays', { 
                  required: 'Duration is required',
                  min: { value: 1, message: 'Minimum 1 day' },
                  max: { value: 365, message: 'Maximum 365 days' }
                })}
                min="1"
                max="365"
                className={errors.durationDays ? 'error' : ''}
              />
              {errors.durationDays && <span className="error-message">{errors.durationDays.message}</span>}
            </div>

            <div className="pricing-card">
              <h4>Pricing Summary</h4>
              <div className="pricing-details">
                <div className="pricing-row">
                  <span>Duration:</span>
                  <span>{durationDays} days</span>
                </div>
                <div className="pricing-row">
                  <span>Price per day:</span>
                  <span>$10.00</span>
                </div>
                <div className="pricing-row total">
                  <span>Total:</span>
                  <span>${calculatePrice()}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/ads')}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Creating...' : 'Create & Pay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd; 