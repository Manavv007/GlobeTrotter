import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Edit3,
  Trash2,
  Reply,
  User,
  X
} from 'lucide-react';

const CommentSection = ({ postId, comments, onCommentsUpdate }) => {
  const { user } = useContext(AuthContext);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (parentCommentId = null) => {
    const text = parentCommentId ? newComment : newComment;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/posts/${postId}/comments`,
        {
          text: text.trim(),
          parentCommentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNewComment('');
        setReplyingTo(null);
        onCommentsUpdate();
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onCommentsUpdate();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to update like');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/comments/${commentId}`,
        { text: editText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setEditingComment(null);
        setEditText('');
        onCommentsUpdate();
        toast.success('Comment updated successfully');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `/api/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onCommentsUpdate();
        toast.success('Comment deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {comment.userId?.profilePicture ? (
              <img
                src={comment.userId.profilePicture}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
                
              />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {comment.userId?.firstName} {comment.userId?.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>

              {comment.userId?._id === user?.userId && (
                <div className="relative">
                  <button className="p-1 hover:bg-gray-200 rounded-full">
                    <MoreHorizontal className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              )}
            </div>

            {editingComment === comment._id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditComment(comment._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditText('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm">{comment.text}</p>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <button
              onClick={() => handleLikeComment(comment._id)}
              className={`flex items-center space-x-1 hover:text-red-600 ${comment.isLiked ? 'text-red-600' : ''
                }`}
            >
              <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likeCount || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment._id)}
                className="flex items-center space-x-1 hover:text-blue-600"
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
            )}

            {comment.userId?._id === user?.userId && (
              <>
                <button
                  onClick={() => {
                    setEditingComment(comment._id);
                    setEditText(comment.text);
                  }}
                  className="flex items-center space-x-1 hover:text-green-600"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="flex items-center space-x-1 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment._id && (
            <div className="mt-3 ml-8">
              <div className="flex space-x-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleAddComment(comment._id)}
                    disabled={loading || !newComment.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setNewComment('');
                    }}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply._id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="font-medium text-gray-900 mb-4">
        Comments ({comments.length})
      </h4>

      {/* Add Comment */}
      <div className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleAddComment()}
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
