"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/adminService';
import FeedbackDetail from '@/components/admin/dashboard/FeedbackDetail';
import AdminProtectedRoute from '@/components/auth/AdminProtectedRoute';

export default function FeedbackDetailPage({ params }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await adminService.getFeedback(params.id);
        setFeedback(data);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        router.push('/admin/feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [params.id, router]);

  const handleRespond = async (feedbackId, responseData) => {
    try {
      const updatedFeedback = await adminService.respondToFeedback(feedbackId, responseData);
      setFeedback(updatedFeedback);
    } catch (error) {
      console.error('Error responding to feedback:', error);
    }
  };

  const handleDelete = async (feedbackId) => {
    try {
      await adminService.deleteFeedback(feedbackId);
      router.push('/admin/feedback');
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminProtectedRoute>
      <FeedbackDetail
        feedback={feedback}
        onRespond={handleRespond}
        onDelete={handleDelete}
      />
    </AdminProtectedRoute>
  );
} 