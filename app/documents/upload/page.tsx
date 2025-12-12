'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

type Classification = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';

const UploadDocumentPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [classification, setClassification] = useState<Classification>('UNCLASSIFIED');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        if (!title.trim()) {
            setError('Please provide a title.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('classification', classification);
        formData.append('file', file);

        setIsSubmitting(true);
        setError(null);

        try {
            await api.post('/documents/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            router.push('/documents');
        } catch (err: any) {
            console.error('Failed to upload document:', err);
            const serverData = err.response?.data;
            const errorMessage = serverData?.detail || (serverData ? JSON.stringify(serverData) : 'Failed to upload document. Please check the details and try again.');
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Upload New Document</h1>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit}>
                    {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</p>}
                    
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Add a short description (optional)"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="classification" className="block text-gray-700 text-sm font-bold mb-2">Classification</label>
                        <select
                            id="classification"
                            value={classification}
                            onChange={(e) => setClassification(e.target.value as Classification)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="UNCLASSIFIED">Unclassified</option>
                            <option value="CONFIDENTIAL">Confidential</option>
                            <option value="SECRET">Secret</option>
                            <option value="TOP_SECRET">Top Secret</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="file" className="block text-gray-700 text-sm font-bold mb-2">Document File</label>
                        <input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                        {file && <span className="text-sm text-gray-600 mt-2 block">Selected: {file.name}</span>}
                    </div>
                    
                    <div className="flex items-center justify-end">
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-blue-300"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentPage;