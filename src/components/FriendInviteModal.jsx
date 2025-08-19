// src/components/FriendInviteModal.jsx
import { useState, useEffect, useCallback } from "react";
import { X, Users, Send, Check } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { listFriendships } from "../api/friendships";
import { getProfilesByIds } from "../api/profiles";
import { sendActivityInvitations } from "../api/activityInvitations";

export default function FriendInviteModal({
  isOpen,
  onClose,
  activity,
  onInvitesSent,
}) {
  const { user } = useSupabaseAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get friendships
      const friendships = await listFriendships(user.id);
      const acceptedFriendships = friendships.filter(
        (f) => f.status === "accepted"
      );

      if (acceptedFriendships.length === 0) {
        setFriends([]);
        return;
      }

      // Get friend user IDs
      const friendIds = acceptedFriendships.map((f) =>
        f.user_a === user.id ? f.user_b : f.user_a
      );

      // Get friend profiles
      const friendProfiles = await getProfilesByIds(friendIds);
      setFriends(friendProfiles);
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load user's friends when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadFriends();
    }
  }, [isOpen, user?.id, loadFriends]);

  const handleFriendToggle = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendInvites = async () => {
    if (selectedFriends.length === 0 || !user?.id || !activity?.id) return;

    setSending(true);
    try {
      await sendActivityInvitations(activity.id, selectedFriends, user.id);
      setSent(true);

      // Call callback if provided
      if (onInvitesSent) {
        onInvitesSent(selectedFriends);
      }

      // Auto-close after success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to send invitations:", error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedFriends([]);
    setSent(false);
    onClose();
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen || !user?.id || !activity?.id) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Invite Friends
              </h2>
              <p className="text-sm text-gray-500">to {activity?.title}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {sent ? (
            // Success state
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invitations Sent!
              </h3>
              <p className="text-gray-600">
                Your friends will be notified about the activity
              </p>
            </div>
          ) : loading ? (
            // Loading state
            <div className="py-8 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your friends...</p>
            </div>
          ) : friends.length === 0 ? (
            // No friends state
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Friends Yet
              </h3>
              <p className="text-gray-600">
                Add some friends to invite them to activities!
              </p>
            </div>
          ) : (
            // Friends list
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Select friends to invite to this activity:
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleFriendToggle(friend.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedFriends.includes(friend.id)
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.display_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm border-2 border-white">
                        <span className="text-white text-sm font-semibold">
                          {getInitials(friend.display_name)}
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {friend.display_name}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        selectedFriends.includes(friend.id)
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedFriends.includes(friend.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Send Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSendInvites}
                  disabled={selectedFriends.length === 0 || sending}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedFriends.length > 0 && !sending
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {sending
                    ? "Sending..."
                    : selectedFriends.length === 0
                    ? "Select friends to invite"
                    : `Invite ${selectedFriends.length} friend${
                        selectedFriends.length === 1 ? "" : "s"
                      }`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
