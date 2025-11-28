import React, { useEffect, useState, FormEvent } from 'react';
import type { Sermon, Announcement, Event, SiteContent, PrayerRequest, BibleStudy, User } from '../types';
import { CloseIcon, UsersIcon, SermonsIcon, EventsIcon, GivingIcon } from '../constants/icons';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { CapacitorHttp } from '@capacitor/core';
import { uploadService } from '../services/uploadService';
import { uploadSermonWithVideo } from '../services/firebaseUploadService';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 animate-slide-in-up">
        <div className="bg-secondary p-3 rounded-full">
            <Icon className="w-8 h-8 text-primary" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-primary dark:text-white">{value}</p>
        </div>
    </div>
);


const AdminSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-serif font-bold text-primary dark:text-white border-b-2 border-secondary pb-2 mb-6">{title}</h2>
        {children}
    </div>
);

const AdminItem: React.FC<{ title: string, onEdit: () => void, onDelete: () => void, orderLabel?: string, onMoveUp?: () => void, onMoveDown?: () => void }> = ({ title, onEdit, onDelete, orderLabel, onMoveUp, onMoveDown }) => (
    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
        <div className="flex items-center gap-3 pr-4">
            {orderLabel && (
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-6 text-right">
                    {orderLabel}
                </span>
            )}
            <p className="text-text-main dark:text-gray-300 truncate">{title}</p>
        </div>
        <div className="space-x-2 flex-shrink-0 flex items-center">
            {onMoveUp && (
                <button
                    type="button"
                    className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-semibold transition-colors"
                    onClick={onMoveUp}
                >
                    ↑
                </button>
            )}
            {onMoveDown && (
                <button
                    type="button"
                    className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-semibold transition-colors"
                    onClick={onMoveDown}
                >
                    ↓
                </button>
            )}
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors" onClick={onEdit}>Edit</button>
            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors" onClick={onDelete}>Delete</button>
        </div>
    </div>
);

type ModalConfig = {
    isOpen: boolean;
    type: 'sermon' | 'announcement' | 'event' | 'bibleStudy' | null;
    item: Sermon | Announcement | Event | BibleStudy | null;
};

interface AdminModalProps {
    config: ModalConfig;
    onClose: () => void;
    onSave: (type: 'sermon' | 'announcement' | 'event' | 'bibleStudy', data: any) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ config, onClose, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (config.item) {
            setFormData(config.item);
        } else {
            // Set defaults for new items
            const defaults: any = {
                sermon: { title: '', pastor: '', scripture: '', videoUrl: null },
                announcement: { priority: 'Low' },
                event: { category: 'Community', date: new Date().toISOString().split('T')[0] },
                bibleStudy: { title: '', topic: '', scripture: '', description: '', questions: [], imageUrl: '' }
            };
            setFormData(config.type ? defaults[config.type] : {});
        }
    }, [config.item, config.type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'file') {
            const fileInput = e.target as HTMLInputElement;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                console.log('[AdminPage] Video file selected:', file.name, 'Size:', file.size, 'Type:', file.type);
                setFormData((prev: any) => ({ ...prev, [name]: file }));

                // Create a URL for preview only
                if (videoPreview) {
                    URL.revokeObjectURL(videoPreview);
                }
                const previewUrl = URL.createObjectURL(file);
                setVideoPreview(previewUrl);
                console.log('[AdminPage] Video preview created:', previewUrl);
            } else {
                console.error('[AdminPage] No file selected');
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLocalClose = () => {
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
            setVideoPreview(null);
        }
        const currentUrl = formData.videoUrl;
        const initialUrl = (config.item as Sermon)?.videoUrl;

        // Revoke the URL if it's a new blob URL that wasn't saved
        if (currentUrl && typeof currentUrl === 'string' && currentUrl.startsWith('blob:') && currentUrl !== initialUrl) {
             URL.revokeObjectURL(currentUrl);
        }
        onClose();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        console.log('[AdminPage] handleSubmit called, type:', config.type, 'formData:', formData);
        if(config.type) {
            if (config.type === 'sermon' && !config.item && !formData.videoUrl) {
                console.error('[AdminPage] ❌ No video URL in formData!');
                alert('Please select a video file for the new sermon.');
                return;
            }
            console.log('[AdminPage] Calling onSave...');
            onSave(config.type, formData);
        }
    };

    if (!config.isOpen || !config.type) return null;

    const isEditing = !!config.item;
    const titleCaseType = config.type.charAt(0).toUpperCase() + config.type.slice(1);
    const title = `${isEditing ? 'Edit' : 'Add'} ${titleCaseType}`;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center animate-fade-in p-4">
            <div className="bg-accent dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-serif font-bold text-primary dark:text-white">{title}</h3>
                    <button onClick={handleLocalClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <CloseIcon className="w-6 h-6 text-text-main dark:text-gray-300" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {config.type === 'sermon' && (
                        <>
                            <FormInput label="Title" name="title" value={formData.title || ''} onChange={handleChange} required />
                            <FormInput label="Pastor" name="pastor" value={formData.pastor || ''} onChange={handleChange} required />
                            <FormInput label="Scripture" name="scripture" value={formData.scripture || ''} onChange={handleChange} />
                            <FormInput label="Full Sermon URL (Optional)" name="fullSermonUrl" value={formData.fullSermonUrl || ''} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
                            <FormFileInput label="Sermon Video" name="videoUrl" onChange={handleChange} accept="video/*" required={!isEditing} />
                            {(videoPreview || (isEditing && typeof formData.videoUrl === 'string')) && (
                                <div className="mt-2">
                                    <p className="text-sm text-text-main dark:text-gray-400">Video Preview:</p>
                                    <video key={videoPreview || formData.videoUrl} src={videoPreview || formData.videoUrl} controls className="w-full h-auto rounded-md mt-1 max-h-48 bg-black" />
                                </div>
                            )}
                        </>
                    )}
                    {config.type === 'announcement' && (
                        <>
                            <FormInput label="Title" name="title" value={formData.title || ''} onChange={handleChange} required />
                            <FormInput label="Category" name="category" value={formData.category || ''} onChange={handleChange} required />
                            <FormTextArea label="Content" name="content" value={formData.content || ''} onChange={handleChange} required />
                            <FormSelect label="Priority" name="priority" value={formData.priority || 'Low'} onChange={handleChange}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </FormSelect>
                        </>
                    )}
                    {config.type === 'event' && (
                        <>
                            <FormInput label="Title" name="title" value={formData.title || ''} onChange={handleChange} required />
                            <FormInput label="Date" name="date" type="date" value={formData.date || ''} onChange={handleChange} required />
                            <FormInput label="Time" name="time" value={formData.time || ''} onChange={handleChange} required placeholder="e.g., 7:00 PM" />
                            <FormInput label="Location" name="location" value={formData.location || ''} onChange={handleChange} required />
                            <FormTextArea label="Description" name="description" value={formData.description || ''} onChange={handleChange} required />
                            <FormSelect label="Category" name="category" value={formData.category || 'Community'} onChange={handleChange}>
                                <option value="Worship">Worship</option>
                                <option value="Community">Community</option>
                                <option value="Outreach">Outreach</option>
                                <option value="Youth">Youth</option>
                            </FormSelect>
                        </>
                    )}
                    {config.type === 'bibleStudy' && (
                        <>
                            <FormInput label="Title" name="title" value={formData.title || ''} onChange={handleChange} required />
                            <FormInput label="Topic" name="topic" value={formData.topic || ''} onChange={handleChange} required placeholder="e.g., Prayer, Faith, Love" />
                            <FormInput label="Scripture" name="scripture" value={formData.scripture || ''} onChange={handleChange} required placeholder="e.g., John 3:16" />
                            <FormTextArea label="Description" name="description" value={formData.description || ''} onChange={handleChange} required />
                            <div>
                                <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">Discussion Questions</label>
                                <FormTextArea 
                                    label="" 
                                    name="questionsText" 
                                    value={Array.isArray(formData.questions) ? formData.questions.join('\n') : formData.questionsText || ''} 
                                    onChange={(e: any) => {
                                        const questions = e.target.value.split('\n').filter((q: string) => q.trim());
                                        setFormData({ ...formData, questions, questionsText: e.target.value });
                                    }} 
                                    placeholder="Enter one question per line"
                                    required 
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter each question on a new line</p>
                            </div>
                            <FormInput label="Image URL (optional)" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" />
                        </>
                    )}
                     <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={handleLocalClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-text-main dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-secondary text-primary font-bold hover:bg-gold-light transition-colors">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FormInput: React.FC<{label: string, name: string, value: string, onChange: any, required?: boolean, type?: string, placeholder?: string}> = ({label, name, ...props}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">{label}</label>
        <input id={name} name={name} {...props} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary" />
    </div>
);

const FormFileInput: React.FC<{
  label: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  accept?: string;
}> = ({ label, name, ...props }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1"
    >
      {label}
    </label>
    <input
      type="file"
      id={name}
      name={name}
      {...props}
      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-primary hover:file:bg-gold-light transition-colors cursor-pointer"
    />
  </div>
);

const FormTextArea: React.FC<{label: string, name: string, value: string, onChange: any, required?: boolean, placeholder?: string}> = ({label, name, ...props}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">{label}</label>
        <textarea id={name} name={name} rows={3} {...props} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary" />
    </div>
);

const FormSelect: React.FC<{label: string, name: string, value: string, onChange: any, children: React.ReactNode}> = ({label, name, children, ...props}) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">{label}</label>
        <select id={name} name={name} {...props} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary">
            {children}
        </select>
    </div>
);


