'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardNavbar from '../../../components/DashboardNavbar';
import SimpleImageCropper from '@/components/SimpleImageCropper';
import TextStyleControls from '@/components/TextStyleControls';
import { getCroppedImg } from '@/lib/imageUtils';
import { useToast } from '@/contexts/ToastContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: string;
  hero_image: string | null;
  original_hero_image?: string | null;
  link_type: 'opentable' | 'app_page';
  link_url: string;
  link_text: string;
  seating_type: 'open' | 'limited';
  event_type: string;
  is_active: boolean;
  display_order: number;
  order_priority: number | null;
  opentable_url?: string;
  app_page?: string;
  
  // Text styling fields
  title_color: string;
  title_bold: boolean;
  date_color: string;
  date_bold: boolean;
  time_color: string;
  time_bold: boolean;
  location_color: string;
  location_bold: boolean;
  description_color: string;
  description_bold: boolean;
  price_color: string;
  price_bold: boolean;
  button_text_color: string;
  button_text_bold: boolean;
  seating_text_color: string;
  seating_text_bold: boolean;
}

export default function EventsPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('');
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    hero_image: '',
    opentable_url: '', // New field for optional OpenTable URL
    app_page: '', // New field for app page selection
    link_text: '',
    seating_type: 'open' as 'open' | 'limited',
    is_active: false, // New events start as inactive
    // Text styling fields with defaults
    title_color: '#ffffff',
    title_bold: false,
    date_color: '#000000',
    date_bold: false,
    time_color: '#000000',
    time_bold: false,
    location_color: '#000000',
    location_bold: false,
    description_color: '#000000',
    description_bold: false,
    price_color: '#810000',
    price_bold: false,
    button_text_color: '#ffffff',
    button_text_bold: false,
    seating_text_color: '#810000',
    seating_text_bold: false
  });

  const formatEventDate = (dateString: string) => {
    const descriptiveDates = ['Every Sunday', 'Saturday & Sunday', 'Monday - Friday', 'By Reservation'];
    if (descriptiveDates.includes(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size must be less than 5MB.', 'error');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const uploadImageToStorage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-event-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Log deduplication info
      if (data.isDuplicate) {
        console.log(`✅ Image reused (deduplicated): ${data.fileName}`);
      } else {
        console.log(`📤 New image uploaded: ${data.fileName}`);
      }
      
      return data.url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Image upload error:', errorMessage);
      showToast(`Image upload failed: ${errorMessage}`, 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadCroppedImageToStorage = async (file: File, eventId: string, deleteOldCropped: boolean = true) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('eventId', eventId);
    formData.append('deleteOldCropped', deleteOldCropped.toString());

    try {
      const response = await fetch('/api/upload-cropped-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload cropped image');
      }

      const data = await response.json();
      
      console.log(`✅ Cropped image uploaded: ${data.fileName}`);
      
      return data.url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Cropped image upload error:', errorMessage);
      showToast(`Cropped image upload failed: ${errorMessage}`, 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array and wrapped response formats
        setEvents(Array.isArray(data) ? data : (data.events || []));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch events:', errorData);
        showToast(`Failed to fetch events: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast(`Network error: ${error instanceof Error ? error.message : 'Failed to fetch events'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingEvent) {
        handleCancelEdit();
      }
    };

    if (editingEvent) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [editingEvent]);

  const deleteImageFromStorage = async (imageUrl: string) => {
    if (!imageUrl) return false;
    
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting image:', errorData.error);
        return false;
      }

      console.log(`✅ Old image deleted: ${imageUrl}`);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    let imageUrl = newEvent.hero_image;

    // Upload image if selected
    if (selectedImage) {
      imageUrl = await uploadImageToStorage(selectedImage);
      if (!imageUrl) return; // Stop if image upload failed
    }

    // Always create hybrid events with app page navigation
    // If OpenTable URL is provided, it will be stored in reservation_url
    const link_type = 'app_page';
    let link_url = newEvent.app_page;
    
    // Generate dedicated event page URL from title if not provided
    if (!link_url) {
      const eventSlug = newEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      link_url = `/event/${eventSlug}`;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newEvent, 
          hero_image: imageUrl,
          original_hero_image: imageUrl, // Store the original image URL
          link_type,
          link_url,
          app_page: link_url, // Ensure app_page is set
          reservation_url: newEvent.opentable_url || null // Store OpenTable URL in reservation_url
        }),
      });

      if (response.ok) {
        setNewEvent({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          price: '',
          hero_image: '',
          opentable_url: '',
          app_page: '',
          link_text: '',
          seating_type: 'open',
          is_active: false, // Reset to inactive for new events
          // Reset styling fields to defaults
          title_color: '#ffffff',
          title_bold: false,
          date_color: '#000000',
          date_bold: false,
          time_color: '#000000',
          time_bold: false,
          location_color: '#000000',
          location_bold: false,
          description_color: '#000000',
          description_bold: false,
          price_color: '#810000',
          price_bold: false,
          button_text_color: '#ffffff',
          button_text_bold: false,
          seating_text_color: '#810000',
          seating_text_bold: false
        });
        setSelectedImage(null);
        setImagePreview(null);
        setShowCreateForm(false);
        fetchEvents();
      } else {
        const errorData = await response.json();
        showToast(`Failed to create event: ${errorData.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('An unexpected error occurred while creating the event.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      setTogglingStatus(eventId);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        showToast(`Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchEvents();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error updating event status:', errorData);
        showToast(`Failed to update event status: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      showToast(`Network error: ${error instanceof Error ? error.message : 'Failed to update event status'}`, 'error');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleOrderPriorityChange = async (eventId: string, newPriority: number | null) => {
    try {
      // Find the current event and any existing event with the new priority
      const currentEvent = events.find(event => event.id === eventId);
      const existingEvent = newPriority !== null ? events.find(event => 
        event.id !== eventId && event.order_priority === newPriority
      ) : null;

      // If there's a conflict, we need to swap priorities
      if (existingEvent && currentEvent) {
        const currentPriority = currentEvent.order_priority;
        
        // Update both events in sequence
        const updatePromises = [
          fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_priority: newPriority }),
          }),
          fetch(`/api/events/${existingEvent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_priority: currentPriority }),
          })
        ];

        const responses = await Promise.all(updatePromises);
        const allSuccessful = responses.every(response => response.ok);

        if (allSuccessful) {
          fetchEvents();
        } else {
          showToast('Failed to swap order priorities. Please try again.', 'error');
        }
      } else {
        // No conflict, just update the current event
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_priority: newPriority }),
        });

        if (response.ok) {
          fetchEvents();
        } else {
          const errorData = await response.json();
          showToast(`Failed to update order priority: ${errorData.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error updating order priority:', error);
      showToast('An unexpected error occurred while updating order priority.', 'error');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    // Use original_hero_image if it exists, otherwise use hero_image as the original
    const trueOriginalUrl = event.original_hero_image || event.hero_image || '';
    setOriginalImageUrl(trueOriginalUrl); // Store the true original image URL
    setEditImagePreview(null); // Don't set preview to original image URL
    setEditSelectedImage(null);
    setCroppedImageFile(null); // Clear any previous crops
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setEditImagePreview(null);
    setEditSelectedImage(null);
    setCroppedImageFile(null);
    setShowCropper(false);
    setCropperImageSrc('');
    setOriginalImageUrl('');
    setShowDeleteConfirm(false);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size must be less than 5MB.', 'error');
        return;
      }
      setEditSelectedImage(file);
      setCroppedImageFile(null); // Clear any previous crop
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
      setOriginalImageUrl(previewUrl); // Update original image URL for cropper
    } else {
      setEditSelectedImage(null);
      setCroppedImageFile(null);
      setEditImagePreview(null); // Clear preview when no file selected
      setOriginalImageUrl(''); // Clear original image URL when no file selected
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    let imageUrl = editingEvent.hero_image;
    const oldImageUrl = editingEvent.hero_image; // Store old image URL for deletion

    // Upload new image if selected (either original or cropped)
    const imageToUpload = croppedImageFile || editSelectedImage;
    if (imageToUpload) {
      if (croppedImageFile) {
        // Upload cropped image to cropped folder and delete old cropped versions
        const uploadedUrl = await uploadCroppedImageToStorage(croppedImageFile, editingEvent.id, true);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
      } else if (editSelectedImage) {
        // Upload new original image to events folder
        const uploadedUrl = await uploadImageToStorage(editSelectedImage);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
      }
    }

    // Handle app page navigation - either selected page or auto-generated dedicated page
    const link_type = 'app_page';
    let link_url = editingEvent.app_page;
    
    // Generate dedicated event page URL from title if no specific app page is selected
    if (!link_url) {
      const eventSlug = editingEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      link_url = `/event/${eventSlug}`;
    }

    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingEvent,
          hero_image: imageUrl,
          original_hero_image: editingEvent.original_hero_image || editingEvent.hero_image, // Preserve original
          link_type,
          link_url,
          app_page: link_url, // Ensure app_page is set
          reservation_url: editingEvent.opentable_url || null // Store OpenTable URL in reservation_url
        }),
      });

      if (response.ok) {
        // Delete old image if a new image was uploaded and it's different from the old one
        if (imageToUpload && oldImageUrl && imageUrl !== oldImageUrl) {
          await deleteImageFromStorage(oldImageUrl);
        }
        
        setEditingEvent(null);
        setEditImagePreview(null);
        setEditSelectedImage(null);
        setCroppedImageFile(null);
        setOriginalImageUrl('');
        fetchEvents();
      } else {
        const errorData = await response.json();
        showToast(`Failed to update event: ${errorData.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      showToast('An unexpected error occurred while updating the event.', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEditingEvent(null);
        setEditImagePreview(null);
        setEditSelectedImage(null);
        setCroppedImageFile(null);
        setOriginalImageUrl('');
        setShowDeleteConfirm(false);
        fetchEvents();
        showToast('Event deleted successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(`Failed to delete event: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('An unexpected error occurred while deleting the event.', 'error');
    }
  };

  // Image cropper functions
  const handleImagePreviewClick = () => {
    // Prioritize newly selected image, then original image, then current hero image
    const imageToCrop = editImagePreview || originalImageUrl || editingEvent?.hero_image;
    
    if (imageToCrop) {
      console.log('Opening cropper with image:', imageToCrop);
      setCropperImageSrc(imageToCrop);
      setShowCropper(true);
    } else {
      console.log('No image to crop');
    }
  };

  const handleCropComplete = async (croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    // This is called when the crop area changes - just store the pixels
    console.log('Crop area changed:', croppedAreaPixels);
  };

  const handleApplyCrop = async (croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    try {
      console.log('Applying crop with pixels:', croppedAreaPixels);
      const croppedImage = await getCroppedImg(
        cropperImageSrc,
        croppedAreaPixels,
        'cropped-event-image.jpg'
      );
      console.log('Cropped image created:', croppedImage);
      setCroppedImageFile(croppedImage);
      
      // Update preview with cropped image
      const previewUrl = URL.createObjectURL(croppedImage);
      console.log('Preview URL created:', previewUrl);
      setEditImagePreview(previewUrl);
      
      // Show success message
      showToast('Image cropped successfully! The cropped image will be used when you save the event.', 'success');
    } catch (error) {
      console.error('Error cropping image:', error);
      showToast('Error cropping image. Please try again.', 'error');
    }
  };

  const handleCloseCropper = () => {
    setShowCropper(false);
    setCropperImageSrc('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardNavbar currentPage="events" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Events Management</h2>
            <p className="mt-2 text-gray-600">
              Create and manage restaurant events, special menus, and dining experiences.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
          >
            + Create New Event
          </button>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              {/* Basic Event Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Event Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter event title"
                    required
                  />
                  <div className="mt-2">
                    <TextStyleControls
                      label="Event Title"
                      color={newEvent.title_color}
                      bold={newEvent.title_bold}
                      onColorChange={(color) => setNewEvent({ ...newEvent, title_color: color })}
                      onBoldChange={(bold) => setNewEvent({ ...newEvent, title_bold: bold })}
                      recommendedColor="#ffffff"
                      recommendedBold={true}
                    />
                  </div>
                </div>
              </div>

              {/* Date, Time, Location */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="text"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter event date (optional)"
                    />
                    <div className="mt-2">
                      <TextStyleControls
                        label="Date"
                        color={newEvent.date_color}
                        bold={newEvent.date_bold}
                        onColorChange={(color) => setNewEvent({ ...newEvent, date_color: color })}
                        onBoldChange={(bold) => setNewEvent({ ...newEvent, date_bold: bold })}
                        recommendedColor="#ab974f"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="text"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter event time (optional)"
                    />
                    <div className="mt-2">
                      <TextStyleControls
                        label="Time"
                        color={newEvent.time_color}
                        bold={newEvent.time_bold}
                        onColorChange={(color) => setNewEvent({ ...newEvent, time_color: color })}
                        onBoldChange={(bold) => setNewEvent({ ...newEvent, time_bold: bold })}
                        recommendedColor="#ab974f"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter event location"
                      required
                    />
                    <div className="mt-2">
                      <TextStyleControls
                        label="Location"
                        color={newEvent.location_color}
                        bold={newEvent.location_bold}
                        onColorChange={(color) => setNewEvent({ ...newEvent, location_color: color })}
                        onBoldChange={(bold) => setNewEvent({ ...newEvent, location_bold: bold })}
                        recommendedColor="#ab974f"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter event description"
                  required
                />
                <div className="mt-2">
                  <TextStyleControls
                    label="Description"
                    color={newEvent.description_color}
                    bold={newEvent.description_bold}
                    onColorChange={(color) => setNewEvent({ ...newEvent, description_color: color })}
                    onBoldChange={(bold) => setNewEvent({ ...newEvent, description_bold: bold })}
                    recommendedColor="#000000"
                  />
                </div>
              </div>


              {/* Price and Hero Image */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <input
                      type="text"
                      value={newEvent.price}
                      onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter event price"
                    />
                    <div className="mt-2">
                      <TextStyleControls
                        label="Price"
                        color={newEvent.price_color}
                        bold={newEvent.price_bold}
                        onColorChange={(color) => setNewEvent({ ...newEvent, price_color: color })}
                        onBoldChange={(bold) => setNewEvent({ ...newEvent, price_bold: bold })}
                        recommendedColor="#810000"
                        recommendedBold={true}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded-md border" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* App Page Navigation */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">App Page Navigation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which page users will be directed to when they tap the event button (e.g., lunch menu, dinner menu, etc.)
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Page</label>
                <select
                  value={newEvent.app_page || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, app_page: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                >
                  <option value="">Select a page...</option>
                  <optgroup label="Menus">
                    <option value="/lunch-menu">Lunch Menu</option>
                    <option value="/dinner-menu">Dinner Menu</option>
                    <option value="/happy-hour-menu">Happy Hour Menu</option>
                    <option value="/bar-bites-menu">Bar Bites Menu</option>
                    <option value="/brunch-menu">Brunch Menu</option>
                    <option value="/wine-list">Wine List</option>
                    <option value="/cocktail-menu">Cocktail Menu</option>
                  </optgroup>
                  <optgroup label="Special Events">
                    <option value="/private-dining">Private Dining</option>
                    <option value="/catering">Catering</option>
                    <option value="/wine-tastings">Wine Tastings</option>
                    <option value="/live-music">Live Music Schedule</option>
                  </optgroup>
                  <optgroup label="Information">
                    <option value="/about">About Us</option>
                    <option value="/location">Location & Hours</option>
                    <option value="/contact">Contact Us</option>
                    <option value="/gift-cards">Gift Cards</option>
                  </optgroup>
                  <optgroup label="Reservations">
                    <option value="/reservations">Make a Reservation</option>
                  </optgroup>
                </select>
              <p className="text-sm text-gray-500 mt-1">
                The page selected will automatically have a redirection button placed at the bottom of the automatically generated page.
              </p>
              </div>

              {/* OpenTable URL (Optional) */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Reservation Button (Optional)</h3>
                <p className="text-sm text-gray-600 mb-3">Add an OpenTable URL to show &quot;Reserve Your Spot&quot; buttons on the event page.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OpenTable URL</label>
                  <input
                    type="url"
                    value={newEvent.opentable_url}
                    onChange={(e) => setNewEvent({ ...newEvent, opentable_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://www.opentable.com/restaurant/profile/..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    If provided, &quot;Reserve Your Spot&quot; buttons will appear at the top and bottom of the event page
                  </p>
                </div>
              </div>


              {/* Button Text and Seating */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={newEvent.link_text}
                      onChange={(e) => setNewEvent({ ...newEvent, link_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter button text"
                    />
                    <div className="mt-2">
                      <TextStyleControls
                        label="Button Text"
                        color={newEvent.button_text_color}
                        bold={newEvent.button_text_bold}
                        onColorChange={(color) => setNewEvent({ ...newEvent, button_text_color: color })}
                        onBoldChange={(bold) => setNewEvent({ ...newEvent, button_text_bold: bold })}
                        recommendedColor="#ffffff"
                        recommendedBold={true}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seating Type</label>
                    <select
                      value={newEvent.seating_type}
                      onChange={(e) => setNewEvent({ ...newEvent, seating_type: e.target.value as 'open' | 'limited' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    >
                      <option value="open">Open Seating</option>
                      <option value="limited">Limited Seating</option>
                    </select>
                    <div className="mt-2">
                      <TextStyleControls
                        label="Seating Text"
                        color={newEvent.seating_text_color}
                        bold={newEvent.seating_text_bold}
                        onColorChange={(color) => setNewEvent({ ...newEvent, seating_text_color: color })}
                        onBoldChange={(bold) => setNewEvent({ ...newEvent, seating_text_bold: bold })}
                        recommendedColor="#ab974f"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Hero Section */}
                <div className="relative h-64">
                  {event.hero_image ? (
                    <img 
                      src={event.hero_image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Image loaded successfully:', event.title, 'URL:', event.hero_image)}
                      onError={(e) => console.log('Image failed to load:', event.hero_image, e)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-black bg-opacity-40">
                    <h3 
                      className={`text-2xl font-bold mb-2 ${event.title_bold ? 'font-bold' : 'font-normal'}`}
                      style={{ color: event.title_color || '#ffffff' }}
                    >
                      {event.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm">
                      {event.date && event.date.trim() && (
                        <span 
                          className={`flex items-center ${event.date_bold ? 'font-bold' : 'font-normal'}`}
                          style={{ color: event.date_color || '#ffffff' }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {formatEventDate(event.date)}
                        </span>
                      )}
                      {event.time && event.time.trim() && (
                        <span 
                          className={`flex items-center ${event.time_bold ? 'font-bold' : 'font-normal'}`}
                          style={{ color: event.time_color || '#ffffff' }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {event.time}
                        </span>
                      )}
                      <span 
                        className={`flex items-center ${event.location_bold ? 'font-bold' : 'font-normal'}`}
                        style={{ color: event.location_color || '#ffffff' }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6">
                  {/* Top CTA for OpenTable events */}
                  {event.link_type === 'opentable' && (
                    <div className="mb-4">
                      <a
                        href={event.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors ${event.button_text_bold ? 'font-bold' : 'font-medium'}`}
                        style={{ color: event.button_text_color || '#ffffff' }}
                      >
                        {event.link_text}
                      </a>
                    </div>
                  )}

                  {/* Description */}
                  <p 
                    className={`mb-6 leading-relaxed ${event.description_bold ? 'font-bold' : 'font-normal'}`}
                    style={{ color: event.description_color || '#374151' }}
                  >
                    {event.description}
                  </p>

                  {/* Event Info */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    {event.date && event.date.trim() && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{formatEventDate(event.date)}</span>
                      </div>
                    )}
                    {event.time && event.time.trim() && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{event.location}</span>
                    </div>
                  </div>

                  {/* Price and Seating */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      {event.price && (
                        <span 
                          className={`text-lg ${event.price_bold ? 'font-bold' : 'font-semibold'}`}
                          style={{ color: event.price_color || '#111827' }}
                        >
                          {event.price}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.seating_type === 'open' 
                          ? 'bg-green-100' 
                          : 'bg-yellow-100'
                      } ${event.seating_text_bold ? 'font-bold' : 'font-medium'}`}
                      style={{ color: event.seating_text_color || (event.seating_type === 'open' ? '#166534' : '#92400e') }}>
                        {event.seating_type === 'open' ? 'Open Seating' : 'Limited Seating'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom CTA and Actions */}
                  <div className="flex items-center justify-between">
                    <a
                      href={event.link_type === 'opentable' ? event.link_url : `#${event.link_url}`}
                      target={event.link_type === 'opentable' ? '_blank' : '_self'}
                      rel={event.link_type === 'opentable' ? 'noopener noreferrer' : ''}
                      className={`bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors ${event.button_text_bold ? 'font-bold' : 'font-medium'}`}
                      style={{ color: event.button_text_color || '#ffffff' }}
                    >
                      {event.link_text}
                    </a>
                    
                    <div className="flex items-center space-x-4">
                      {/* Order Priority Dropdown */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Order:</label>
                        <select
                          value={event.order_priority || ''}
                          onChange={(e) => handleOrderPriorityChange(event.id, parseInt(e.target.value) || null)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold text-gray-900 bg-white"
                        >
                          <option value="" className="text-gray-500">None</option>
                          {Array.from({ length: events.length }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num} className="text-gray-900 font-semibold">
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleEventStatus(event.id, event.is_active)}
                          disabled={togglingStatus === event.id}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            event.is_active
                              ? 'bg-gray-500 hover:bg-gray-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {togglingStatus === event.id ? 'Updating...' : (event.is_active ? 'Deactivate' : 'Activate')}
                        </button>
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelEdit();
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-800">Edit Event</h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleUpdateEvent}>
                  {/* Basic Event Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Event Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                        placeholder="Enter event title"
                        required
                      />
                      <div className="mt-2">
                          <TextStyleControls
                            label="Event Title"
                            color={editingEvent.title_color || '#ffffff'}
                            bold={editingEvent.title_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, title_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, title_bold: bold })}
                            recommendedColor="#ffffff"
                            recommendedBold={true}
                          />
                      </div>
                    </div>
                  </div>

              {/* Date, Time, Location */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="text"
                          value={editingEvent.date}
                          onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                          placeholder="Enter event date (optional)"
                        />
                        <div className="mt-2">
                          <TextStyleControls
                            label="Date"
                            color={editingEvent.date_color || '#000000'}
                            bold={editingEvent.date_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, date_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, date_bold: bold })}
                            recommendedColor="#ab974f"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <input
                          type="text"
                          value={editingEvent.time}
                          onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                          placeholder="Enter event time (optional)"
                        />
                        <div className="mt-2">
                          <TextStyleControls
                            label="Time"
                            color={editingEvent.time_color || '#000000'}
                            bold={editingEvent.time_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, time_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, time_bold: bold })}
                            recommendedColor="#ab974f"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={editingEvent.location}
                          onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                          placeholder="Enter event location"
                          required
                        />
                        <div className="mt-2">
                          <TextStyleControls
                            label="Location"
                            color={editingEvent.location_color || '#000000'}
                            bold={editingEvent.location_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, location_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, location_bold: bold })}
                            recommendedColor="#ab974f"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter event description"
                      required
                    />
                    <div className="mt-2">
                      <TextStyleControls
                            label="Description"
                            color={editingEvent.description_color || '#000000'}
                            bold={editingEvent.description_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, description_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, description_bold: bold })}
                            recommendedColor="#000000"
                      />
                    </div>
                  </div>

                  {/* Price and Hero Image */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                        <input
                          type="text"
                          value={editingEvent.price}
                          onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                          placeholder="Enter event price"
                        />
                        <div className="mt-2">
                          <TextStyleControls
                            label="Price"
                            color={editingEvent.price_color || '#810000'}
                            bold={editingEvent.price_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, price_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, price_bold: bold })}
                            recommendedColor="#810000"
                            recommendedBold={true}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image Upload</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageSelect}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-2">Preview:</p>
                          <div 
                            onClick={handleImagePreviewClick}
                            className="cursor-pointer group relative w-32 h-20 rounded-md border overflow-hidden"
                          >
                            {(editImagePreview || editingEvent.original_hero_image || editingEvent.hero_image) ? (
                              <img 
                                src={editImagePreview || editingEvent.original_hero_image || editingEvent.hero_image || ''} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-100">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Click image to crop and adjust positioning</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* App Page Navigation */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">App Page Navigation</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select which page users will be directed to when they tap the event button (e.g., lunch menu, dinner menu, etc.)
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App Page</label>
                    <select
                      value={editingEvent.app_page || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, app_page: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    >
                      <option value="">Select a page...</option>
                      <optgroup label="Main Navigation">
                        <option value="/">Home</option>
                        <option value="/menus">Menus</option>
                        <option value="/events">Events</option>
                        <option value="/reservations">Reservations</option>
                        <option value="/more">More</option>
                      </optgroup>
                      <optgroup label="Menu Pages">
                        <option value="/lunch-menu">Lunch Menu</option>
                        <option value="/dinner-menu">Dinner Menu</option>
                        <option value="/happy-hour">Happy Hour</option>
                        <option value="/bar-bites-menu">Bar Bites Menu</option>
                        <option value="/brunch-menu">Brunch Menu</option>
                        <option value="/weekend-brunch">Weekend Brunch</option>
                        <option value="/dessert-menu">Dessert Menu</option>
                        <option value="/kids-menu">Kids Menu</option>
                        <option value="/wine-list">Wine List</option>
                        <option value="/cocktail-list">Cocktail List</option>
                        <option value="/retail-wine">Retail Wine</option>
                      </optgroup>
                      <optgroup label="Special Services">
                        <option value="/private-dining">Private Dining</option>
                        <option value="/private-dining-request">Private Dining Request</option>
                      </optgroup>
                      <optgroup label="Information">
                        <option value="/about">About Us</option>
                        <option value="/hours">Hours</option>
                        <option value="/directions">Directions</option>
                        <option value="/contact-information">Contact Information</option>
                        <option value="/feedback">Feedback</option>
                      </optgroup>
                      <optgroup label="User Features">
                        <option value="/profile">Profile</option>
                        <option value="/my-coupons">My Coupons</option>
                        <option value="/app-permissions">App Permissions</option>
                      </optgroup>
                    </select>
              <p className="text-sm text-gray-500 mt-1">
                The page selected will automatically have a redirection button placed at the bottom of the automatically generated page.
              </p>
                  </div>

                  {/* OpenTable URL (Optional) */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Reservation Button (Optional)</h3>
                    <p className="text-sm text-gray-600 mb-3">Add an OpenTable URL to show &quot;Reserve Your Spot&quot; buttons on the event page.</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">OpenTable URL</label>
                      <input
                        type="url"
                        value={editingEvent.opentable_url || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, opentable_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                        placeholder="https://www.opentable.com/restaurant/profile/..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        If provided, &quot;Reserve Your Spot&quot; buttons will appear at the top and bottom of the event page
                      </p>
                    </div>
                  </div>


                  {/* Button Text and Seating */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                        <input
                          type="text"
                          value={editingEvent.link_text}
                          onChange={(e) => setEditingEvent({ ...editingEvent, link_text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                          placeholder="Enter button text"
                        />
                        <div className="mt-2">
                          <TextStyleControls
                            label="Button Text"
                            color={editingEvent.button_text_color || '#ffffff'}
                            bold={editingEvent.button_text_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, button_text_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, button_text_bold: bold })}
                            recommendedColor="#ffffff"
                            recommendedBold={true}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Seating Type</label>
                        <select
                          value={editingEvent.seating_type}
                          onChange={(e) => setEditingEvent({ ...editingEvent, seating_type: e.target.value as 'open' | 'limited' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                        >
                          <option value="open">Open Seating</option>
                          <option value="limited">Limited Seating</option>
                        </select>
                        <div className="mt-2">
                          <TextStyleControls
                            label="Seating Text"
                            color={editingEvent.seating_text_color || '#810000'}
                            bold={editingEvent.seating_text_bold || false}
                            onColorChange={(color) => setEditingEvent({ ...editingEvent, seating_text_color: color })}
                            onBoldChange={(bold) => setEditingEvent({ ...editingEvent, seating_text_bold: bold })}
                            recommendedColor="#ab974f"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Event
                    </button>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Updating...' : 'Update Event'}
                    </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && editingEvent && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteConfirm(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Delete Event</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{editingEvent.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Cropper Modal */}
        {showCropper && (
          <SimpleImageCropper
            imageSrc={cropperImageSrc}
            onCropComplete={handleCropComplete}
            onApplyCrop={handleApplyCrop}
            onClose={handleCloseCropper}
          />
        )}
      </main>
    </div>
  );
}