const AdminPage: React.FC = () => {
    const { 
        sermons, addSermon, updateSermon, deleteSermon,
        announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        events, addEvent, updateEvent, deleteEvent,
        siteContent, updateSiteContent,
        prayerRequests, deletePrayerRequest, togglePrayerRequestPrayedFor,
        bibleStudies, addBibleStudy, updateBibleStudy, deleteBibleStudy
    } = useAppContext();
    const { users, user: authUser, updateUserRole } = useAuth();
    
    // Debug: Log sermons count
    console.log('[AdminPage] Sermons count:', sermons?.length || 0);
    console.log('[AdminPage] Sermons:', sermons);

    const sortedSermons = [...sermons].sort((a, b) => {
        const orderA = typeof (a as any).order === 'number' ? (a as any).order : Number.MAX_SAFE_INTEGER;
        const orderB = typeof (b as any).order === 'number' ? (b as any).order : Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
    });

    const [modalConfig, setModalConfig] = useState<ModalConfig>({ isOpen: false, type: null, item: null });
    const [editableSiteContent, setEditableSiteContent] = useState<SiteContent>({
        verseOfTheWeek: siteContent?.verseOfTheWeek || { text: '', citation: '' },
        contactInfo: siteContent?.contactInfo || { email: '', phone1: '', phone2: '', addressLine1: '', addressLine2: '' },
        socialLinks: siteContent?.socialLinks || { facebook: '', youtube: '', tiktok: '' }
    });

    // State for video upload progress
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        setEditableSiteContent(siteContent);
    }, [siteContent]);


    const handleOpenModal = (type: 'sermon' | 'announcement' | 'event', item: Sermon | Announcement | Event | null = null) => {
        setModalConfig({ isOpen: true, type, item });
    };

    const handleCloseModal = () => {
        setModalConfig({ isOpen: false, type: null, item: null });
    };

    const handleMoveSermon = (id: string, direction: 'up' | 'down') => {
        if (sortedSermons.length === 0) {
            return;
        }

        const index = sortedSermons.findIndex(s => s.id === id);
        if (index === -1) {
            return;
        }

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sortedSermons.length) {
            return;
        }

        const withOrder = sortedSermons.map((sermon, idx) => ({
            ...sermon,
            order: typeof (sermon as any).order === 'number' ? (sermon as any).order : idx + 1,
        }));

        const current = withOrder[index];
        const target = withOrder[targetIndex];
        const tempOrder = current.order!;
        current.order = target.order!;
        target.order = tempOrder;

        updateSermon(current);
        updateSermon(target);
    };

    const handleSave = async (type: 'sermon' | 'announcement' | 'event' | 'bibleStudy', data: any) => {
        try {
            console.log('[Admin] handleSave called with type:', type, 'data:', data);
            
            // Check if this is a new item BEFORE we assign an ID
            const isNewItem = !data.id;
            
            // For sermons with video File objects, upload to Cloudinary
            if (type === 'sermon' && data.videoUrl) {
                console.log('[Admin] Video URL type:', typeof data.videoUrl, 'Is File:', data.videoUrl instanceof File);
                
                if (typeof data.videoUrl === 'object' && data.videoUrl instanceof File) {
                    console.log('[Admin] 🔥 Uploading video to Firebase Storage...');
                    console.log('[Admin] Video file:', data.videoUrl.name, 'Size:', data.videoUrl.size);
                    
                    setUploadingVideo(true);
                    setUploadProgress(0);
                    
                    const fileSizeMB = data.videoUrl.size / (1024 * 1024);
                    console.log(`[Admin] Video size: ${fileSizeMB.toFixed(2)} MB`);
                    
                    try {
                        // Upload to Firebase Storage
                        const result = await uploadSermonWithVideo(
                            {
                                title: data.title,
                                pastor: data.pastor,
                                scripture: data.scripture,
                                date: data.date
                            },
                            data.videoUrl,
                            (progress) => {
                                setUploadProgress(progress);
                                console.log(`[Admin] Upload progress: ${progress.toFixed(1)}%`);
                            }
                        );
                        
                        if (!result.success) {
                            throw new Error(result.error || 'Upload failed');
                        }
                        
                        console.log('[Admin] ✅ Video uploaded and saved to database!');
                        setUploadingVideo(false);
                        setUploadProgress(100);
                        
                        // Show success message and close modal (no full page refresh needed)
                        alert('✅ Sermon uploaded successfully!');
                        handleCloseModal();
                        return; // Exit early since Firebase service already saved to database
                        
                    } catch (error) {
                        console.error('[Admin] ❌ Firebase upload failed:', error);
                        console.error('[Admin] Full error:', JSON.stringify(error, null, 2));
                        setUploadingVideo(false);
                        setUploadProgress(0);
                        
                        // Detailed error message with full error details
                        let errorMsg = '🔥 Firebase Upload Failed\n\n';
                        if (error instanceof Error) {
                            errorMsg += `Error: ${error.message}\n\n`;
                            if (error.stack) {
                                errorMsg += `Stack: ${error.stack.substring(0, 200)}\n\n`;
                            }
                        } else {
                            errorMsg += `Error: ${JSON.stringify(error)}\n\n`;
                        }
                        errorMsg += `Troubleshooting:\n`;
                        errorMsg += `1. Check Firebase Console for errors\n`;
                        errorMsg += `2. Verify Storage Rules are set\n`;
                        errorMsg += `3. Verify Anonymous Auth is enabled\n`;
                        errorMsg += `4. Check internet connection\n\n`;
                        errorMsg += `File size: ${fileSizeMB.toFixed(2)}MB`;
                        
                        alert(errorMsg);
                        return; // Don't continue if upload failed
                    }
                } else {
                    console.log('[Admin] Video URL is not a File object, using existing URL');
                }
            } else if (type === 'sermon') {
                console.error('[Admin] ❌ No video URL provided for sermon!');
            }

            const actionMap = {
                sermon: { add: addSermon, update: updateSermon },
                announcement: { add: addAnnouncement, update: updateAnnouncement },
                event: { add: addEvent, update: updateEvent },
                bibleStudy: { add: addBibleStudy, update: updateBibleStudy },
            };
            const actions = actionMap[type];

            if (isNewItem) { // Adding new (use the flag we saved earlier)
                console.log('[Admin] Adding new item:', type, data);
                actions.add(data);
                console.log('[Admin] ✅ Item added successfully');
            } else { // Editing existing
                console.log('[Admin] Updating existing item:', type, data.id);
                actions.update(data);
            }
            handleCloseModal();
        } catch (error) {
            console.error('[Admin] Error saving:', error);
            console.error('[Admin] Error details:', error instanceof Error ? error.message : String(error));
            console.error('[Admin] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            
            // Show detailed error message
            let errorMsg = '❌ FAILED TO SAVE\n\n';
            if (error instanceof Error) {
                errorMsg += `Error: ${error.message}\n\n`;
            }
            errorMsg += 'Possible causes:\n';
            errorMsg += '1. Server connection issue\n';
            errorMsg += '2. Video upload failed\n';
            errorMsg += '3. Invalid data format\n';
            errorMsg += '4. Network timeout\n\n';
            errorMsg += 'Check console for details (F12)';
            
            alert(errorMsg);
        }
    };

    const handleDelete = (type: 'sermon' | 'announcement' | 'event' | 'bibleStudy', id: string | number) => {
        if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
            switch (type) {
                case 'sermon':
                    deleteSermon(id as string);
                    break;
                case 'announcement':
                    deleteAnnouncement(id as number);
                    break;
                case 'event':
                    deleteEvent(id as string);
                    break;
                case 'bibleStudy':
                    deleteBibleStudy(id as string);
                    break;
            }
        }
    };

    const handleSiteContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const [section, key] = name.split('.');
        setEditableSiteContent(prev => ({
            ...prev,
            [section]: {
                // @ts-ignore
                ...prev[section],
                [key]: value
            }
        }));
    }

    const handleSaveSiteContent = (e: FormEvent) => {
        e.preventDefault();
        updateSiteContent(editableSiteContent);
        alert('Site content updated!');
    };

    return (
        <>
            <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow">
                <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
                    <h1 className="text-4xl font-serif font-bold text-primary dark:text-white mb-2">Admin Dashboard</h1>
                    <p className="text-red-500 dark:text-red-400 mb-8 text-sm font-semibold">Note: Changes made here are reflected across the app but will reset on page reload.</p>
                    
                    <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg mb-8" role="alert">
                        <p className="font-bold">Danger Zone</p>
                        <p>This will clear all sermons, announcements, events, chat messages, and site content from your browser's storage. This action cannot be undone.</p>
                        <button 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all application data? This is irreversible.')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="mt-2 px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                        >
                            Clear All Application Data
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Users" value={users.length} icon={UsersIcon} />
                        <StatCard title="Total Sermons" value={sermons.length} icon={SermonsIcon} />
                        <StatCard title="Upcoming Events" value={events.length} icon={EventsIcon} />
                        <StatCard title="Prayer Requests" value={prayerRequests.length} icon={GivingIcon} />
                    </div>

                    <AdminSection title="Site Content Management">
                        <form onSubmit={handleSaveSiteContent} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-primary dark:text-white mb-2">Verse of the Week</h3>
                                <FormTextArea label="Verse Text" name="verseOfTheWeek.text" value={editableSiteContent?.verseOfTheWeek?.text || ''} onChange={handleSiteContentChange} />
                                <FormInput label="Citation" name="verseOfTheWeek.citation" value={editableSiteContent?.verseOfTheWeek?.citation || ''} onChange={handleSiteContentChange} />
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-primary dark:text-white mt-4 mb-2">Contact Information</h3>
                                <FormInput label="Email" name="contactInfo.email" type="email" value={editableSiteContent?.contactInfo?.email || ''} onChange={handleSiteContentChange} />
                                <FormInput label="Phone 1" name="contactInfo.phone1" value={editableSiteContent?.contactInfo?.phone1 || ''} onChange={handleSiteContentChange} />
                                <FormInput label="Phone 2" name="contactInfo.phone2" value={editableSiteContent?.contactInfo?.phone2 || ''} onChange={handleSiteContentChange} />
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-primary dark:text-white mt-4 mb-2">Social Media Links</h3>
                                <FormInput label="Facebook URL" name="socialLinks.facebook" value={editableSiteContent?.socialLinks?.facebook || ''} onChange={handleSiteContentChange} />
                                <FormInput label="YouTube URL" name="socialLinks.youtube" value={editableSiteContent?.socialLinks?.youtube || ''} onChange={handleSiteContentChange} />
                                <FormInput label="TikTok URL" name="socialLinks.tiktok" value={editableSiteContent?.socialLinks?.tiktok || ''} onChange={handleSiteContentChange} />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="px-6 py-2 rounded-md bg-secondary text-primary font-bold hover:bg-gold-light transition-colors">Save Site Content</button>
                            </div>
                        </form>
                    </AdminSection>

                    <div className="mt-8">
                        <AdminSection title="Prayer Requests">
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {prayerRequests.length > 0 ? (
                                    prayerRequests.map(req => (
                                        <div key={req.id} className={`p-4 rounded-lg border-l-4 transition-colors ${req.isPrayedFor ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-grow">
                                                    <p className={`text-text-main dark:text-gray-200 ${req.isPrayedFor ? 'line-through' : ''}`}>{req.request}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        From: {req.name || 'Anonymous'} {req.email && `(${req.email})`}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        Received: {new Date(req.date).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                                                    <button
                                                        onClick={() => togglePrayerRequestPrayedFor(req.id)}
                                                        className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${req.isPrayedFor ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                                    >
                                                        {req.isPrayedFor ? 'Unmark' : 'Prayed'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this prayer request?')) {
                                                                deletePrayerRequest(req.id);
                                                            }
                                                        }}
                                                        className="text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-main dark:text-gray-400">No pending prayer requests.</p>
                                )}
                            </div>
                        </AdminSection>

                        <AdminSection title="Church Information">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Address Line 1
                                    </label>
                                    <input
                                        type="text"
                                        value={siteContent?.contactInfo?.addressLine1 || ''}
                                        onChange={(e) => updateSiteContent({ ...siteContent, contactInfo: { ...siteContent?.contactInfo, addressLine1: e.target.value } })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., 123 Church Street"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Address Line 2
                                    </label>
                                    <input
                                        type="text"
                                        value={siteContent?.contactInfo?.addressLine2 || ''}
                                        onChange={(e) => updateSiteContent({ ...siteContent, contactInfo: { ...siteContent?.contactInfo, addressLine2: e.target.value } })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., Kitale, Kenya"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={siteContent?.contactInfo?.email || ''}
                                        onChange={(e) => updateSiteContent({ ...siteContent, contactInfo: { ...siteContent?.contactInfo, email: e.target.value } })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., info@church.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Phone 1
                                    </label>
                                    <input
                                        type="tel"
                                        value={siteContent?.contactInfo?.phone1 || ''}
                                        onChange={(e) => updateSiteContent({ ...siteContent, contactInfo: { ...siteContent?.contactInfo, phone1: e.target.value } })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., +254 700 000 000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Phone 2
                                    </label>
                                    <input
                                        type="tel"
                                        value={siteContent?.contactInfo?.phone2 || ''}
                                        onChange={(e) => updateSiteContent({ ...siteContent, contactInfo: { ...siteContent?.contactInfo, phone2: e.target.value } })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., +254 700 000 001"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        // The updateSiteContent function should already save to backend
                                        alert('Church information saved successfully!');
                                    }}
                                    className="w-full bg-secondary text-primary font-bold px-6 py-3 rounded-md hover:bg-gold-light transition-colors mt-4"
                                >
                                    Save Church Information
                                </button>
                            </div>
                        </AdminSection>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <AdminSection title="Manage Sermons">
                            <button className="bg-secondary text-primary font-bold px-4 py-2 rounded-md hover:bg-gold-light transition-colors mb-4" onClick={() => handleOpenModal('sermon')}>Add New Sermon</button>
                            <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                                {sortedSermons.map((sermon, index) => (
                                    <AdminItem 
                                        key={sermon.id} 
                                        title={sermon.title}
                                        orderLabel={`${index + 1}`}
                                        onMoveUp={index === 0 ? undefined : () => handleMoveSermon(sermon.id, 'up')}
                                        onMoveDown={index === sortedSermons.length - 1 ? undefined : () => handleMoveSermon(sermon.id, 'down')}
                                        onEdit={() => handleOpenModal('sermon', sermon)} 
                                        onDelete={() => handleDelete('sermon', sermon.id)} 
                                    />
                                ))}
                            </div>
                        </AdminSection>

                        <AdminSection title="Manage Announcements">
                            <button className="bg-secondary text-primary font-bold px-4 py-2 rounded-md hover:bg-gold-light transition-colors mb-4" onClick={() => handleOpenModal('announcement')}>Add New Announcement</button>
                            <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                                {announcements.map((announcement) => (
                                    <AdminItem key={announcement.id} title={announcement.title} onEdit={() => handleOpenModal('announcement', announcement)} onDelete={() => handleDelete('announcement', announcement.id)} />
                                ))}
                            </div>
                        </AdminSection>
                        
                        <AdminSection title="Manage Events">
                            <button className="bg-secondary text-primary font-bold px-4 py-2 rounded-md hover:bg-gold-light transition-colors mb-4" onClick={() => handleOpenModal('event')}>Add New Event</button>
                             <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                                {events.map((event) => (
                                    <AdminItem key={event.id} title={event.title} onEdit={() => handleOpenModal('event', event)} onDelete={() => handleDelete('event', event.id)} />
                                ))}
                            </div>
                        </AdminSection>

                        <AdminSection title="Manage Bible Studies">
                            <button className="bg-secondary text-primary font-bold px-4 py-2 rounded-md hover:bg-gold-light transition-colors mb-4" onClick={() => setModalConfig({ isOpen: true, type: 'bibleStudy', item: null })}>Add New Bible Study</button>
                             <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                                {bibleStudies.map((study) => (
                                    <AdminItem key={study.id} title={study.title} onEdit={() => setModalConfig({ isOpen: true, type: 'bibleStudy', item: study })} onDelete={() => handleDelete('bibleStudy', study.id)} />
                                ))}
                            </div>
                        </AdminSection>

                        <AdminSection title="User Role Management">
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {users.map((userItem) => {
                                    // Support both profilePictureUrl and profilePicture
                                    const profilePic = userItem.profilePictureUrl || (userItem as any).profilePicture;
                                    return (
                                    <div key={userItem.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
                                        <div className="flex items-center gap-4">
                                            {profilePic ? (
                                                <img src={profilePic} alt={userItem.name} className="w-10 h-10 rounded-full object-cover"/>
                                            ) : (
                                                 <span className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-primary dark:text-secondary">
                                                    {(userItem.name || '?').charAt(0).toUpperCase()}
                                                 </span>
                                            )}
                                            <div>
                                                <p className="font-semibold text-text-main dark:text-gray-200">{userItem.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</p>
                                                <p className="text-xs mt-1">
                                                    <span
                                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                                                        userItem.isOnline
                                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                      }`}
                                                    >
                                                      <span
                                                        className={`w-2 h-2 rounded-full ${
                                                          userItem.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}
                                                      />
                                                      {userItem.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <select
                                                value={userItem.role}
                                                onChange={(e) => updateUserRole(userItem.id, e.target.value as 'admin' | 'member')}
                                                disabled={userItem.id === authUser?.id}
                                                className="block w-full sm:w-auto px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                aria-label={`Role for ${userItem.name}`}
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                            {authUser && <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">You cannot change your own role.</p>}
                        </AdminSection>
                    </div>
                </div>
            </div>
            <AdminModal config={modalConfig} onClose={handleCloseModal} onSave={handleSave} />
            
            {/* Video Upload Progress Modal */}
            {uploadingVideo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4 text-primary dark:text-white">Uploading Video...</h3>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-3 relative">
                            <div 
                                className="bg-secondary h-6 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 dark:text-white">
                                {uploadProgress}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                            {uploadProgress < 100 ? 'Uploading to Firebase Storage...' : 'Processing video...'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                            Please don't close this page.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPage;